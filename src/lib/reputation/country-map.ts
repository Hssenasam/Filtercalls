export const CALLING_CODE_TO_COUNTRY: Record<string, { iso: string; name: string; flag: string }> = {
  '1': { iso: 'US', name: 'United States / Canada', flag: '🇺🇸' },
  '20': { iso: 'EG', name: 'Egypt', flag: '🇪🇬' },
  '27': { iso: 'ZA', name: 'South Africa', flag: '🇿🇦' },
  '33': { iso: 'FR', name: 'France', flag: '🇫🇷' },
  '34': { iso: 'ES', name: 'Spain', flag: '🇪🇸' },
  '39': { iso: 'IT', name: 'Italy', flag: '🇮🇹' },
  '44': { iso: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  '49': { iso: 'DE', name: 'Germany', flag: '🇩🇪' },
  '52': { iso: 'MX', name: 'Mexico', flag: '🇲🇽' },
  '55': { iso: 'BR', name: 'Brazil', flag: '🇧🇷' },
  '60': { iso: 'MY', name: 'Malaysia', flag: '🇲🇾' },
  '61': { iso: 'AU', name: 'Australia', flag: '🇦🇺' },
  '62': { iso: 'ID', name: 'Indonesia', flag: '🇮🇩' },
  '63': { iso: 'PH', name: 'Philippines', flag: '🇵🇭' },
  '81': { iso: 'JP', name: 'Japan', flag: '🇯🇵' },
  '82': { iso: 'KR', name: 'South Korea', flag: '🇰🇷' },
  '86': { iso: 'CN', name: 'China', flag: '🇨🇳' },
  '90': { iso: 'TR', name: 'Turkey', flag: '🇹🇷' },
  '91': { iso: 'IN', name: 'India', flag: '🇮🇳' },
  '92': { iso: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  '212': { iso: 'MA', name: 'Morocco', flag: '🇲🇦' },
  '213': { iso: 'DZ', name: 'Algeria', flag: '🇩🇿' },
  '216': { iso: 'TN', name: 'Tunisia', flag: '🇹🇳' },
  '234': { iso: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  '254': { iso: 'KE', name: 'Kenya', flag: '🇰🇪' },
  '351': { iso: 'PT', name: 'Portugal', flag: '🇵🇹' },
  '880': { iso: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  '965': { iso: 'KW', name: 'Kuwait', flag: '🇰🇼' },
  '966': { iso: 'SA', name: 'Saudi Arabia', flag: '🇸🇦' },
  '971': { iso: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' }
};

export const getCallingCode = (e164: string) => {
  const digits = e164.replace(/\D/g, '');
  return Object.keys(CALLING_CODE_TO_COUNTRY).sort((a, b) => b.length - a.length).find((code) => digits.startsWith(code)) ?? null;
};

export const getCountryForCallingCode = (callingCode: string | null | undefined) => callingCode ? CALLING_CODE_TO_COUNTRY[callingCode] ?? null : null;
