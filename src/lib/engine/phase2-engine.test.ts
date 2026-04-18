import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aggregateLayers } from '@/lib/engine/aggregator';
import { POST } from '@/app/api/analyze/route';
import { ProviderResult } from '@/lib/providers/types';

const providerLookupMock = vi.fn<() => Promise<ProviderResult>>();

vi.mock('@/lib/providers/chain', () => ({
  providerChainLookup: () => providerLookupMock()
}));

class MemoryCache {
  private readonly values = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async put(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }
}

const postAnalyze = async (url = 'http://localhost/api/analyze') =>
  POST(
    new Request(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ number: '+12015550100' })
    })
  );

describe('phase 2 engine checks', () => {
  beforeEach(() => {
    globalThis.CACHE_LOOKUPS = new MemoryCache();
    providerLookupMock.mockResolvedValue({
      ok: true,
      risk: 62,
      trust: 38,
      confidence: 0.7,
      evidence: ['line_type=voip', 'provider=mock'],
      source: 'mock-provider'
    });
  });

  afterEach(() => {
    providerLookupMock.mockReset();
    globalThis.CACHE_LOOKUPS = undefined;
  });

  it('returns 4 layers and engine version 2.0.0', async () => {
    const response = await postAnalyze();
    const body = (await response.json()) as { layers: Array<{ confidence: number }>; engine_version: string };

    expect(response.status).toBe(200);
    expect(body.layers).toHaveLength(4);
    expect(body.layers.reduce((sum, layer) => sum + layer.confidence, 0)).toBeGreaterThan(1);
    expect(body.engine_version).toBe('2.0.0');
  });

  it('supports MISS -> HIT -> BYPASS cache flow', async () => {
    const first = await postAnalyze();
    const second = await postAnalyze();
    const third = await postAnalyze('http://localhost/api/analyze?fresh=1');

    expect(first.headers.get('x-fc-cache')).toBe('MISS');
    expect(second.headers.get('x-fc-cache')).toBe('HIT');
    expect(third.headers.get('x-fc-cache')).toBe('BYPASS');
    expect(providerLookupMock).toHaveBeenCalledTimes(2);
  });

  it('keeps 200 response and confidence 0 when provider result indicates timeout', async () => {
    providerLookupMock.mockResolvedValueOnce({
      ok: false,
      risk: 50,
      trust: 50,
      confidence: 0,
      evidence: ['timeout_2500ms'],
      source: 'mock-timeout'
    });

    const response = await postAnalyze('http://localhost/api/analyze?fresh=1');
    const body = (await response.json()) as { layers: Array<{ name: string; confidence: number }>; engine_version: string };
    const reputationLayer = body.layers.find((layer) => layer.name === 'reputation');

    expect(response.status).toBe(200);
    expect(reputationLayer?.confidence).toBe(0);
    expect(body.engine_version).toBe('2.0.0');
  });

  it('uses neutral aggregate when every layer has zero confidence', () => {
    const aggregate = aggregateLayers([
      { name: 'structure', risk: 0, trust: 100, confidence: 0, evidence: [], latencyMs: 1 },
      { name: 'geography', risk: 100, trust: 0, confidence: 0, evidence: [], latencyMs: 1 },
      { name: 'reputation', risk: 90, trust: 10, confidence: 0, evidence: [], latencyMs: 1 },
      { name: 'behavioral', risk: 10, trust: 90, confidence: 0, evidence: [], latencyMs: 1 }
    ]);

    expect(aggregate).toEqual({ risk: 50, trust: 50, confidence: 0 });
  });

  it('matches expected log-odds aggregation for synthetic inputs', () => {
    const aggregate = aggregateLayers([
      { name: 'structure', risk: 80, trust: 20, confidence: 1, evidence: [], latencyMs: 1 },
      { name: 'geography', risk: 20, trust: 80, confidence: 1, evidence: [], latencyMs: 1 }
    ]);

    expect(aggregate.risk).toBe(47);
    expect(aggregate.trust).toBe(53);
    expect(aggregate.confidence).toBe(1);
  });
});
