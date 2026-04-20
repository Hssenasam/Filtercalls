import test from 'node:test';
import assert from 'node:assert/strict';
import { authenticateApiKey, createApiKeyRecord, sha256 } from './api-key.ts';
import type { D1DatabaseLike } from '../db/d1.ts';

const createDb = () => {
  const keys: Array<Record<string, unknown>> = [];
  const db: D1DatabaseLike = {
    prepare(query: string) {
      return {
        bind: (...values: unknown[]) => ({
          async first() {
            if (query.includes('WHERE key_hash')) {
              const key = keys.find((k) => k.key_hash === values[0]);
              return (key as never) ?? null;
            }
            return null;
          },
          async run() {
            if (query.startsWith('INSERT INTO api_keys')) {
              keys.push({ id: values[0], name: values[1], key_hash: values[2], created_at: values[3], rate_limit_per_min: values[4], revoked_at: null, last_used_at: null });
            }
            if (query.startsWith('UPDATE api_keys SET last_used_at')) {
              const key = keys.find((k) => k.id === values[1]);
              if (key) key.last_used_at = values[0];
            }
            if (query.startsWith('UPDATE api_keys SET revoked_at')) {
              const key = keys.find((k) => k.id === values[1]);
              if (key) key.revoked_at = values[0];
            }
            return {};
          },
          async all() {
            return { results: [] };
          }
        })
      };
    }
  };
  return { db, keys };
};

test('api key lifecycle create -> auth -> revoke -> unauthorized', async () => {
  const { db } = createDb();
  const created = await createApiKeyRecord(db, { name: 'test', rateLimitPerMin: 60 });
  const auth = await authenticateApiKey(db, created.key);
  assert.ok(auth);

  await db.prepare('UPDATE api_keys SET revoked_at = ? WHERE id = ?').bind(Date.now(), created.id).run();
  const revoked = await authenticateApiKey(db, created.key);
  assert.equal(revoked, null);
});

test('listing data does not need full key to authenticate', async () => {
  const { db, keys } = createDb();
  const created = await createApiKeyRecord(db, { name: 'hidden' });
  assert.ok(keys[0].key_hash);
  assert.equal(keys[0].key_hash, await sha256(created.key));
  assert.equal((keys[0] as { key?: string }).key, undefined);
});
