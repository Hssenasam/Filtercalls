'use client';

import Link from 'next/link';
import { PLAN_DEFINITIONS } from '@/lib/billing/plans';

const free = PLAN_DEFINITIONS.free;
const pro = PLAN_DEFINITIONS.pro;

export function HomePricing() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-4xl mx-auto space-y-12">

        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Simple pricing</h2>
          <p className="text-white/45">One upgrade. No fake tiers.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-4">

          <div className="p-6 border border-white/10 rounded-xl">
            <p className="text-white/50">{free.label}</p>
            <p className="text-3xl text-white">${free.monthlyPriceUsd}</p>

            <ul className="text-sm text-white/60 space-y-1">
              <li>{free.limits.monthlyAnalyses} analyses</li>
              <li>{free.limits.apiKeys} API keys</li>
            </ul>

            <Link href="/analysis" className="mt-4 block text-center text-white">
              Analyze now
            </Link>
          </div>

          <div className="p-6 border border-violet-500/20 rounded-xl">
            <p className="text-violet-300">{pro.label}</p>
            <p className="text-3xl text-white">${pro.monthlyPriceUsd}</p>

            <ul className="text-sm text-white/70 space-y-1">
              <li>{pro.limits.monthlyAnalyses} analyses</li>
              <li>{pro.limits.apiKeys} API keys</li>
            </ul>

            <Link href="/login" className="mt-4 block text-center text-white">
              Get Pro
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
}
