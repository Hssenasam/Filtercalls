import { LayerResult } from '@/lib/engine/layer-types';

interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

declare global {
  // eslint-disable-next-line no-var
  var CACHE_LOOKUPS: KVNamespaceLike | undefined;
  // eslint-disable-next-line no-var
  var SEEN: KVNamespaceLike | undefined;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const behavioralLayer = async (e164: string): Promise<LayerResult> => {
  const startedAt = performance.now();
  const namespace = globalThis.SEEN;

  if (!namespace) {
    return {
      name: 'behavioral',
      risk: 50,
      trust: 50,
      confidence: 0,
      evidence: ['kv_unavailable'],
      latencyMs: Math.max(1, Math.round(performance.now() - startedAt))
    };
  }

  const key = `seen:${e164}`;
  const existing = await namespace.get(key);
  const count = Number(existing ?? '0') + 1;
  await namespace.put(key, String(count), { expirationTtl: 7 * 24 * 60 * 60 });

  const risk = clamp(20 + Math.round(Math.min(count, 25) * 2.2), 0, 100);
  const trust = clamp(100 - risk, 0, 100);
  const confidence = count <= 1 ? 0.15 : Math.min(0.65, 0.1 + count * 0.03);

  return {
    name: 'behavioral',
    risk,
    trust,
    confidence,
    evidence: [`seen_count=${count}`],
    latencyMs: Math.max(1, Math.round(performance.now() - startedAt))
  };
};
