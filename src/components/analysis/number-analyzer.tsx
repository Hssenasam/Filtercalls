'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LoaderCircle, PhoneCall } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AnalysisResultCard } from '@/components/analysis/analysis-result-card';
import { PhoneInput, detectDefaultCountryFromLocale } from '@/components/PhoneInput';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CallIntentAnalysis } from '@/lib/engine/types';

type NumberAnalyzerProps = {
  compact?: boolean;
  initialNumber?: string;
  autoRun?: boolean;
};

const isLikelyValidPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
};

export const NumberAnalyzer = ({ compact = false, initialNumber = '', autoRun = true }: NumberAnalyzerProps) => {
  const router = useRouter();
  const [number, setNumber] = useState(initialNumber.trim());
  const [country, setCountry] = useState('US');
  const [result, setResult] = useState<CallIntentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoRunHandledRef = useRef(false);

  useEffect(() => {
    setCountry(detectDefaultCountryFromLocale());
  }, []);

  useEffect(() => {
    setNumber(initialNumber.trim());
    setResult(null);
    setError(null);
    autoRunHandledRef.current = false;
  }, [initialNumber]);

  const runAnalysis = useCallback(async (overrideNumber?: string) => {
    const targetNumber = (overrideNumber ?? number).trim();

    if (!targetNumber) {
      setResult(null);
      setError('Enter a number above to generate a report.');
      return;
    }

    if (!isLikelyValidPhoneNumber(targetNumber)) {
      setResult(null);
      setError('Use international format: +1 202 555 0100');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: targetNumber, country })
      });

      const payload = await response.json().catch(() => null);
      if (response.status === 401) {
        router.push(`/login?next=${encodeURIComponent(`/analysis?number=${targetNumber}`)}`);
        return;
      }
      if (response.status === 402) {
        throw new Error(payload?.error?.message ?? 'Monthly analysis limit reached for your account.');
      }
      if (!response.ok) {
        throw new Error('analysis_failed');
      }

      setResult(payload as CallIntentAnalysis);
      setNumber(targetNumber);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error && err.message !== 'analysis_failed' ? err.message : 'We could not process this number right now. Please try again in a few seconds.');
    } finally {
      setLoading(false);
    }
  }, [country, number, router]);

  useEffect(() => {
    const incomingNumber = initialNumber.trim();

    if (!autoRun || !incomingNumber || autoRunHandledRef.current) {
      return;
    }

    autoRunHandledRef.current = true;
    void runAnalysis(incomingNumber);
  }, [autoRun, initialNumber, runAnalysis]);

  const handleNumberChange = (value: string) => {
    setNumber(value);
    if (error) setError(null);
    if (result) setResult(null);
  };

  const handleCountryChange = (iso: string) => {
    setCountry(iso);
    if (error) setError(null);
  };

  return (
    <div className="space-y-6">
      <Card className={compact ? 'border border-white/10 bg-white/[0.03]' : undefined}>
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/35">Lookup</p>
              <h2 className="text-lg font-semibold text-white">{compact ? 'Run another analysis' : 'Analyze a phone number'}</h2>
            </div>
            {initialNumber ? <span className="inline-flex w-fit items-center rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-200">Prefilled from homepage</span> : null}
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <PhoneInput value={number} countryIso={country} onValueChange={handleNumberChange} onCountryChange={handleCountryChange} placeholder="+1 202 555 0100" />
            <Button className="h-11 w-full md:w-auto" onClick={() => void runAnalysis()} disabled={loading}>
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Analyze now'}
            </Button>
          </div>

          {initialNumber && !loading && !result && !error ? <p className="text-sm text-white/45">Loaded <span className="font-mono text-white/70">{initialNumber}</span> from the homepage.{autoRun ? ' Your report starts automatically.' : ' You can analyze it without retyping.'}</p> : null}
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
        ) : result ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}><AnalysisResultCard result={result} /></motion.div>
        ) : (
          <Card className="border border-white/10 bg-white/[0.03]">
            <div className="flex flex-col items-start gap-4 text-left sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]"><PhoneCall className="h-5 w-5 text-white/45" /></div>
              <div className="space-y-1">
                <p className="text-base font-medium text-white">Enter a number above to generate a report.</p>
                <p className="text-sm text-white/45">We will return trust scoring, risk signals, and recommended action in one workspace.</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
