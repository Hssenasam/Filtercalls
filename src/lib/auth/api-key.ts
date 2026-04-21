import type { D1DatabaseLike } from '../db/d1.ts';

export type ApiKeyRow = {
  id: string;
  name: string | null;
  key_hash: string;
  created_at: number;
  last_used_at: number | null;
  revoked_at: number | null;
  rate_limit_per_min: number | null;
  user_id: string | null;
};

const hex = (data: ArrayBuffer) => Array.from(new Uint8Array(data)).map((b) => b.toString(16).padStart(2, '0')).join('');

export const sha256 = async (value: string) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));

export const generateApiKey = () => {
  const random = crypto.getRandomValues(new Uint8Array(24));
  const token = Array.from(random).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `fc_live_${token}`;
};

export const secureEquals = async (a: string, b: string) => {
  const [ha, hb] = await Promise.all([sha256(a), sha256(b)]);
  let mismatch = ha.length === hb.length ? 0 : 1;
  const length = Math.max(ha.length, hb.length);

  for (let i = 0; i < length; i += 1) {
    mismatch |= (ha.charCodeAt(i) || 0) ^ (hb.charCodeAt(i) || 0);
  }

  return mismatch === 0;
};

export const isAdminAuthorized = async (provided: string | null) => {
  const globalRef = globalThis as unknown as {
    ADMIN_TOKEN?: unknown;
    ENV?: { ADMIN_TOKEN?: unknown };
    __env__?: { ADMIN_TOKEN?: unknown };
  };

  const expectedRaw =
    (typeof globalRef.ADMIN_TOKEN === 'string' && globalRef.ADMIN_TOKEN) ||
    (typeof globalRef.ENV?.ADMIN_TOKEN === 'string' && globalRef.ENV.ADMIN_TOKEN) ||
    (typeof globalRef.__env__?.ADMIN_TOKEN === 'string' && globalRef.__env__.ADMIN_TOKEN) ||
    process.env.ADMIN_TOKEN;

  const expected = expectedRaw?.trim();
  const candidate = provided?.trim();

  if (!expected || !candidate) return false;
  return secureEquals(expected, candidate);
};

export const createApiKeyRecord = async (db: D1DatabaseLike, input: { name?: string; rateLimitPerMin?: number }) => {
  const key = generateApiKey();
  const id = crypto.randomUUID();
  const createdAt = Date.now();
  const hash = await sha256(key);
  const rate = Math.max(1, Math.min(10_000, input.rateLimitPerMin ?? 60));

  await db
    .prepare('INSERT INTO api_keys (id, name, key_hash, created_at, rate_limit_per_min, user_id) VALUES (?, ?, ?, ?, ?, NULL)')
    .bind(id, input.name ?? null, hash, createdAt, rate)
    .run();

  return {
    id,
    name: input.name ?? null,
    key,
    created_at: createdAt,
    rate_limit_per_min: rate,
    revoked_at: null as number | null,
    last_used_at: null as number | null
  };
};

export const authenticateApiKey = async (db: D1DatabaseLike | undefined, rawKey: string | null) => {
  if (!db || !rawKey) return null;

  const hash = await sha256(rawKey);
  const row = await db
    .prepare('SELECT id, name, key_hash, created_at, last_used_at, revoked_at, rate_limit_per_min, user_id FROM api_keys WHERE key_hash = ? LIMIT 1')
    .bind(hash)
    .first<ApiKeyRow>();

  if (!row || row.revoked_at) return null;

  await db.prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?').bind(Date.now(), row.id).run();
  return row;
};
