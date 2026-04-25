import type { Metadata } from 'next';
import { Card } from '@/components/ui/card';

export const runtime = 'edge';

export const metadata: Metadata = {
  title: 'Privacy Policy — FilterCalls',
  description: 'FilterCalls privacy policy for analysis, community reputation, sessions, and third-party services.',
  alternates: { canonical: 'https://filtercalls.com/privacy' },
  robots: { index: true, follow: true }
};

const sections = [
  {
    title: 'What we collect',
    body: 'FilterCalls may process phone numbers you submit for analysis, account details needed for login, usage counters for plan limits, and community report metadata such as report category and severity.'
  },
  {
    title: 'What we do not publicly expose',
    body: 'Public reputation pages do not show raw phone numbers or reporter identities. Public pages use aggregated signals, hash previews, and reputation summaries.'
  },
  {
    title: 'Community reports and SHA-256 hashing',
    body: 'When a number is submitted to the community reputation network, FilterCalls uses SHA-256 hashing for the phone-number reputation key. This lets reports be grouped without displaying raw numbers publicly.'
  },
  {
    title: 'Cookies and sessions',
    body: 'We use cookies and session tokens to keep users signed in, protect portal actions, and apply plan limits. Some cookies are required for security and account functionality.'
  },
  {
    title: 'Third-party services',
    body: 'FilterCalls may use APILayer for phone intelligence, Stripe for billing, Formspree for custom-plan contact forms, and Cloudflare for hosting, edge execution, DNS, and abuse protection.'
  },
  {
    title: 'Your rights',
    body: 'You can contact us to ask questions about your data, request correction, or request deletion where applicable. We will review requests based on account ownership, safety, and legal requirements.'
  }
];

export default function PrivacyPage() {
  return (
    <section className="space-y-10">
      <div className="max-w-3xl space-y-4">
        <p className="inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-violet-200">Privacy</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">Privacy Policy</h1>
        <p className="text-sm leading-6 text-white/55">Effective date: April 2026. This policy explains how FilterCalls handles analysis, account, billing, and community reputation data in clear language.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title} className="space-y-3 border border-white/10 bg-white/[0.03]">
            <h2 className="text-xl font-semibold text-white">{section.title}</h2>
            <p className="text-sm leading-6 text-white/55">{section.body}</p>
          </Card>
        ))}
      </div>

      <Card className="space-y-3 border border-emerald-400/20 bg-emerald-400/[0.04]">
        <h2 className="text-xl font-semibold text-white">Privacy-first public reputation</h2>
        <p className="text-sm leading-6 text-white/60">Community reputation data is designed to be useful without exposing sensitive details publicly. Reports are aggregated, public pages avoid raw phone numbers, and reporter identities are not shown.</p>
      </Card>

      <Card className="space-y-3 border border-white/10 bg-white/[0.03]">
        <h2 className="text-xl font-semibold text-white">Contact</h2>
        <p className="text-sm leading-6 text-white/55">Questions about privacy? Contact us at <a href="mailto:contact@filtercalls.com" className="text-violet-200 hover:text-violet-100">contact@filtercalls.com</a>.</p>
      </Card>
    </section>
  );
}
