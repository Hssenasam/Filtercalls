import { NextRequest, NextResponse } from 'next/server';
import type { CallIntentAnalysis } from '@/lib/engine/types';
import { corsHeaders, rateLimitKey, resolveRequestIdFromHeaders } from './phase3-core';

type DbLike = {
  prepare: (sql: string) => {
    bind: (...values: unknown[]) => {
      first: <T = unknown>() => Promise<T | null>;
      run: () => Promise<unknown>;
      all: <T = unknown>() => Promise<{ results: T[] }>;
    };
  };
};

type KvLike = {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
};

type ApiKeyRecord = { id: string; rate_limit_per_min?: number; revoked_at?: number | null };
type WebhookRecord = { id: string; url: string; secret: string | null; event_types: string | null };

export const optionsResponse = () => new NextResponse(null, { status: 204, headers: corsHeaders });
export const withResponseHeaders = (response: NextResponse, requestId: string) => {
  Object.entries(corsHeaders).forEach(([key, value]) => response.headers.set(key, value));
  response.headers.set('X-Request-ID', requestId);
  return response;
};
export const resolveRequestId = (request: NextRequest) => resolveRequestIdFromHeaders(request.headers);

const asGlobal = globalThis as unknown as { DB?: DbLike; RATE_LIMITS?: KvLike };
export const getDb = () => asGlobal.DB;
const getRateLimitKv = () => asGlobal.RATE_LIMITS;

const toHex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
const hashApiKey = async (raw: string) => toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw)));

export const authenticateApiKey = async (db: DbLike | undefined, apiKey: string | null) => {
  if (!db || !apiKey) return null;
  const record = await db
    .prepare('SELECT id, rate_limit_per_min, revoked_at FROM api_keys WHERE key_hash = ? LIMIT 1')
    .bind(await hashApiKey(apiKey))
    .first<ApiKeyRecord>();
  if (!record || record.revoked_at) return null;
  await db.prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?').bind(Date.now(), record.id).run();
  return record;
};

export const enforceRateLimit = async (request: NextRequest, apiKeyId: string, rateLimitPerMin = 60) => {
  const kv = getRateLimitKv();
  if (!kv) return { ok: true } as const;

  const ip = request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'anonymous';
  const key = rateLimitKey(apiKeyId, ip, Math.floor(Date.now() / 60000));
  const count = Number((await kv.get(key)) ?? '0') + 1;
  await kv.put(key, String(count), { expirationTtl: 70 });

  if (count > rateLimitPerMin) {
    const response = NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    response.headers.set('Retry-After', '60');
    return { ok: false, response } as const;
  }
  return { ok: true } as const;
};

export const persistAnalysis = async (db: DbLike | undefined, requestId: string, payload: { number: string; country?: string; apiKeyId?: string | null }, analysis: CallIntentAnalysis) => {
  if (!db) return;
  await db
    .prepare('INSERT INTO analyses (id, created_at, e164, country, risk_score, risk_level, engine_version, cache_status, layers_json, api_key_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(requestId, Date.now(), analysis.normalized_number ?? payload.number, payload.country ?? null, analysis.risk_score, analysis.nuisance_level, 'engine-v2', 'miss', JSON.stringify(analysis.signals), payload.apiKeyId ?? null)
    .run();
};

export const dispatchWebhooks = async (db: DbLike | undefined, apiKeyId: string, eventType: 'analysis.completed', body: unknown) => {
  if (!db) return;
  const hooks = await db.prepare('SELECT id, url, secret, event_types FROM webhooks WHERE api_key_id = ? AND disabled_at IS NULL').bind(apiKeyId).all<WebhookRecord>();
  await Promise.all(hooks.results.filter((hook) => !hook.event_types || hook.event_types.split(',').map((v) => v.trim()).includes(eventType)).map(async (hook) => {
    const payload = JSON.stringify(body);
    const headers: Record<string, string> = { 'Content-Type': 'application/json', 'X-FilterCalls-Event': eventType };
    if (hook.secret) headers['X-FilterCalls-Signature'] = await hashApiKey(`${hook.secret}:${payload}`);
    await fetch(hook.url, { method: 'POST', headers, body: payload });
  }));
};
