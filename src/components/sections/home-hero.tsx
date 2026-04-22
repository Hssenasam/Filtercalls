'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Zap, Code2, LoaderCircle } from 'lucide-react';
import { NumberAnalyzer } from '@/components/analysis/number-analyzer';

// ── Suggestion chips ──────────────────────────────────────────────────────────
const CHIPS = [
  { label: '+213 Algeria', value: '+213' },
  { label: '+1 USA', value: '+1' },
  { label: '+44 UK', value: '+44' },
  { label: 'WhatsApp Number', value: '+1' },
  { label: 'Unknown Caller', value: '+1555' },
];

// ── Trust pills ───────────────────────────────────────────────────────────────
const TRUST_PILLS = [
  { icon: Shield, label: 'Spam Detection', color: 'text-success' },
  { icon: Zap,    label: 'Instant Results', color: 'text-accent'   },
  { icon: Code2,  label: 'API Ready',        color: 'text-primary'  },
];

// ── Hero Search Bar (standalone, large, inline Analyze button) ────────────────
function HeroSearchBar() {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!value.trim()) return;
    setLoading(true);
    // Route to /analysis with pre-filled number so the full analyzer runs there
    router.push(`/analysis?number=${encodeURIComponent(value.trim())}`);
  };

  const fillChip = (val: string) => setValue(val);

  return (
    <div className="w-full space-y-4">
      {/* Input Row */}
      <div
        className="
          relative flex items-center gap-2
          rounded-2xl border border-primary/25
          bg-[#0d1323]/80 px-4 py-3
          shadow-glow backdrop-blur-md
          focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/30
          transition-all duration-200
        "
      >
        {/* Phone icon */}
        <span className="shrink-0 text-lg select-none">📞</span>

        <input
          type="tel"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          placeholder="Enter phone number (e.g. +213 555 123 456)"
          className="
            flex-1 bg-transparent text-[15px] text-foreground placeholder:text-muted/50
            outline-none caret-accent
          "
          autoComplete="tel"
        />

        {/* Inline Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={loading || !value.trim()}
          className="
            shrink-0 inline-flex items-center gap-2
            rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white
            hover:bg-primary/90 disabled:opacity-40
            transition-all duration-150
          "
        >
          {loading
            ? <LoaderCircle className="h-4 w-4 animate-spin" />
            : <><span>Analyze</span><ArrowRight className="h-3.5 w-3.5" /></>}
        </button>
      </div>

      {/* Suggestion Chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted/60 mr-1">Try:</span>
        {CHIPS.map((chip) => (
          <button
            key={chip.label}
            onClick={() => fillChip(chip.value)}
            className="
              rounded-full border border-white/10 bg-white/5
              px-3 py-1 text-xs text-muted
              hover:border-accent/40 hover:text-accent
              transition-colors duration-150
            "
          >
            {chip.label}
          </button>
        ))}

        {/* Try demo button */}
        <button
          onClick={() => { setValue('+12025551234'); setTimeout(handleAnalyze, 80); }}
          className="
            ml-auto rounded-full border border-primary/30 bg-primary/10
            px-3 py-1 text-xs text-primary
            hover:bg-primary/20 transition-colors duration-150
          "
        >
          ✦ Try demo number
        </button>
      </div>
    </div>
  );
}

// ── Main Hero ─────────────────────────────────────────────────────────────────
export const HomeHero = () => (
  <section className="relative overflow-hidden pb-4 pt-16 sm:pt-20">
    {/* Ambient glow blobs */}
    <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[820px] rounded-full bg-primary/10 blur-[110px]" />
    <div className="pointer-events-none absolute top-20 right-0 h-[340px] w-[460px] rounded-full bg-accent/8 blur-[90px]" />

    <div className="relative mx-auto max-w-3xl space-y-8 text-center">

      {/* Eyebrow badge */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        Call Intent Intelligence Platform
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
        className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
      >
        Know if a Call is Safe —{' '}
        <span
          className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent"
          style={{ backgroundSize: '200% 100%' }}
        >
          Instantly
        </span>
      </motion.h1>

      {/* Subheadline */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.14 }}
        className="mx-auto max-w-xl text-base text-muted sm:text-lg"
      >
        Analyze any phone number, detect spam risk, and get trust insights in seconds.
      </motion.p>

      {/* Hero Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.2 }}
        className="mx-auto max-w-2xl text-left"
      >
        <HeroSearchBar />
      </motion.div>

      {/* Trust pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex flex-wrap justify-center gap-6"
      >
        {TRUST_PILLS.map(({ icon: Icon, label, color }) => (
          <span key={label} className={`inline-flex items-center gap-1.5 text-sm ${color}`}>
            <Icon className="h-4 w-4" />
            {label}
          </span>
        ))}
      </motion.div>

    </div>
  </section>
);
