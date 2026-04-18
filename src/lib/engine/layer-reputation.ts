import { AnalyzeContext, LayerResult } from '@/lib/engine/layer-types';
import { providerChainLookup } from '@/lib/providers/chain';

interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

declare global {
  // eslint-disable-next-line no-var
  var CACHE_LOOKUPS: KVNamespaceLike | undefined;
}

const CACHE_TTL = 24 * 60 * 60;

export const reputationLayer = async (
  context: AnalyzeContext
): Promise<{ layer: LayerResult; cacheStatus: 'HIT' | 'MISS' | 'BYPASS' }> => {
  const startedAt = performance.now();
  const cacheKey = `lookup:chain:${context.e164}`;

  if (context.queryFresh) {
    const result = await providerChainLookup(context.e164);
    return {
      cacheStatus: 'BYPASS',
      layer: {
        name: 'reputation',
        risk: result.risk,
        trust: result.trust,
        confidence: result.confidence,
        evidence: result.evidence,
        source: result.source,
        latencyMs: Math.max(1, Math.round(performance.now() - startedAt))
      }
    };
  }

  const cache = globalThis.CACHE_LOOKUPS;
  if (cache) {
    const cached = await cache.get(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as LayerResult;
      return {
        cacheStatus: 'HIT',
        layer: {
          ...parsed,
          latencyMs: Math.max(1, Math.round(performance.now() - startedAt))
        }
      };
    }
  }

  const result = await providerChainLookup(context.e164);
  const layer: LayerResult = {
    name: 'reputation',
    risk: result.risk,
    trust: result.trust,
    confidence: result.confidence,
    evidence: result.evidence,
    source: result.source,
    latencyMs: Math.max(1, Math.round(performance.now() - startedAt))
  };

  if (cache) {
    await cache.put(cacheKey, JSON.stringify(layer), { expirationTtl: CACHE_TTL });
  }

  return { layer, cacheStatus: 'MISS' };
};
