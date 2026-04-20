import type { D1DatabaseLike } from '../db/d1.ts';

type WebhookRow = {
  id: string;
  api_key_id: string;
  url: string;
  secret: string | null;
  event_types: string | null;
  disabled_at: number | null;
};

type WebhookEventType = 'analysis.completed' | 'analysis.high_risk';

const RETRY_DELAYS_MS = [200, 800, 1600];
const SIGNATURE_HEADER = 'X-FC-Signature';

const sleep = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const toHex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');

export const signWebhookPayload = async (secret: string, payload: string) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `sha256=${toHex(signature)}`;
};

const shouldReceiveEvent = (webhook: WebhookRow, event: WebhookEventType) => {
  if (webhook.disabled_at) return false;
  if (!webhook.event_types) return true;
  return webhook.event_types.split(',').map((x) => x.trim()).includes(event);
};

const fetchWithTimeout = async (url: string, init: RequestInit, timeoutMs: number) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
};

const deliverWithRetry = async (webhook: WebhookRow, body: string, event: WebhookEventType) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-FC-Event': event
  };

  if (webhook.secret) {
    headers[SIGNATURE_HEADER] = await signWebhookPayload(webhook.secret, body);
  }

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      const response = await fetchWithTimeout(webhook.url, { method: 'POST', headers, body }, 4_000);
      if (response.ok) return true;
    } catch {
      // no-op
    }

    if (attempt < RETRY_DELAYS_MS.length) {
      await sleep(RETRY_DELAYS_MS[attempt]);
    }
  }

  return false;
};

export const dispatchAnalysisWebhooks = async (args: {
  db?: D1DatabaseLike;
  apiKeyId: string;
  analysisId: string;
  riskScore: number;
  payload: unknown;
  waitUntil?: (promise: Promise<unknown>) => void;
}) => {
  if (!args.db) return;

  const webhooks = await args.db
    .prepare('SELECT id, api_key_id, url, secret, event_types, disabled_at FROM webhooks WHERE api_key_id = ?')
    .bind(args.apiKeyId)
    .all<WebhookRow>();

  const events: WebhookEventType[] = ['analysis.completed'];
  if (args.riskScore >= 80) events.push('analysis.high_risk');

  for (const event of events) {
    const task = Promise.all(
      webhooks.results.filter((w) => shouldReceiveEvent(w, event)).map((webhook) => {
        const body = JSON.stringify({
          id: args.analysisId,
          event,
          created_at: new Date().toISOString(),
          data: args.payload
        });
        return deliverWithRetry(webhook, body, event);
      })
    );

    if (args.waitUntil) args.waitUntil(task);
    else await task;
  }
};

export const webhookSignatureHeaderName = SIGNATURE_HEADER;
