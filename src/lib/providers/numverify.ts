import { PhoneProvider, ProviderResult } from '@/lib/providers/types';

export const numverifyProvider: PhoneProvider = {
  name: 'numverify',
  enabled: () => Boolean(process.env.NUMVERIFY_API_KEY),
  async lookup(e164: string): Promise<ProviderResult> {
    const apiKey = process.env.NUMVERIFY_API_KEY;
    if (!apiKey) {
      return { ok: false, risk: 50, trust: 50, confidence: 0, evidence: ['numverify_disabled'], source: 'numverify' };
    }

    const response = await fetch(`http://apilayer.net/api/validate?access_key=${apiKey}&number=${encodeURIComponent(e164)}`);
    const payload = (await response.json()) as { valid?: boolean; line_type?: string; country_code?: string; carrier?: string };

    if (!response.ok) {
      return { ok: false, risk: 50, trust: 50, confidence: 0, evidence: ['numverify_http_error'], source: 'numverify' };
    }

    const lineType = payload.line_type?.toLowerCase() ?? 'unknown';
    const risk = payload.valid ? (lineType.includes('voip') ? 60 : 30) : 85;
    const trust = payload.valid ? 70 : 20;

    return {
      ok: true,
      risk,
      trust,
      confidence: 0.7,
      evidence: [`valid=${Boolean(payload.valid)}`, `line_type=${lineType}`],
      source: 'numverify',
      metadata: {
        lineType,
        country: payload.country_code,
        carrier: payload.carrier
      }
    };
  }
};
