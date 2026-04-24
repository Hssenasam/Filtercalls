'use client';

import { useEffect, useMemo } from 'react';
import { COUNTRIES } from '@/lib/countries';
import { CountryCombobox } from '@/components/CountryCombobox';
import { cn } from '@/lib/utils';
import {
  buildCanonicalPhoneNumber,
  detectCountryFromPhoneValue,
  getDialCodeForCountry,
  getPhoneExamples,
  validatePhoneNumberInput
} from '@/lib/phone';

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

const uniqueCountries = Array.from(new Map(COUNTRIES.map((country) => [country.iso, country])).values())
  .sort((a, b) => a.name.localeCompare(b.name))
  .map<CountryOption>((country) => ({
    iso: country.iso,
    name: country.name,
    dialCode: getDialCodeForCountry(country.iso)
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

  const validation = useMemo(() => validatePhoneNumberInput(value, countryIso), [value, countryIso]);
  const examples = useMemo(() => getPhoneExamples(validation.inferredCountryIso ?? countryIso), [validation.inferredCountryIso, countryIso]);

  useEffect(() => {
    const detectedCountryIso = detectCountryFromPhoneValue(value);
    if (detectedCountryIso && detectedCountryIso !== countryIso) {
      onCountryChange(detectedCountryIso);
    }
  }, [value, countryIso, onCountryChange]);

  const handleSelectCountry = (nextIso: string) => {
    const { canonicalNumber, nationalDigits } = buildCanonicalPhoneNumber(value, nextIso);
    onCountryChange(nextIso);

    if (!value.trim()) {
      onValueChange('');
      return;
    }

    if (value.trim().startsWith('+')) {
      onValueChange(canonicalNumber);
      return;
    }

    onValueChange(nationalDigits);
  };

  const handleNumberChange = (nextValue: string) => {
    onValueChange(nextValue);

    const detectedCountryIso = detectCountryFromPhoneValue(nextValue);
    if (detectedCountryIso && detectedCountryIso !== countryIso) {
      onCountryChange(detectedCountryIso);
    }
  };

  const statusTone =
    validation.state === 'valid'
      ? 'text-emerald-300'
      : validation.state === 'invalid'
        ? 'text-red-300'
        : 'text-amber-300';

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'group flex min-h-11 w-full overflow-visible rounded-xl border border-white/20 bg-white/5 transition focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/30',
          validation.state === 'invalid' && 'border-red-400/40 focus-within:border-red-400/60 focus-within:ring-red-400/20',
          className
        )}
      >
        <div className="w-[34%] min-w-[10rem] border-r border-white/10 md:w-[30%]">
          <CountryCombobox countries={uniqueCountries} selectedIso={selectedCountry.iso} onSelect={handleSelectCountry} />
        </div>
        <input
          value={value}
          onChange={(event) => handleNumberChange(event.target.value)}
          placeholder={placeholder}
          inputMode="tel"
          autoComplete="tel-national"
          className="h-11 w-[66%] flex-1 bg-transparent px-3 font-mono text-sm text-foreground placeholder:text-muted focus-visible:outline-none md:w-[70%]"
        />
      </div>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className={cn('text-xs', statusTone)}>{validation.message}</p>
        <p className="text-xs text-white/45">
          Example: <span className="font-mono text-white/70">{examples.international}</span>
        </p>
      </div>
    </div>
  );
};
