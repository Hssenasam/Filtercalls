import { describe, expect, it } from 'vitest';
import { runFallbackIntentEngine } from '../src/lib/engine/intent-engine';
import { normalizePhone } from '../src/lib/phone-provider';

describe('phase 1 critical fixes', () => {
  it('sequential numbers produce meaningful score spread', () => {
    const scores: number[] = [];
    for (let i = 0; i < 10; i += 1) {
      const result = runFallbackIntentEngine(`+1201555010${i}`);
      scores.push(result.risk_score);
    }
    expect(Math.max(...scores) - Math.min(...scores)).toBeGreaterThanOrEqual(6);
  });

  it('risk >= 70 never yields safe intent labels', () => {
    const forbidden = new Set(['Likely Safe Personal/Business', 'Unknown but Low-Risk']);
    for (let i = 1000; i < 2000; i += 1) {
      const number = `+1201555${String(i).padStart(4, '0')}`;
      const result = runFallbackIntentEngine(number);
      if (result.risk_score >= 70) {
        expect(forbidden.has(result.probable_intent)).toBe(false);
      }
    }
  });

  it('canadian number is detected as CA context', () => {
    const parsed = normalizePhone('+14165550123');
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.countryIso2).toBe('CA');
    }
  });

  it('us number is detected as US context', () => {
    const parsed = normalizePhone('+12015550100');
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.countryIso2).toBe('US');
    }
  });

  it('missing country with local number returns COUNTRY_REQUIRED', () => {
    const parsed = normalizePhone('2015550100');
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error).toBe('COUNTRY_REQUIRED');
    }
  });

  it('invalid phone returns INVALID_NUMBER', () => {
    const parsed = normalizePhone('abc123', 'US');
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.error).toBe('INVALID_NUMBER');
    }
  });

  it('deterministic outputs for fixed input', () => {
    const a = runFallbackIntentEngine('+12015550100');
    const b = runFallbackIntentEngine('+12015550100');
    expect({ ...a, last_checked_at: 'x' }).toEqual({ ...b, last_checked_at: 'x' });
  });
});
