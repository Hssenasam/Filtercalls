import { describe, expect, it } from 'vitest';
import { runFallbackIntentEngine } from '@/lib/engine/intent-engine';
import { normalizePhone } from '@/lib/phone-provider';

describe('phase 1 regression checks', () => {
  it('returns COUNTRY_REQUIRED when no country is supplied for local number', () => {
    expect(normalizePhone('2015550100')).toEqual({ ok: false, error: 'COUNTRY_REQUIRED' });
  });

  it('returns INVALID_NUMBER for malformed input', () => {
    expect(normalizePhone('abc123', 'US')).toEqual({ ok: false, error: 'INVALID_NUMBER' });
  });

  it('keeps deterministic output for same input', () => {
    const first = runFallbackIntentEngine('+12015550100');
    const second = runFallbackIntentEngine('+12015550100');
    expect(first.risk_score).toBe(second.risk_score);
    expect(first.trust_score).toBe(second.trust_score);
    expect(first.confidence).toBe(second.confidence);
    expect(first.probable_intent).toBe(second.probable_intent);
  });

  it('maintains sequential variance of at least 6 points', () => {
    const scores = Array.from({ length: 10 }, (_, index) => runFallbackIntentEngine(`+1201555010${index}`).risk_score);
    expect(Math.max(...scores) - Math.min(...scores)).toBeGreaterThanOrEqual(6);
  });
});
