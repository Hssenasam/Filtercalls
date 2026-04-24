import { COUNTRIES, COUNTRY_BY_ISO, DIAL_TO_COUNTRY, SORTED_DIAL_CODES } from '@/lib/countries';

export type PhoneValidationState = 'empty' | 'incomplete' | 'invalid' | 'valid';

export type PhoneValidationResult = {
  state: PhoneValidationState;
  normalizedInput: string;
  canonicalNumber: string;
  message: string | null;
  inferredCountryIso?: string;
  exampleInternational: string;
  exampleLocal: string;
  selectedDialCode: string;
  nationalDigits: string;
};

type CountryPhoneRule = {
  minNationalLength: number;
  maxNationalLength: number;
  exampleLocal: string;
  exampleInternational: string;
  trunkPrefix?: string;
};

const DEFAULT_COUNTRY_ISO = 'US';
const DEFAULT_RULE: CountryPhoneRule = {
  minNationalLength: 8,
  maxNationalLength: 12,
  exampleLocal: '2025550100',
  exampleInternational: '+1 202 555 0100'
};

const COUNTRY_PHONE_RULES: Record<string, CountryPhoneRule> = {
  US: { minNationalLength: 10, maxNationalLength: 10, exampleLocal: '2025550100', exampleInternational: '+1 202 555 0100' },
  CA: { minNationalLength: 10, maxNationalLength: 10, exampleLocal: '4165550100', exampleInternational: '+1 416 555 0100' },
  DZ: { minNationalLength: 9, maxNationalLength: 9, exampleLocal: '0794972473', exampleInternational: '+213 794 972 473', trunkPrefix: '0' },
  GB: { minNationalLength: 10, maxNationalLength: 10, exampleLocal: '07911123456', exampleInternational: '+44 7911 123456', trunkPrefix: '0' },
  FR: { minNationalLength: 9, maxNationalLength: 9, exampleLocal: '0612345678', exampleInternational: '+33 6 12 34 56 78', trunkPrefix: '0' },
  DE: { minNationalLength: 10, maxNationalLength: 11, exampleLocal: '015123456789', exampleInternational: '+49 1512 3456789', trunkPrefix: '0' },
  MA: { minNationalLength: 9, maxNationalLength: 9, exampleLocal: '0612345678', exampleInternational: '+212 612345678', trunkPrefix: '0' },
  TN: { minNationalLength: 8, maxNationalLength: 8, exampleLocal: '20123456', exampleInternational: '+216 20 123 456' },
  EG: { minNationalLength: 10, maxNationalLength: 10, exampleLocal: '01012345678', exampleInternational: '+20 101 234 5678', trunkPrefix: '0' },
  SA: { minNationalLength: 9, maxNationalLength: 9, exampleLocal: '0512345678', exampleInternational: '+966 512 345 678', trunkPrefix: '0' },
  AE: { minNationalLength: 9, maxNationalLength: 9, exampleLocal: '0501234567', exampleInternational: '+971 50 123 4567', trunkPrefix: '0' }
};

const digitsOnly = (value: string) => value.replace(/\D/g, '');

export const getDialCodeForCountry = (countryIso: string) => {
  const country = COUNTRY_BY_ISO.get(countryIso) ?? COUNTRY_BY_ISO.get(DEFAULT_COUNTRY_ISO) ?? COUNTRIES[0];
  if (!country) return '1';
  return country.iso === 'US' ? '1' : country.dialCodes[0];
};

export const getPhoneRule = (countryIso: string) => COUNTRY_PHONE_RULES[countryIso] ?? DEFAULT_RULE;

export const getPhoneExamples = (countryIso: string) => {
  const rule = getPhoneRule(countryIso);
  return {
    local: rule.exampleLocal,
    international: rule.exampleInternational
  };
};

export const normalizePhoneDraft = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const converted = trimmed.replace(/^00+/, '+');
  let result = '';
  let hasPlus = false;

  for (const char of converted) {
    if (char >= '0' && char <= '9') {
      result += char;
      continue;
    }
    if (char === '+' && !hasPlus && !result.length) {
      result += '+';
      hasPlus = true;
    }
  }

  return result;
};

export const detectCountryFromPhoneValue = (value: string) => {
  const normalized = normalizePhoneDraft(value);
  if (!normalized.startsWith('+')) return undefined;
  const digits = digitsOnly(normalized);
  const matchedDialCode = SORTED_DIAL_CODES.find((dialCode) => digits.startsWith(dialCode));
  if (!matchedDialCode) return undefined;
  return DIAL_TO_COUNTRY.get(matchedDialCode)?.iso;
};

const stripTrunkPrefix = (digits: string, countryIso: string) => {
  const trunkPrefix = getPhoneRule(countryIso).trunkPrefix;
  if (trunkPrefix && digits.startsWith(trunkPrefix)) {
    return digits.slice(trunkPrefix.length);
  }
  return digits;
};

