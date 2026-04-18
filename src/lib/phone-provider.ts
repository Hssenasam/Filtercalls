import { parsePhoneNumberFromString } from 'libphonenumber-js/min';

export type PhoneNormalizationSuccess = {
  ok: true;
  e164: string;
  national: string;
  countryIso2: string | null;
  countryCode: string;
  type: string;
};

export type PhoneNormalizationFailure = {
  ok: false;
  error: 'COUNTRY_REQUIRED' | 'INVALID_NUMBER';
};

export type PhoneNormalizationResult = PhoneNormalizationSuccess | PhoneNormalizationFailure;

const normalizeCountry = (country?: string) => country?.toUpperCase() as Parameters<typeof parsePhoneNumberFromString>[1];

export function normalizePhone(raw: string, selectedCountryIso2?: string): PhoneNormalizationResult {
  const trimmed = raw.trim();
  const hasInternationalPrefix = trimmed.startsWith('+') || trimmed.startsWith('00');

  if (!hasInternationalPrefix && !selectedCountryIso2) {
    return { ok: false, error: 'COUNTRY_REQUIRED' };
  }

  const prepared = trimmed.startsWith('00') ? `+${trimmed.slice(2)}` : trimmed;
  const parsed = parsePhoneNumberFromString(prepared, normalizeCountry(selectedCountryIso2));

  if (!parsed || !parsed.isValid()) {
    return { ok: false, error: 'INVALID_NUMBER' };
  }

  return {
    ok: true,
    e164: parsed.number,
    national: parsed.nationalNumber,
    countryIso2: parsed.country ?? null,
    countryCode: parsed.countryCallingCode,
    type: parsed.getType() ?? 'UNKNOWN'
  };
}
