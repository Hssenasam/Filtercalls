import { PhoneProvider, ProviderResult } from '@/lib/providers/types';

export const internalProvider: PhoneProvider = {
  name: 'internal',
  enabled: () => true,
  async lookup(e164: string): Promise<ProviderResult> {
    return {
      ok: true,
      risk: 45,
      trust: 55,
      confidence: 0.3,
      evidence: [`internal_fallback_for=${e164}`],
      source: 'internal'
    };
  }
};
