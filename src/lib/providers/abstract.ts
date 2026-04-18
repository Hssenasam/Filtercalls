import { PhoneProvider, ProviderResult } from '@/lib/providers/types';

export const abstractProvider: PhoneProvider = {
  name: 'abstract',
  enabled: () => Boolean(process.env.ABSTRACT_API_KEY),
  async lookup(e164: string): Promise<ProviderResult> {
    const apiKey = process.env.ABSTRACT_API_KEY;
    if (!apiKey) {
      return { ok: false, risk: 50, trust: 50, confidence: 0, evidence: ['abstract_disabled'], source: 'abstract' };
    }

    const response = await fetch(
      `https://phonevalidation.abstractapi.com/v1/?api_key=${apiKey}&phone=${encodeURIComponent(e164)}`
    );

    if (!response.ok) {
      return { ok: false, risk: 50, trust: 50, confidence: 0, evidence: ['abstract_http_error'], source: 'abstract' };
    }

    const payload = (await response.json()) as {
      valid?: boolean;
      type?: string;
      country?: { code?: string };
      carrier?: string;
    };

    const type = payload.type?.toLowerCase() ?? 'unknown';
    const risk = payload.valid ? (type.includes('voip') ? 62 : 35) : 82;
    const trust = payload.valid ? 65 : 15;

    return {
      ok: true,
      risk,
      trust,
      confidence: 0.6,
      evidence: [`valid=${Boolean(payload.valid)}`, `type=${type}`],
      source: 'abstract',
      metadata: {
        lineType: type,
        country: payload.country?.code,
        carrier: payload.carrier
      }
    };
  }
};
