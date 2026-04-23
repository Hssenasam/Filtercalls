'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, ArrowRight, Shield, Globe, Zap } from 'lucide-react';

const CHIPS = [
  { label: '+1 202 555 0100', hint: 'US' },
  { label: '+44 20 7946 0958', hint: 'UK' },
  { label: '+33 1 42 86 83 26', hint: 'FR' },
  { label: '+49 30 12345678', hint: 'DE' },
  { label: '+212 522 123456', hint: 'MA' },
  { label: '+213 21 123456', hint: 'DZ' },
];

const TRUST_ITEMS = [
  { icon: Globe, label: '160+ countries covered' },
  { icon: Zap, label: 'Instant analysis' },
  { icon: Shield, label: 'Trust scored 0–100' },
];

export function HomeHero() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (v: string) => {
    if (!v.trim()) return 'Enter a phone number to continue.';
    if (!/^+?[ds-().]{7,20}$/.test(v.trim()))
      return 'Use international format: +1 202 555 0100';
    return '';
  };

  const handleSubmit = () => {
    const err = validate(value);
    if (err) { setError(err); inputRef.current?.focus(); return; }
    setError('');
    setLoading(true);
    router.push(`/analysis?number=${encodeURIComponent(value.trim())}`);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 pt-24 pb-16 overflow-hidden">
      {/* Background radials — max 2, controlled */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-[15%] w-[400px] h-[400px] bg-indigo-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center text-center gap-8">
        {/* Label pill */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium tracking-wide"
        >
          <Zap className="w-3 h-3" />
          Phone Intelligence Platform
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.08]"
        >
          Know who's calling.
          <br />
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Before you answer.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-white/55 text-lg leading-relaxed max-w-lg"
        >
          Instant spam detection, trust scoring, and number intelligence —
          for individuals and teams building smarter call workflows.
        </motion.p>

        {/* Analyzer card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="w-full"
        >
          <div className="relative rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.03] border border-white/[0.09] p-5 shadow-2xl shadow-black/40">
            {/* top-edge highlight */}
            <div className="absolute top-0 inset-x-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full" />

            {/* Input shell */}
            <div
              className={`flex flex-col sm:flex-row gap-2 rounded-xl border transition-all duration-200 overflow-hidden ${
                error
                  ? 'border-red-500/50 shadow-[0_0_0_3px_rgba(239,68,68,0.12)]'
                  : 'border-white/[0.1] focus-within:border-violet-500/60 focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.15)]'
              } bg-[#0f0f1a]`}
            >
              <div className="flex items-center flex-1 px-4 gap-3">
                <Search className="w-4 h-4 text-white/30 shrink-0" />
                <input
                  ref={inputRef}
                  type="tel"
                  value={value}
                  onChange={(e) => { setValue(e.target.value); if (error) setError(''); }}
                  onKeyDown={handleKey}
                  placeholder="+1 202 555 0100"
                  className="flex-1 bg-transparent text-white placeholder:text-white/25 text-[15px] py-4 outline-none min-w-0"
                />
              </div>
              <div className="px-2 py-2 sm:py-0 sm:flex sm:items-center">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-sm font-medium shadow-lg shadow-violet-500/25 hover:shadow-violet-500/35 transition-all duration-200 active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Analyzing…
                    </>
                  ) : (
                    <>
                      Analyze now
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <p className="mt-2.5 text-sm text-red-400 flex items-center gap-1.5 px-1">
                <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
                {error}
              </p>
            )}
          </div>
        </motion.div>

        {/* Chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex flex-wrap justify-center gap-2"
        >
          {CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => { setValue(chip.label); setError(''); inputRef.current?.focus(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/50 hover:text-white/80 hover:bg-white/[0.09] hover:border-white/[0.14] text-xs transition-all duration-150 hover:-translate-y-0.5"
            >
              <span className="text-white/30 font-mono text-[10px]">{chip.hint}</span>
              {chip.label}
            </button>
          ))}
        </motion.div>

        {/* Trust stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-wrap justify-center gap-x-6 gap-y-2"
        >
          {TRUST_ITEMS.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-white/35 text-xs">
              <Icon className="w-3.5 h-3.5 text-violet-400/60" />
              {label}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