const getNationalDigits = (value: string, selectedCountryIso: string, inferredCountryIso?: string) => {
  const normalized = normalizePhoneDraft(value);
  const rawDigits = digitsOnly(normalized);
  const activeCountryIso = inferredCountryIso ?? selectedCountryIso;
  const dialCode = getDialCodeForCountry(activeCountryIso);

  if (normalized.startsWith('+')) {
    if (!rawDigits.startsWith(dialCode)) return '';
    return rawDigits.slice(dialCode.length);
  }

  return stripTrunkPrefix(rawDigits, selectedCountryIso);
};

export const buildCanonicalPhoneNumber = (value: string, selectedCountryIso: string) => {
  const normalized = normalizePhoneDraft(value);
  const inferredCountryIso = detectCountryFromPhoneValue(normalized);

  if (!normalized) {
    return {
      canonicalNumber: '',
      normalizedInput: '',
      inferredCountryIso,
      nationalDigits: '',
      selectedDialCode: getDialCodeForCountry(selectedCountryIso)
    };
  }

  if (normalized.startsWith('+')) {
    return {
      canonicalNumber: normalized,
      normalizedInput: normalized,
      inferredCountryIso,
      nationalDigits: getNationalDigits(normalized, selectedCountryIso, inferredCountryIso),
      selectedDialCode: getDialCodeForCountry(inferredCountryIso ?? selectedCountryIso)
    };
  }

  const nationalDigits = getNationalDigits(normalized, selectedCountryIso);
  const selectedDialCode = getDialCodeForCountry(selectedCountryIso);
  return {
    canonicalNumber: nationalDigits ? `+${selectedDialCode}${nationalDigits}` : '',
    normalizedInput: normalized,
    inferredCountryIso,
    nationalDigits,
    selectedDialCode
  };
};

export const validatePhoneNumberInput = (value: string, selectedCountryIso: string): PhoneValidationResult => {
  const normalizedInput = normalizePhoneDraft(value);
  const inferredCountryIso = detectCountryFromPhoneValue(normalizedInput);
  const activeCountryIso = inferredCountryIso ?? selectedCountryIso;
  const examples = getPhoneExamples(activeCountryIso);
  const selectedDialCode = getDialCodeForCountry(activeCountryIso);
  const nationalDigits = getNationalDigits(normalizedInput, selectedCountryIso, inferredCountryIso);
  const { minNationalLength, maxNationalLength } = getPhoneRule(activeCountryIso);
  const canonicalNumber = normalizedInput.startsWith('+')
    ? normalizedInput
    : nationalDigits
      ? `+${getDialCodeForCountry(selectedCountryIso)}${nationalDigits}`
      : '';

  if (!normalizedInput) {
    return {
      state: 'empty',
      normalizedInput,
      canonicalNumber,
      message: 'Select a country and enter a complete phone number.',
      inferredCountryIso,
      exampleInternational: examples.international,
      exampleLocal: examples.local,
      selectedDialCode,
      nationalDigits
    };
  }

  if (normalizedInput === '+') {
    return {
      state: 'incomplete',
      normalizedInput,
      canonicalNumber: '',
      message: `Keep typing after +${selectedDialCode} or paste a complete international number like ${examples.international}.`,
      inferredCountryIso,
      exampleInternational: examples.international,
      exampleLocal: examples.local,
      selectedDialCode,
      nationalDigits
    };
  }

  if (!nationalDigits.length) {
    return {
      state: 'incomplete',
      normalizedInput,
      canonicalNumber: '',
      message: `This number is missing digits for ${COUNTRY_BY_ISO.get(activeCountryIso)?.name ?? activeCountryIso}.`,
      inferredCountryIso,
      exampleInternational: examples.international,
      exampleLocal: examples.local,
      selectedDialCode,
      nationalDigits
    };
  }

  if (nationalDigits.length < minNationalLength) {
    return {
      state: 'incomplete',
      normalizedInput,
      canonicalNumber,
      message: `This number looks incomplete for ${COUNTRY_BY_ISO.get(activeCountryIso)?.name ?? activeCountryIso}. Example: ${examples.international}`,
      inferredCountryIso,
      exampleInternational: examples.international,
      exampleLocal: examples.local,
      selectedDialCode,
      nationalDigits
    };
  }

  if (nationalDigits.length > maxNationalLength) {
    return {
      state: 'invalid',
      normalizedInput,
      canonicalNumber,
      message: `This number is too long for ${COUNTRY_BY_ISO.get(activeCountryIso)?.name ?? activeCountryIso}. Example: ${examples.international}`,
      inferredCountryIso,
      exampleInternational: examples.international,
      exampleLocal: examples.local,
      selectedDialCode,
      nationalDigits
    };
  }

  const fullDigits = digitsOnly(canonicalNumber);
  if (fullDigits.length < 8 || fullDigits.length > 15) {
    return {
      state: 'invalid',
      normalizedInput,
      canonicalNumber,
      message: 'Use a complete international number between 8 and 15 digits.',
      inferredCountryIso,
      exampleInternational: examples.international,
      exampleLocal: examples.local,
      selectedDialCode,
      nationalDigits
    };
  }

  return {
    state: 'valid',
    normalizedInput,
    canonicalNumber,
    message: `Ready to analyze. We will send ${canonicalNumber} for verification and scoring.`,
    inferredCountryIso,
    exampleInternational: examples.international,
    exampleLocal: examples.local,
    selectedDialCode,
    nationalDigits
  };
};
