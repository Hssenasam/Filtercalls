import { abstractProvider } from '@/lib/providers/abstract';
import { internalProvider } from '@/lib/providers/internal';
import { numverifyProvider } from '@/lib/providers/numverify';
import { twilioLookupProvider } from '@/lib/providers/twilio-lookup';
import { PhoneProvider, ProviderResult } from '@/lib/providers/types';

const PROVIDERS: Record<string, PhoneProvider> = {
  twilio: twilioLookupProvider,
  numverify: numverifyProvider,
  abstract: abstractProvider,
  internal: internalProvider
};

const timeoutResult = (providerName: string): ProviderResult => ({
  ok: false,
  risk: 50,
  trust: 50,
  confidence: 0,
  evidence: ['timeout_2500ms'],
  source: providerName
});

const withTimeout = async (provider: PhoneProvider, e164: string): Promise<ProviderResult> =>
  Promise.race([
    provider.lookup(e164),
    new Promise<ProviderResult>((resolve) => {
      setTimeout(() => resolve(timeoutResult(provider.name)), 2500);
    })
  ]);

export const providerChainLookup = async (e164: string): Promise<ProviderResult> => {
  const order = (process.env.PROVIDER_ORDER ?? 'twilio,numverify,abstract,internal')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  for (const providerName of order) {
    const provider = PROVIDERS[providerName];
    if (!provider || !provider.enabled()) continue;

    const result = await withTimeout(provider, e164);
    if (result.ok) return result;
  }

  return internalProvider.lookup(e164);
};
