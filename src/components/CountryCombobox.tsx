'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

type CountryOption = {
  iso: string;
  name: string;
  dialCode: string;
};

export const getFlagEmoji = (isoCode: string): string => {
  const codePoints = isoCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

type CountryComboboxProps = {
  countries: CountryOption[];
  selectedIso: string;
  onSelect: (iso: string) => void;
  className?: string;
};

export const CountryCombobox = ({ countries, selectedIso, onSelect, className }: CountryComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => countries.find((country) => country.iso === selectedIso) ?? countries[0],
    [countries, selectedIso]
  );

  const filteredCountries = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    if (!lowerQuery) return countries;

    return countries.filter((country) => {
      const combined = `${country.name} ${country.iso} ${country.dialCode}`.toLowerCase();
      return combined.includes(lowerQuery);
    });
  }, [countries, query]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const root = rootRef.current;
      if (root && !root.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className={cn('relative w-full', className)} ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-full min-h-11 w-full items-center justify-between rounded-l-xl px-3 text-left text-foreground transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span aria-hidden>{getFlagEmoji(selected.iso)}</span>
            <span className="font-mono">+{selected.dialCode}</span>
          </div>
          <p className="truncate text-xs text-muted">{selected.name}</p>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-muted transition', open && 'rotate-180')} />
      </button>

      {open ? (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-30 w-[min(100vw-2rem,28rem)] rounded-xl border border-white/15 bg-[#0b1020] p-2 shadow-2xl md:max-w-sm">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search country..."
              className="h-11 pl-9"
            />
          </div>
          <div className="mt-2 max-h-72 overflow-y-auto">
            {filteredCountries.map((country) => (
              <button
                type="button"
                key={country.iso}
                className={cn(
                  'flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white/10',
                  country.iso === selectedIso && 'bg-white/10'
                )}
                onClick={() => {
                  onSelect(country.iso);
                  setOpen(false);
                  setQuery('');
                }}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span aria-hidden>{getFlagEmoji(country.iso)}</span>
                  <span className="truncate">{country.name}</span>
                </div>
                <span className="font-mono text-muted">+{country.dialCode}</span>
              </button>
            ))}
            {!filteredCountries.length ? <p className="p-3 text-sm text-muted">No matching countries.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};
