'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, LoaderCircle, PhoneCall } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AnalysisResultCard } from '@/components/analysis/analysis-result-card';
import { GuestLimitCard } from '@/components/analysis/guest-limit-card';
import { PhoneInput, detectDefaultCountryFromLocale } from '@/components/PhoneInput';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CallIntentAnalysis } from '@/lib/engine/types';
import { validatePhoneNumberInput } from '@/lib/phone';

type NumberAnalyzerProps = {
  compact?: boolean;
  initialNumber?: string;
  autoRun?: boolean;
};

const trustChips = ['🔒 No raw public numbers', '⚡ Edge-powered analysis', '🛡 Privacy-first reports'];

export const NumberAnalyzer = ({ compact = false, initialNumber = '', autoRun = true }: NumberAnalyzerProps) => {
  const router = useRouter();
  const [number, setNumber] = useState(initialNumber.trim());
  const [country, setCountry] = useState('US');
  const [result, setResult] = useState<CallIntentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guestLimitNumber, setGuestLimitNumber] = useState<string | null>(null);
  const autoRunHandledRef = useRef(false);

  useEffect(() => {
    setCountry(detectDefaultCountryFromLocale());
  }, []);

  useEffect(() => {
    setNumber(initialNumber.trim());
    setResult(null);
    setError(null);
    setGuestLimitNumber(null);
    autoRunHandledRef.current = false;
  }, [initialNumber]);

  const validation = useMemo(() => validatePhoneNumberInput(number, country), [number, country]);

  const runAnalysis = useCallback(async (overrideNumber?: string) => {
    const validationTarget = validatePhoneNumberInput(overrideNumber ?? number, country);

    if (validationTarget.state !== 'valid') {
      setResult(null);
      setGuestLimitNumber(null);
      setError(validationTarget.message ?? 'Enter a complete phone number before analyzing.');
      return;
    }

    setLoading(true);
    setError(null);
    setGuestLimitNumber(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: validationTarget.canonicalNumber, country: validationTarget.inferredCountryIso ?? country })
      });

      const payload = await response.json().catch(() => null);
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/analysis?number=${validationTarget.canonicalNumber}`)}`);
        return;
      }
      if (response.status === 403 && payload?.error?.code === 'GUEST_LIMIT_REACHED') {
        setResult(null);
        setGuestLimitNumber(validationTarget.canonicalNumber);
        setNumber(validationTarget.canonicalNumber);
        return;
      }
      if (response.status === 402) {
        throw new Error(payload?.error?.message ?? 'Monthly analysis limit reached for your account.');
      }
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? 'We could not process this number right now.');
      }

      setResult(payload as CallIntentAnalysis);
      setNumber(validationTarget.canonicalNumber);
    } catch (err) {
      setResult(null);
      setGuestLimitNumber(null);
      setError(err instanceof Error ? err.message : 'We could not process this number right now. Please try again in a few seconds.');
    } finally {
      setLoading(false);
    }
  }, [country, number, router]);

  useEffect(() => {
    const incomingNumber = initialNumber.trim();

    if (!autoRun || !incomingNumber || autoRunHandledRef.current) {
      return;
    }

    const incomingValidation = validatePhoneNumberInput(incomingNumber, country);
    if (incomingValidation.state !== 'valid') {
      setError(incomingValidation.message);
      autoRunHandledRef.current = true;
      return;
    }

    autoRunHandledRef.current = true;
    void runAnalysis(incomingNumber);
  }, [autoRun, country, initialNumber, runAnalysis]);

  const handleNumberChange = (value: string) => {
    setNumber(value);
    if (error) setError(null);
    if (result) setResult(null);
    if (guestLimitNumber) setGuestLimitNumber(null);
  };

  const handleCountryChange = (iso: string) => {
    setCountry(iso);
    if (error) setError(null);
    if (result) setResult(null);
    if (guestLimitNumber) setGuestLimitNumber(null);
  };

  const statusBadge =
    validation.state === 'valid' ? (
      <span className="inline-flex w-fit items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
        <CheckCircle2 className="h-3.5 w-3.5" /> Ready
      </span>
    ) : validation.state === 'empty' ? null : (
      <span className="inline-flex w-fit items-center gap-1 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-200">
        <AlertCircle className="h-3.5 w-3.5" /> {validation.state === 'incomplete' ? 'Incomplete' : 'Needs fixing'}
      </span>
    );

  return (
    <div className="space-y-6">
      <Card className={compact ? 'border border-white/10 bg-white/[0.03]' : undefined}>
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/35">Lookup</p>
              <h2 className="text-lg font-semibold text-white">{compact ? 'Run another analysis' : 'Analyze a phone number'}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {initialNumber ? <span className="inline-flex w-fit items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">Prefilled from homepage</span> : null}
              {statusBadge}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
            <PhoneInput value={number} countryIso={country} onValueChange={handleNumberChange} onCountryChange={handleCountryChange} placeholder="+1 202 555 0100" />
            <Button className="h-11 w-full md:w-auto" onClick={() => void runAnalysis()} disabled={loading || validation.state !== 'valid'}>
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Analyze now'}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {trustChips.map((chip) => (
              <span key={chip} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/40">
                {chip}
              </span>
            ))}
          </div>

          {initialNumber && !loading && !result && !guestLimitNumber && !error ? <p className="text-sm text-white/45">Loaded <span className="font-mono text-white/70">{initialNumber}</span> from the homepage.{autoRun ? ' Your report starts automatically when the number is complete.' : ' You can analyze it without retyping.'}</p> : null}
          {error ? <p className="text-sm text-amber-300/90">{error}</p> : null}
        </div>
      </Card>

      <div className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/35">Report workspace</p>
            <h3 className="text-lg font-semibold text-white">Results</h3>
          </div>
          {result ? <p className="text-xs text-white/35">Latest lookup: <span className="font-mono text-white/60">{number}</span></p> : null}
        </div>

        {loading ? (
          <Card className="space-y-4 border border-white/10 bg-white/[0.03]">
            <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
            <div className="grid gap-3 md:grid-cols-4">{Array.from({ length: 4 }).map((_, idx) => <div key={idx} className="h-20 animate-pulse rounded-xl bg-white/10" />)}</div>
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded bg-white/10" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
              <div className="h-24 w-full animate-pulse rounded-2xl bg-white/10" />
            </div>
          </Card>
        ) : guestLimitNumber ? (
          <GuestLimitCard number={guestLimitNumber} />
        ) : result ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><AnalysisResultCard result={result} /></motion.div>
        ) : (
          <Card className="border border-white/10 bg-white/[0.03]">
            <div className="flex flex-col items-start gap-4 text-left sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]"><PhoneCall className="h-5 w-5 text-white/45" /></div>
              <div className="space-y-1">
                <p className="text-base font-medium text-white">{validation.state === 'valid' ? 'Your number is ready to analyze.' : 'Enter a complete number above to generate a report.'}</p>
                <p className="text-sm text-white/45">{validation.state === 'valid' ? 'Guests get one complete report. Create a free account for 20 monthly analyses.' : 'We now block incomplete or implausible numbers before running a report.'}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
