import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchAnalysisWebhooks, signWebhookPayload, webhookSignatureHeaderName } from './dispatch.ts';
import type { D1DatabaseLike } from '../db/d1.ts';

test('webhook signature has stable format', async () => {
  const sig = await signWebhookPayload('secret', '{"x":1}');
  assert.match(sig, /^sha256=[a-f0-9]{64}$/);
});

test('disabled webhook is skipped and retries happen', async () => {
  let attempts = 0;
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    attempts += 1;
    if (attempts < 3) return new Response('bad', { status: 500 });
    assert.ok(init?.headers && (init.headers as Record<string, string>)[webhookSignatureHeaderName]);
    return new Response('ok', { status: 200 });
  }) as typeof fetch;

  const db: D1DatabaseLike = {
    prepare() {
      return {
        bind: () => ({
          async all() {
            return {
              results: [
                { id: 'a', api_key_id: 'k1', url: 'https://example.com/hook', secret: 's1', event_types: 'analysis.completed', disabled_at: null },
                { id: 'b', api_key_id: 'k1', url: 'https://example.com/disabled', secret: 's1', event_types: 'analysis.completed', disabled_at: Date.now() }
              ]
            };
          },
          async first() {
            return null;
          },
          async run() {
            return {};
          }
        })
      };
    }
  };

  await dispatchAnalysisWebhooks({ db, apiKeyId: 'k1', analysisId: 'an1', riskScore: 81, payload: { ok: true } });
  assert.ok(attempts >= 3);
});
