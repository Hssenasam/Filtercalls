import { runFallbackIntentEngine } from '@/lib/engine/intent-engine';
import { CallIntentAnalysis } from '@/lib/engine/types';

export class AnalyzeInputError extends Error {
  constructor(
    public readonly code: 'COUNTRY_REQUIRED' | 'INVALID_NUMBER',
    message: string
  ) {
    super(message);
  }
}

interface PhoneIntelligenceProvider {
  analyze(number: string, country?: string): Promise<CallIntentAnalysis>;
}

class FallbackProvider implements PhoneIntelligenceProvider {
  async analyze(number: string, country?: string): Promise<CallIntentAnalysis> {
    try {
      return runFallbackIntentEngine(number, { requestedCountry: country });
    } catch (error) {
      if (error instanceof Error && (error.message === 'COUNTRY_REQUIRED' || error.message === 'INVALID_NUMBER')) {
        throw new AnalyzeInputError(error.message, error.message === 'COUNTRY_REQUIRED' ? 'Country is required for local numbers.' : 'Number is invalid.');
      }
      throw error;
    }
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

      if (!response.ok) throw new Error('EXTERNAL_PROVIDER_FAILED');

      const payload = (await response.json()) as {
        country_name?: string;
        location?: string;
        line_type?: string;
        carrier?: string;
        international_format?: string;
        valid?: boolean;
      };

      return runFallbackIntentEngine(number, {
        requestedCountry: country,
        external: {
          country: payload.country_name,
          region: payload.location,
          carrier: payload.carrier,
          lineType: normalizeLineType(payload.line_type),
          formattedNumber: payload.international_format,
          isValid: payload.valid
        }
      });
    } catch (error) {
      if (error instanceof Error && (error.message === 'COUNTRY_REQUIRED' || error.message === 'INVALID_NUMBER')) {
        throw new AnalyzeInputError(error.message, error.message === 'COUNTRY_REQUIRED' ? 'Country is required for local numbers.' : 'Number is invalid.');
      }
      return new FallbackProvider().analyze(number, country);
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
