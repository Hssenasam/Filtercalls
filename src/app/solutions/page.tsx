import Link from 'next/link';
import { ArrowRight, Headphones, ShieldCheck, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';

const useCases = [
  {
    title: 'Customer Support Teams',
    description: 'Reduce unknown caller interruptions and prioritize verified callbacks with risk-scored queues.',
    icon: Headphones
  },
  {
    title: 'Sales Teams',
    description: 'Verify prospect numbers before dialing and reduce wasted outreach on fake or high-risk contacts.',
    icon: TrendingUp
  },
  {
    title: 'Fraud Prevention',
    description: 'Flag high-risk numbers before callbacks, account recovery, or sensitive authentication workflows.',
    icon: ShieldCheck
  }
];

const industries = ['FinTech', 'E-commerce', 'Call Centers', 'SaaS Platforms', 'Marketplaces'];

export default function SolutionsPage() {
  return (
    <section className="space-y-10">
      <div className="max-w-3xl space-y-4">
        <p className="inline-flex rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-indigo-200">Solutions</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">Built for Teams That Need More Than Caller ID</h1>
        <p className="text-lg text-white/60">FilterCalls helps support, sales, and security teams make faster, smarter decisions on every inbound call.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {useCases.map(({ title, description, icon: Icon }) => (
          <Card key={title} className="border border-white/10 bg-white/[0.03]">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/10 text-violet-200"><Icon className="h-5 w-5" /></div>
            <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-white/50">{description}</p>
          </Card>
        ))}
      </div>

      <Card className="space-y-4 border border-white/10 bg-white/[0.03]">
        <h2 className="text-2xl font-semibold text-white">Who uses FilterCalls?</h2>
        <p className="text-sm text-white/50">Designed for workflows where unknown phone numbers create cost, risk, or operational noise.</p>
        <div className="flex flex-wrap gap-2">
          {industries.map((industry) => (
            <span key={industry} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-white/65">{industry}</span>
          ))}
        </div>
      </Card>

      <Card className="flex flex-col gap-4 border border-violet-400/20 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Start with one number.</h2>
          <p className="mt-1 text-sm text-white/50">See the risk score, trust signal, verification context, and recommended action.</p>
        </div>
        <Link href="/analysis" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white">
          Try it free <ArrowRight className="h-4 w-4" />
        </Link>
      </Card>
    </section>
  );
}
