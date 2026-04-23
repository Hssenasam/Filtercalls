'use client';

import Link from 'next/link';
import type { Route } from 'next';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { PLAN_DEFINITIONS } from '@/lib/billing/plans';

const free = PLAN_DEFINITIONS.free;
const pro = PLAN_DEFINITIONS.pro;

const FREE_FEATURES = [
  `${free.limits.monthlyAnalyses.toLocaleString()} analyses / month`,
  `${free.limits.apiKeys} API keys`,
  `${free.limits.webhooks} webhook`,
  'Full trust scoring',
  'Country and carrier context',
];

const PRO_FEATURES = [
  `${pro.limits.monthlyAnalyses.toLocaleString()} analyses / month`,
  `${pro.limits.apiKeys} API keys`,
  `${pro.limits.webhooks} webhooks`,
  'Full trust scoring',
  'Priority analysis queue',
  'Advanced scam intelligence',
];

export function HomePricing() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto flex flex-col gap-12">

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="text-center max-w-lg mx-auto"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-white/45 text-base leading-relaxed">
            Start free. Scale when you need it.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">

          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="flex flex-col gap-6 p-7 rounded-2xl bg-white/[0.04] border border-white/[0.07]"
          >
            <div>
              <p className="text-white/50 text-sm font-medium mb-3">{free.label}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">${free.monthlyPriceUsd}</span>
                <span className="text-white/40 text-sm">/ month</span>
              </div>
              <p className="text-white/35 text-xs mt-1">No credit card required</p>
            </div>
            <ul className="flex flex-col gap-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-white/55">
                  <Check className="w-4 h-4 text-white/30 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={'/analysis' as Route}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-white/80 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-all duration-200 active:scale-[0.97]"
            >
              Analyze now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="flex flex-col gap-6 p-7 rounded-2xl bg-gradient-to-b from-violet-500/10 to-indigo-500/5 border border-violet-500/20 relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
            <div className="flex items-center justify-between">
              <p className="text-violet-300/80 text-sm font-medium">{pro.label}</p>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/20 text-violet-300 text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                Most popular
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">${pro.monthlyPriceUsd}</span>
                <span className="text-white/40 text-sm">/ month</span>
              </div>
              <p className="text-white/35 text-xs mt-1">Billed monthly, cancel anytime</p>
            </div>
            <ul className="flex flex-col gap-3">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-white/70">
                  <Check className="w-4 h-4 text-violet-400/70 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href={'/portal/login' as Route}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/35 transition-all duration-200 active:scale-[0.97]"
            >
              Get started
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
