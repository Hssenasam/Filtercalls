'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Portal } from '@/components/Portal';

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

const VIEWPORT_PADDING = 8;
const MIN_DROPDOWN_WIDTH = 280;
const RECENT_COUNTRIES_KEY = 'fc_recent_countries';

const readRecentCountries = () => {
  if (typeof window === 'undefined') return [] as string[];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_COUNTRIES_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [] as string[];
  }
};

const writeRecentCountry = (iso: string) => {
  if (typeof window === 'undefined') return;
  const next = [iso, ...readRecentCountries().filter((item) => item !== iso)].slice(0, 6);
  window.localStorage.setItem(RECENT_COUNTRIES_KEY, JSON.stringify(next));
};

export const CountryCombobox = ({ countries, selectedIso, onSelect, className }: CountryComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [recentIsos, setRecentIsos] = useState<string[]>([]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: MIN_DROPDOWN_WIDTH
  });

  useEffect(() => {
    setRecentIsos(readRecentCountries());
  }, []);

  const selected = useMemo(
    () => countries.find((country) => country.iso === selectedIso) ?? countries[0],
    [countries, selectedIso]
  );

  const filteredCountries = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    if (!lowerQuery) return countries;

    const scored = countries
      .map((country) => {
        const byIso = country.iso.toLowerCase() === lowerQuery;
        const byDial = country.dialCode === lowerQuery.replace(/^\+/, '');
        const startsWithName = country.name.toLowerCase().startsWith(lowerQuery);
        const includes = `${country.name} ${country.iso} ${country.dialCode}`.toLowerCase().includes(lowerQuery);
        const score = byIso ? 4 : byDial ? 3 : startsWithName ? 2 : includes ? 1 : 0;
        return { country, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.country.name.localeCompare(b.country.name));

    return scored.map((item) => item.country);
  }, [countries, query]);

  const recentCountries = useMemo(() => {
    const map = new Map(countries.map((country) => [country.iso, country]));
    return recentIsos.map((iso) => map.get(iso)).filter(Boolean) as CountryOption[];
  }, [countries, recentIsos]);

  const updateDropdownPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    const maxWidth = Math.max(220, viewportWidth - VIEWPORT_PADDING * 2);
    const width = Math.min(Math.max(rect.width, MIN_DROPDOWN_WIDTH), maxWidth);
    const maxLeft = viewportWidth - width - VIEWPORT_PADDING;
    const left = Math.max(VIEWPORT_PADDING, Math.min(rect.left, maxLeft));

    setDropdownStyle({
      top: rect.bottom + 4,
      left,
      width
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    updateDropdownPosition();
    window.setTimeout(() => searchRef.current?.focus(), 0);

    const handleWindowUpdate = () => updateDropdownPosition();

    window.addEventListener('resize', handleWindowUpdate);
    window.addEventListener('scroll', handleWindowUpdate, true);

    return () => {
      window.removeEventListener('resize', handleWindowUpdate);
      window.removeEventListener('scroll', handleWindowUpdate, true);
    };
  }, [open, updateDropdownPosition]);

  const handleSelect = (iso: string) => {
    writeRecentCountry(iso);
    setRecentIsos(readRecentCountries());
    onSelect(iso);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className={cn('relative w-full', className)}>
      <button
        ref={triggerRef}
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
        <Portal>
          <>
            <button
              type="button"
              aria-label="Close country dropdown"
              className="fixed inset-0 z-[9998] bg-transparent"
              onMouseDown={() => setOpen(false)}
            />
            <div
              className="fixed z-[9999] rounded-xl border border-white/15 bg-[#0b1020] p-2 shadow-2xl"
              style={{
                top: dropdownStyle.top,
                left: dropdownStyle.left,
                width: dropdownStyle.width,
                maxHeight: 'min(22rem, calc(100vh - 1rem - var(--dropdown-top, 0px)))',
                ['--dropdown-top' as string]: `${dropdownStyle.top}px`
              }}
            >
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <Input
                  ref={searchRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search country or code..."
                  className="h-11 pl-9"
                />
              </div>
              {!query && recentCountries.length ? (
                <div className="mt-3">
                  <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted">Recent</p>
                  <div className="grid gap-1">
                    {recentCountries.map((country) => (
                      <button
                        type="button"
                        key={`recent-${country.iso}`}
                        className="flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white/10"
                        onClick={() => handleSelect(country.iso)}
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span aria-hidden>{getFlagEmoji(country.iso)}</span>
                          <span className="truncate">{country.name}</span>
                        </div>
                        <span className="font-mono text-muted">+{country.dialCode}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="mt-2 max-h-72 overflow-y-auto">
                {filteredCountries.map((country) => (
                  <button
                    type="button"
                    key={country.iso}
                    className={cn(
                      'flex min-h-11 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white/10',
                      country.iso === selectedIso && 'bg-white/10'
                    )}
                    onClick={() => handleSelect(country.iso)}
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
          </>
        </Portal>
      ) : null}
    </div>
  );
};
