import { PhoneProvider, ProviderResult } from '@/lib/providers/types';

const basicAuth = (sid: string, token: string) => btoa(`${sid}:${token}`);

export const twilioLookupProvider: PhoneProvider = {
  name: 'twilio',
  enabled: () => Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
  async lookup(e164: string): Promise<ProviderResult> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;

    if (!sid || !token) {
      return { ok: false, risk: 50, trust: 50, confidence: 0, evidence: ['twilio_disabled'], source: 'twilio' };
    }

    const url = `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(e164)}?Fields=line_type_intelligence,caller_name`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Basic ${basicAuth(sid, token)}`
      }
    });

    if (!response.ok) {
      return { ok: false, risk: 50, trust: 50, confidence: 0, evidence: ['twilio_http_error'], source: 'twilio' };
    }

    const payload = (await response.json()) as {
      line_type_intelligence?: { type?: string };
      country_code?: string;
      caller_name?: { caller_name?: string | null };
    };

    const type = payload.line_type_intelligence?.type?.toLowerCase() ?? 'unknown';
    const risk = type.includes('voip') ? 68 : type.includes('mobile') ? 28 : 40;
    const trust = 100 - risk;

    return {
      ok: true,
      risk,
      trust,
      confidence: 0.9,
      evidence: [`line_type=${type}`, `caller_name=${payload.caller_name?.caller_name ?? 'none'}`],
      source: 'twilio',
      metadata: {
        lineType: type,
        country: payload.country_code
      }
    };
  }
};
