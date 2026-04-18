import { parsePhoneNumberFromString } from 'libphonenumber-js/min';

export type NormalizeResult =
  | {
      ok: true;
      e164: string;
      national: string;
      countryIso2: string | null;
      countryCode: string;
      type: string;
    }
  | { ok: false; error: 'COUNTRY_REQUIRED' | 'INVALID_NUMBER' };

export const normalizePhone = (raw: string, selectedCountryIso2?: string): NormalizeResult => {
  const trimmed = raw.trim();
  const hasIntl = trimmed.startsWith('+') || trimmed.startsWith('00');

  if (!hasIntl && !selectedCountryIso2) {
    return { ok: false, error: 'COUNTRY_REQUIRED' };
  }

  const prepared = trimmed.startsWith('00') ? `+${trimmed.slice(2)}` : trimmed;
  const parsed = parsePhoneNumberFromString(prepared, selectedCountryIso2?.toUpperCase() as Parameters<typeof parsePhoneNumberFromString>[1]);

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
};
