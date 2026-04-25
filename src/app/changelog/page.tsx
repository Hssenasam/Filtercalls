import type { Metadata } from 'next';
import { Card } from '@/components/ui/card';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'Changelog — FilterCalls',
  description: 'Latest product updates in FilterCalls.',
  alternates: { canonical: 'https://filtercalls.com/changelog' },
  robots: { index: true, follow: true }
};

type ChangeTag = 'NEW' | 'IMP' | 'SEC' | 'FIX';

type ChangeItem = {
  tag: ChangeTag;
  text: string;
};

type Release = {
  version: string;
  title: string;
  items: ChangeItem[];
};

const tagStyles: Record<ChangeTag, string> = {
  NEW: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
  IMP: 'border-sky-400/25 bg-sky-400/10 text-sky-200',
  SEC: 'border-violet-400/25 bg-violet-400/10 text-violet-200',
  FIX: 'border-amber-400/25 bg-amber-400/10 text-amber-200'
};

const releases: Array<{ month: string; entries: Release[] }> = [
  {
    month: 'April 2026',
    entries: [
      {
        version: 'v0.9',
        title: 'Public Intelligence Layer',
        items: [
          { tag: 'NEW', text: 'Dynamic sitemap for public reputation pages' },
          { tag: 'NEW', text: 'robots.txt with proper crawler rules' },
          { tag: 'NEW', text: 'SEO metadata and JSON-LD for public pages' },
          { tag: 'NEW', text: 'Risk-aware colors on /report/[hash]' },
          { tag: 'NEW', text: 'Category and severity visual bars' },
          { tag: 'NEW', text: 'Internal linking between report, insights, and analysis' },
          { tag: 'IMP', text: '/report/[hash] is indexed only when community data exists' }
        ]
      },
      {
        version: 'v0.8',
        title: 'PDF Safety Reports',
        items: [
          { tag: 'NEW', text: 'Download PDF Report button in analysis' },
          { tag: 'NEW', text: '/analysis/report print-ready page' },
          { tag: 'NEW', text: 'Phone number masking in reports' },
          { tag: 'NEW', text: 'Plan-aware watermark for Free and Pro reports' },
          { tag: 'NEW', text: 'Static score bars optimized for print' },
          { tag: 'NEW', text: 'Report ID and timestamp' }
        ]
      },
      {
        version: 'v0.7',
        title: 'Caller Reputation Network',
        items: [
          { tag: 'NEW', text: 'Community reports for scam, spam, robocall, and suspicious activity' },
          { tag: 'NEW', text: 'Quick one-click reporting' },
          { tag: 'NEW', text: 'Reputation scoring with category and severity weights' },
          { tag: 'NEW', text: '7-day activity timeline' },
          { tag: 'NEW', text: '/report/[hash] public reputation page' },
          { tag: 'NEW', text: '/insights public intelligence dashboard' },
          { tag: 'NEW', text: 'POST /api/reports and GET /api/reports/summary' },
          { tag: 'SEC', text: 'SHA-256 hashing for the community reputation database' }
        ]
      },
      {
        version: 'v0.6',
        title: 'SaaS Conversion Layer',
        items: [
          { tag: 'NEW', text: 'Guest one free analysis then signup gate' },
          { tag: 'NEW', text: 'Free plan with 20 analyses per month' },
          { tag: 'NEW', text: 'Pro plan with 1,000 analyses per month' },
          { tag: 'NEW', text: 'Custom plan form via Formspree' },
          { tag: 'NEW', text: 'Floating contact widget on public pages' },
          { tag: 'NEW', text: 'About, Contact, Pricing, and Solutions pages upgraded' }
        ]
      },
      {
        version: 'v0.5',
        title: 'Analysis Engine Upgrade',
        items: [
          { tag: 'NEW', text: 'Animated ScoreRing visuals' },
          { tag: 'IMP', text: 'Deterministic scoring without Math.random' },
          { tag: 'IMP', text: 'Repeated, sequential, and placeholder digit detection' }
        ]
      }
    ]
  },
  {
    month: 'March 2026',
    entries: [
      {
        version: 'v0.4',
        title: 'Security Hardening',
        items: [
          { tag: 'SEC', text: 'Rate limiting on /api/analyze' },
          { tag: 'SEC', text: 'Input validation and sanitization' },
          { tag: 'SEC', text: 'Edge runtime enforced on API routes' },
          { tag: 'SEC', text: 'Controlled API error responses without stack traces' }
        ]
      },
      {
        version: 'v0.3',
        title: 'Portal & Billing Foundation',
        items: [
          { tag: 'NEW', text: 'User portal' },
          { tag: 'NEW', text: 'Stripe billing integration foundation' },
          { tag: 'NEW', text: 'Usage tracking per user' }
        ]
      },
      {
        version: 'v0.2',
        title: 'Auth System',
        items: [
          { tag: 'NEW', text: 'Email and password authentication' },
          { tag: 'NEW', text: 'Email verification flow' },
          { tag: 'NEW', text: 'Password reset flow' }
        ]
      },
      {
        version: 'v0.1',
        title: 'Initial Launch',
        items: [
          { tag: 'NEW', text: 'Phone number analysis with APILayer and internal engine' },
          { tag: 'NEW', text: 'Risk score, trust score, and nuisance level' },
          { tag: 'NEW', text: 'Recommended action and signal breakdown' }
        ]
      }
    ]
  }
];

export default function ChangelogPage() {
  return (
    <section className="space-y-10">
      <div className="max-w-3xl space-y-4">
        <p className="inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-violet-200">Changelog</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">What&apos;s New in FilterCalls</h1>
        <p className="text-sm leading-6 text-white/55">We ship fast. Here&apos;s what we&apos;ve been building to turn FilterCalls into the decision layer for unknown calls.</p>
      </div>

      <div className="space-y-10">
        {releases.map((group) => (
          <div key={group.month} className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />
              <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-white/45">{group.month}</h2>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="relative space-y-4 border-l border-violet-400/20 pl-5">
              {group.entries.map((entry) => (
                <Card key={`${entry.version}-${entry.title}`} className="relative border border-white/10 bg-white/[0.03]">
                  <span className="absolute -left-[29px] top-6 h-3 w-3 rounded-full border border-violet-300/40 bg-violet-400 shadow-lg shadow-violet-500/30" />
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-white/60">{entry.version}</span>
                      <h3 className="mt-3 text-xl font-semibold text-white">{entry.title}</h3>
                    </div>
                  </div>
                  <ul className="mt-5 space-y-2">
                    {entry.items.map((item) => (
                      <li key={`${entry.version}-${item.tag}-${item.text}`} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm text-white/65 sm:flex-row sm:items-center">
                        <span className={`inline-flex w-fit rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.16em] ${tagStyles[item.tag]}`}>{item.tag}</span>
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
