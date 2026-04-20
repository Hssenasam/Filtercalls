'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LoaderCircle } from 'lucide-react';
import { AnalysisResultCard } from '@/components/analysis/analysis-result-card';
import { PhoneInput, detectDefaultCountryFromLocale } from '@/components/PhoneInput';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CallIntentAnalysis } from '@/lib/engine/types';

export const NumberAnalyzer = ({ compact = false }: { compact?: boolean }) => {
  const [number, setNumber] = useState('');
  const [country, setCountry] = useState('US');
  const [result, setResult] = useState<CallIntentAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCountry(detectDefaultCountryFromLocale());
  }, []);

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
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <PhoneInput value={number} countryIso={country} onValueChange={setNumber} onCountryChange={setCountry} />
          <Button className="h-11 w-full md:w-auto" onClick={submit} disabled={loading}>
            {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : 'Analyze Call Intent'}
          </Button>
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
