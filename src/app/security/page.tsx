import type { Metadata } from 'next';
import { LockKeyhole, ShieldCheck, Server, EyeOff, Bug, Gauge } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'Security — FilterCalls',
  description: 'How FilterCalls protects privacy with hashing, aggregated reputation data, and edge-first architecture.',
  alternates: { canonical: 'https://filtercalls.com/security' },
  robots: { index: true, follow: true }
};

const commitments = [
  {
    title: 'SHA-256 Community Hashing',
    description: 'Community reputation uses cryptographic hashing so public reputation pages never need raw phone numbers.',
    icon: LockKeyhole
  },
  {
    title: 'No Raw Public Phone Numbers',
    description: 'Public pages show hash previews and aggregated reputation signals, not raw caller numbers.',
    icon: EyeOff
  },
  {
    title: 'Reporter Identity Protection',
    description: 'Reporter details are never exposed publicly. Aggregation keeps reputation useful without exposing individuals.',
    icon: ShieldCheck
  },
  {
    title: 'Edge-First Architecture',
    description: 'FilterCalls runs on Cloudflare Edge patterns for fast responses and reduced centralized infrastructure exposure.',
    icon: Server
  },
  {
    title: 'Controlled Error Responses',
    description: 'API responses are designed to avoid raw stack traces and internal implementation details.',
    icon: Bug
  },
  {
    title: 'Input Validation & Rate Limiting',
    description: 'Inputs are validated before analysis and sensitive routes use limits to reduce abuse.',
    icon: Gauge
  }
];

const dataRows = [
  ['Community-reported numbers', 'SHA-256 hash only', 'Aggregated reputation only'],
  ['Report category/severity', 'Stored as report metadata', 'Aggregated public stats only'],
  ['Reporter identity', 'May be linked internally for authenticated abuse prevention', 'Never exposed publicly'],
  ['Raw IP addresses', 'Not stored as raw IP; abuse prevention uses hashed or limited signals', 'Never exposed publicly'],
  ['Analysis results', 'Processed for requester and usage/plan controls', 'Not exposed publicly']
];

export default function SecurityPage() {
  return (
    <section className="space-y-10">
      <div className="max-w-3xl space-y-4">
        <p className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-emerald-200">Security</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">Security & Privacy by Design</h1>
        <p className="text-sm leading-6 text-white/55">FilterCalls was built with privacy as a product constraint, not an afterthought. Public intelligence should help people make safer decisions without exposing raw phone numbers or reporter identities.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {commitments.map(({ title, description, icon: Icon }) => (
          <Card key={title} className="space-y-4 border border-white/10 bg-white/[0.03]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/50">{description}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card className="space-y-5 border border-white/10 bg-white/[0.03]">
        <div>
          <p className="text-sm font-medium text-violet-200">Data handling</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">What is stored, and what becomes public?</h2>
          <p className="mt-2 text-sm leading-6 text-white/50">We avoid absolute promises that the product architecture cannot prove. The key rule is simple: raw caller numbers and reporter identities are not exposed on public reputation pages.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full overflow-hidden rounded-2xl text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.04] text-white/70">
              <tr>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Storage / Handling</th>
                <th className="px-4 py-3 font-medium">Visibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-white/55">
              {dataRows.map(([data, handling, visibility]) => (
                <tr key={data}>
                  <td className="px-4 py-3 font-medium text-white/75">{data}</td>
                  <td className="px-4 py-3">{handling}</td>
                  <td className="px-4 py-3">{visibility}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="space-y-3 border border-violet-400/20 bg-violet-400/[0.04]">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-violet-200">Responsible disclosure</p>
        <h2 className="text-2xl font-semibold text-white">Found a security issue?</h2>
        <p className="max-w-2xl text-sm leading-6 text-white/55">Email us at <a href="mailto:contact@filtercalls.com" className="text-violet-200 hover:text-violet-100">contact@filtercalls.com</a>. We aim to acknowledge credible security reports within 72 hours.</p>
      </Card>

      <p className="text-xs text-white/35">This page reflects current FilterCalls security practices as of April 2026.</p>
    </section>
  );
}
