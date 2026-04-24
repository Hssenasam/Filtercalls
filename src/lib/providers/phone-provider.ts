import { runFallbackIntentEngine } from '@/lib/engine/intent-engine';
import { CallIntentAnalysis } from '@/lib/engine/types';

interface PhoneIntelligenceProvider {
  analyze(number: string, country?: string): Promise<CallIntentAnalysis>;
}

class FallbackProvider implements PhoneIntelligenceProvider {
  async analyze(number: string, country?: string): Promise<CallIntentAnalysis> {
    return runFallbackIntentEngine(number, { requestedCountry: country });
  }
}

class ApiLayerProvider implements PhoneIntelligenceProvider {
  constructor(private readonly apiKey: string) {}

  async analyze(number: string, country = 'US'): Promise<CallIntentAnalysis> {
    try {
      const response = await fetch(
        `https://api.apilayer.com/number_verification/validate?number=${encodeURIComponent(number)}&country_code=${country}`,
        {
          headers: {
            apikey: this.apiKey
          },
          next: { revalidate: 0 }
        }
      );

      if (!response.ok) throw new Error('External provider failed');

      const payload = (await response.json()) as {
        country_name?: string;
        location?: string;
        line_type?: string;
        carrier?: string;
        international_format?: string;
        valid?: boolean;
      };

      const normalizedLineType = normalizeLineType(payload.line_type);

      return runFallbackIntentEngine(number, {
        requestedCountry: country,
        external: {
          provider: 'apilayer',
          country: payload.country_name,
          region: payload.location,
          carrier: payload.carrier,
          lineType: normalizedLineType,
          formattedNumber: payload.international_format,
          isValid: payload.valid
        }
      });
    } catch (error) {
      console.warn('[phone-provider] APILayer lookup failed; falling back to internal engine', error instanceof Error ? error.message : String(error));
      return runFallbackIntentEngine(number, { requestedCountry: country });
    }
  }
}

const normalizeLineType = (lineType?: string): CallIntentAnalysis['line_type'] | undefined => {
  if (!lineType) return undefined;

  const normalized = lineType.toLowerCase();
  if (normalized.includes('mobile')) return 'mobile';
  if (normalized.includes('landline') || normalized.includes('fixed')) return 'landline';
  if (normalized.includes('voip') || normalized.includes('virtual')) return 'voip';
  return 'unknown';
};

export const getPhoneProvider = (): PhoneIntelligenceProvider => {
  const key = process.env.APILAYER_KEY;
  if (!key) return new FallbackProvider();
  return new ApiLayerProvider(key);
};
