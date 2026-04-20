import test from 'node:test';
import assert from 'node:assert/strict';
import { enforceRateLimit } from './rate-limit.ts';

const makeKv = () => {
  const map = new Map<string, string>();
  return {
    kv: {
      async get(key: string) {
        return map.get(key) ?? null;
      },
      async put(key: string, value: string) {
        map.set(key, value);
      }
    },
    map
  };
};

test('rate limiting counts batch amount not just one request', async () => {
  const { kv } = makeKv();
  const first = await enforceRateLimit({ apiKeyId: 'k1', ip: '1.1.1.1', rateLimitPerMin: 100, amount: 100, kv });
  assert.equal(first.ok, true);

  const second = await enforceRateLimit({ apiKeyId: 'k1', ip: '1.1.1.1', rateLimitPerMin: 100, amount: 1, kv });
  assert.equal(second.ok, false);
});
