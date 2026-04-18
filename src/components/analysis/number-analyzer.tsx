'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { LoaderCircle } from 'lucide-react';
import { AnalysisResultCard } from '@/components/analysis/analysis-result-card';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getCountryCallingCode } from 'libphonenumber-js/min';
import { COUNTRIES } from '@/lib/countries';
import { CallIntentAnalysis } from '@/lib/engine/types';

const digitsOnly = (value: string) => value.replace(/\D/g, '');
const isExplicitInternational = (value: string) => value.trim().startsWith('+') || value.trim().startsWith('00');

export const NumberAnalyzer = ({ compact = false }: { compact?: boolean }) => {
  const [number, setNumber] = useState('');
  const [country, setCountry] = useState('US');
  const [prefillMode, setPrefillMode] = useState(false);
  const [result, setResult] = useState<CallIntentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countryDialMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const countryEntry of COUNTRIES) {
      try {
        map.set(countryEntry.iso2, getCountryCallingCode(countryEntry.iso2 as Parameters<typeof getCountryCallingCode>[0]));
      } catch {
        map.set(countryEntry.iso2, '1');
      }
    }
    return map;
  }, []);

  const handleCountryChange = (nextCountry: string) => {
    const nextDial = countryDialMap.get(nextCountry) ?? '1';
    const currentDial = countryDialMap.get(country) ?? '1';

    if (!number.trim()) {
      setCountry(nextCountry);
      setNumber(`+${nextDial} `);
      setPrefillMode(true);
      return;
    }

    if (isExplicitInternational(number)) {
      if (prefillMode && number.trim().startsWith(`+${currentDial}`)) {
        const digits = digitsOnly(number);
        const local = digits.slice(currentDial.length);
        setNumber(`+${nextDial} ${local}`.trim());
        setPrefillMode(true);
      }
      setCountry(nextCountry);
      return;
    }

    const localDigits = digitsOnly(number);
    setNumber(localDigits ? `+${nextDial} ${localDigits}` : `+${nextDial} `);
    setCountry(nextCountry);
    setPrefillMode(true);
  };

  const handleInputChange = (value: string) => {
    setNumber(value);

    if (!value.trim()) {
      setPrefillMode(false);
      return;
    }

    if (isExplicitInternational(value)) {
      const selectedDial = countryDialMap.get(country) ?? '1';
      setPrefillMode(value.trim().startsWith(`+${selectedDial}`));
      return;
    }

    setPrefillMode(false);
  };

  const submit = async () => {
    if (!number.trim()) {
      setError('Enter a valid phone number to analyze intent.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number, country })
      });
      if (!response.ok) throw new Error('analysis_failed');
      const payload = (await response.json()) as CallIntentAnalysis;
      setResult(payload);
    } catch {
      setError('We could not process this number right now. Please retry in a few seconds.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="grid gap-3 md:grid-cols-[1fr_160px_auto]">
          <Input
            value={number}
            placeholder="Enter number (e.g. +213 794 972 433)"
            onChange={(event) => handleInputChange(event.target.value)}
          />
          <select
            className="h-11 rounded-xl border border-white/20 bg-white/5 px-3 text-sm"
            value={country}
            onChange={(event) => handleCountryChange(event.target.value)}
          >
            {COUNTRIES.map((entry) => (
              <option key={entry.iso2} value={entry.iso2}>
                {entry.iso2} (+{countryDialMap.get(entry.iso2) ?? '1'})
              </option>
            ))}
          </select>
          <Button onClick={submit} disabled={loading}>{loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Analyze Call Intent'}</Button>
        </div>
        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      </Card>

      {loading ? (
        <Card className="space-y-3">
          <div className="h-6 w-2/5 animate-pulse rounded bg-white/10" />
          <div className="grid gap-2 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="h-20 animate-pulse rounded-xl bg-white/10" />
            ))}
          </div>
        </Card>
      ) : null}

      {result ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <AnalysisResultCard result={result} />
        </motion.div>
      ) : compact ? null : (
        <Card>
          <p className="text-sm text-muted">
            Every analysis includes intent prediction, risk-trust scoring, and practical action guidance so your team can respond consistently.
          </p>
        </Card>
      )}
    </div>
  );
};
