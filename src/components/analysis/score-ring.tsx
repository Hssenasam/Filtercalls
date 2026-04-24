'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type ScoreTone = 'risk' | 'trust' | 'confidence';

type ToneClasses = {
  stroke: string;
  text: string;
  badge: string;
};

const clampScore = (score: number) => Math.max(0, Math.min(100, Math.round(score)));

export const getScoreToneClasses = (score: number, tone: ScoreTone): ToneClasses => {
  const value = clampScore(score);

  if (tone === 'risk') {
    if (value >= 70) return { stroke: '#f87171', text: 'text-red-300', badge: 'border-red-400/25 bg-red-400/10 text-red-200' };
    if (value >= 35) return { stroke: '#fbbf24', text: 'text-amber-300', badge: 'border-amber-400/25 bg-amber-400/10 text-amber-200' };
    return { stroke: '#34d399', text: 'text-emerald-300', badge: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' };
  }

  if (tone === 'trust') {
    if (value >= 70) return { stroke: '#34d399', text: 'text-emerald-300', badge: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' };
    if (value >= 40) return { stroke: '#fbbf24', text: 'text-amber-300', badge: 'border-amber-400/25 bg-amber-400/10 text-amber-200' };
    return { stroke: '#f87171', text: 'text-red-300', badge: 'border-red-400/25 bg-red-400/10 text-red-200' };
  }

  if (value >= 75) return { stroke: '#a78bfa', text: 'text-violet-200', badge: 'border-violet-400/25 bg-violet-400/10 text-violet-200' };
  if (value >= 50) return { stroke: '#fbbf24', text: 'text-amber-300', badge: 'border-amber-400/25 bg-amber-400/10 text-amber-200' };
  return { stroke: '#f87171', text: 'text-red-300', badge: 'border-red-400/25 bg-red-400/10 text-red-200' };
};

const inferTone = (label: string): ScoreTone => {
  const normalized = label.toLowerCase();
  if (normalized.includes('trust')) return 'trust';
  if (normalized.includes('confidence')) return 'confidence';
  return 'risk';
};

export const ScoreRing = ({ label, score, tone }: { label: string; score: number; tone?: ScoreTone }) => {
  const value = clampScore(score);
  const resolvedTone = tone ?? inferTone(label);
  const classes = getScoreToneClasses(value, resolvedTone);
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="rounded-xl border border-white/15 bg-white/5 p-4 text-center">
      <div className="relative mx-auto h-28 w-28" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
        <svg className="h-full w-full" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r={radius} stroke="rgba(255,255,255,0.10)" strokeWidth="9" fill="none" />
          <motion.circle
            cx="60"
            cy="60"
            r={radius}
            stroke={classes.stroke}
            strokeWidth="9"
            fill="none"
            strokeDasharray={circumference}
            strokeLinecap="round"
            transform="rotate(-90 60 60)"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className={cn('text-2xl font-semibold', classes.text)}>{value}</p>
          <span className={cn('mt-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide', classes.badge)}>
            {resolvedTone}
          </span>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">{label}</p>
    </div>
  );
};
