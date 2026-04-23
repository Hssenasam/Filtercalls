'use client';

import { useEffect, useMemo } from 'react';
import { COUNTRIES, DIAL_TO_COUNTRY, SORTED_DIAL_CODES } from '@/lib/countries';
import { CountryCombobox } from '@/components/CountryCombobox';
import { cn } from '@/lib/utils';

type CountryOption = {
  iso: string;
  name: string;
  dialCode: string;
};

type PhoneInputProps = {
  value: string;
  countryIso: string;
  onValueChange: (value: string) => void;
  onCountryChange: (iso: string) => void;
  placeholder?: string;
  className?: string;
};

const digitsOnly = (value: string) => value.replace(/\D/g, '');

const replaceDialCode = (number: string, nextDialCode: string, previousDialCode: string) => {
  const trimmed = number.trim();
  if (!trimmed) return `+${nextDialCode} `;

  const international = trimmed.startsWith('+') || trimmed.startsWith('00');
  const rawDigits = digitsOnly(trimmed);

  if (!international) {
    const localDigits = rawDigits.startsWith(nextDialCode) ? rawDigits.slice(nextDialCode.length) : rawDigits;
    return `+${nextDialCode}${localDigits ? ` ${localDigits}` : ' '}`;
  }

  const digits = trimmed.startsWith('00') ? rawDigits.slice(2) : rawDigits;
  const stripCandidates = [nextDialCode, previousDialCode].sort((a, b) => b.length - a.length);
  const localDigits = stripCandidates.find((dial) => digits.startsWith(dial))
    ? digits.slice(stripCandidates.find((dial) => digits.startsWith(dial))?.length ?? 0)
    : digits;

  return `+${nextDialCode}${localDigits ? ` ${localDigits}` : ' '}`;
};

const detectCountryFromInput = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed.startsWith('+')) return undefined;

  const digits = digitsOnly(trimmed);
  const matchedDialCode = SORTED_DIAL_CODES.find((dialCode) => digits.startsWith(dialCode));
  if (!matchedDialCode) return undefined;

  return DIAL_TO_COUNTRY.get(matchedDialCode);
};

const uniqueCountries = Array.from(new Map(COUNTRIES.map((country) => [country.iso, country])).values())
  .sort((a, b) => a.name.localeCompare(b.name))
  .map<CountryOption>((country) => ({
    iso: country.iso,
    name: country.name,
    dialCode: country.iso === 'US' ? '1' : country.dialCodes[0]
  }));

const countryByIso = new Map(uniqueCountries.map((country) => [country.iso, country]));

export const detectDefaultCountryFromLocale = () => {
  if (typeof navigator === 'undefined') return 'US';

  const locales = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const locale of locales) {
    const iso = locale?.split('-').pop()?.toUpperCase();
    if (iso && countryByIso.has(iso)) return iso;
  }
  return 'US';
};

export const PhoneInput = ({
  value,
  countryIso,
  onValueChange,
  onCountryChange,
  placeholder = 'Enter phone number...',
  className
}: PhoneInputProps) => {
  const selectedCountry = useMemo(() => {
    return countryByIso.get(countryIso) ?? countryByIso.get('US') ?? uniqueCountries[0];
  }, [countryIso]);

  useEffect(() => {
    const detectedCountry = detectCountryFromInput(value);
    if (detectedCountry && detectedCountry.iso !== countryIso) {
      onCountryChange(detectedCountry.iso);
    }
  }, [value, countryIso, onCountryChange]);

  const handleSelectCountry = (nextIso: string) => {
    const nextCountry = countryByIso.get(nextIso);
    const previousDialCode = selectedCountry.dialCode;

    if (!nextCountry) return;

    onCountryChange(nextIso);
    onValueChange(replaceDialCode(value, nextCountry.dialCode, previousDialCode));
  };

  const handleNumberChange = (nextValue: string) => {
    onValueChange(nextValue);

    const detectedCountry = detectCountryFromInput(nextValue);
    if (detectedCountry && detectedCountry.iso !== countryIso) {
      onCountryChange(detectedCountry.iso);
    }
  };

  return (
    <div
      className={cn(
        'group flex min-h-11 w-full overflow-visible rounded-xl border border-white/20 bg-white/5 transition focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/30',
        className
      )}
    >
      <div className="w-[32%] min-w-[9.5rem] border-r border-white/10 md:w-[30%]">
        <CountryCombobox countries={uniqueCountries} selectedIso={selectedCountry.iso} onSelect={handleSelectCountry} />
      </div>
      <input
        value={value}
        onChange={(event) => handleNumberChange(event.target.value)}
        placeholder={placeholder}
        inputMode="tel"
        className="h-11 w-[68%] flex-1 bg-transparent px-3 font-mono text-sm text-foreground placeholder:text-muted focus-visible:outline-none md:w-[70%]"
      />
    </div>
  );
};
