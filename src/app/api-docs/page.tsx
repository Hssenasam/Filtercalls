import Link from 'next/link';
import { ArrowRight, Bot, Building2, Clock3, GitBranch, Layers3, Route, ShieldAlert, Users, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const pricingTiers = [
  {
    name: 'Starter',
    price: '$79/mo',
    volume: '25,000 requests / month',
    support: 'Email support within 2 business days',
    profile: 'Internal tools, pilots, smaller ops teams',
    cta: 'Request API access'
  },
  {
    name: 'Growth',
    price: '$349/mo',
    volume: '250,000 requests / month',
    support: 'Priority support and solution guidance',
    profile: 'Support operations, CRM enrichment, mid-market teams',
    cta: 'Talk to sales'
  },
  {
    name: 'Business',
    price: '$1,250/mo',
    volume: '1.5M requests / month',
    support: 'Slack channel + faster SLA-backed support',
    profile: 'Contact centers, fraud teams, multi-product platforms',
    cta: 'Talk to sales'
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    volume: 'High-scale + burst workloads',
    support: 'Dedicated engineering + architecture review',
    profile: 'Telecom, platform APIs, regulated environments',
    cta: 'Join enterprise waitlist'
  }
];

const useCases = [
  {
    icon: Users,
    title: 'Customer support teams',
    value: 'Route likely service calls to priority queues while limiting nuisance traffic and repeat distractions.'
  },
  {
    icon: ShieldAlert,
    title: 'Fraud prevention workflows',
    value: 'Escalate high-risk intent patterns for verification before agents disclose sensitive account details.'
  },
  {
    icon: Layers3,
    title: 'CRM enrichment and lead qualification',
    value: 'Attach trust, intent, and nuisance context to records so sales and success teams work with better contact intelligence.'
  },
  {
    icon: Route,
    title: 'Call routing and contact center operations',
    value: 'Use recommended actions and confidence to automate silence/voicemail/caution flows with policy consistency.'
  },
  {
    icon: Bot,
    title: 'Dialer and telecom integrations',
    value: 'Embed pre-call intelligence into dialers, softphones, and SIP-based systems before human pickup.'
  },
  {
    icon: GitBranch,
    title: 'Workflow orchestration',
    value: 'Trigger downstream workflows in fraud, support, analytics, or QA systems based on intent outcomes.'
  }
];

const fieldReference = [
  ['input_number', 'Original input submitted to the API. Useful for event tracing and audit context.'],
  ['formatted_number', 'Normalized output format for display and downstream systems.'],
  ['country', 'Country inference from numbering intelligence and provider metadata.'],
  ['region', 'Regional location when metadata is available from provider sources.'],
  ['carrier', 'Detected carrier/operator label used for trust context and operations.'],
  ['line_type', 'mobile / landline / voip / unknown classification.'],
  ['is_valid', 'Provider-backed validity indicator when available.'],
  ['risk_score', '0-100 risk estimate indicating harmful or nuisance likelihood.'],
  ['trust_score', '0-100 trust estimate indicating legitimacy confidence.'],
  ['nuisance_level', 'Operational nuisance tier: low, medium, high, critical.'],
  ['probable_intent', 'Most likely call-intent class (scam, spam, outreach, support, etc).'],
  ['confidence', 'Model confidence score for this specific inference.'],
  ['recommended_action', 'Action-ready output: block, silence, voicemail, caution, or answer.'],
  ['signals', 'Explainable signal objects with impact, weight, and detail for transparency.'],
  ['explanation', 'Human-readable reasoning summary for operators and analysts.'],
  ['last_checked_at', 'Timestamp of latest analysis execution.']
];

export default function ApiDocsPage() {
  return (
    <section className="space-y-10">
      <div className="space-y-4">
        <Badge className="border-primary/40 text-primary">FilterCalls API</Badge>
        <h1 className="text-3xl font-semibold sm:text-4xl">Intent intelligence for every inbound call decision.</h1>
        <p className="max-w-3xl text-muted">
          FilterCalls API helps teams move beyond binary spam lookup. Each request returns intent class, risk-trust scoring,
          nuisance severity, explainable signals, and recommended action so systems and humans can decide consistently.
        </p>
        <div className="flex flex-wrap gap-3 text-sm text-muted">
          <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4 text-accent" /> Edge-compatible, low-latency architecture</span>
          <span className="inline-flex items-center gap-1"><Zap className="h-4 w-4 text-warning" /> Action-ready responses for automation</span>
          <span className="inline-flex items-center gap-1"><Building2 className="h-4 w-4 text-success" /> Built for B2B workflows, not consumer lookups</span>
        </div>
      </div>

      <Card>
        <h2 className="text-xl font-semibold">Why FilterCalls API</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <p className="text-sm text-muted">Intent-aware model: classify probable motive, not just &quot;spam vs safe&quot;.</p>
          <p className="text-sm text-muted">Hybrid intelligence: external metadata + internal scoring engine.</p>
          <p className="text-sm text-muted">Explainable outputs: weighted signals and readable reasoning.</p>
          <p className="text-sm text-muted">Designed for system automation and human decision support.</p>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">Developer request and response example</h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="text-sm text-muted">Request</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-accent">{`POST /api/analyze
Content-Type: application/json

{
  "number": "+14155550142",
  "country": "US"
}`}</pre>
          </div>
          <div>
            <p className="text-sm text-muted">Response</p>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs text-success">{`{
  "input_number": "+14155550142",
  "formatted_number": "+1 (415) 555-0142",
  "country": "United States",
  "region": "California",
  "carrier": "Twilio Voice",
  "line_type": "voip",
  "is_valid": true,
  "risk_score": 81,
  "trust_score": 29,
  "nuisance_level": "critical",
  "probable_intent": "Spam / Robocall",
  "confidence": 89,
  "recommended_action": "Silence",
  "signals": [
    {
      "id": "commercial_routing_likelihood",
      "impact": "negative",
      "weight": 15,
      "detail": "Routing indicators align with scaled outbound behavior."
    },
    {
      "id": "regional_context",
      "impact": "positive",
      "weight": 11,
      "detail": "Provider metadata includes regional assignment (California)."
    }
  ],
  "explanation": "This number exhibits patterns consistent with commercial routing and anomaly signals...",
  "last_checked_at": "2026-04-18T08:02:33.329Z"
}`}</pre>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-semibold">How teams integrate</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium">1. Ingest call event</p>
            <p className="mt-2 text-sm text-muted">Forward number and optional country code from dialer, CRM, or telephony edge.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium">2. Score + classify intent</p>
            <p className="mt-2 text-sm text-muted">FilterCalls returns hybrid metadata + intent intelligence in one response payload.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium">3. Automate or assist</p>
            <p className="mt-2 text-sm text-muted">Use recommended actions to drive routing, escalation, suppression, or analyst review.</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {useCases.map((item) => (
          <Card key={item.title}>
            <item.icon className="h-5 w-5 text-accent" />
            <h3 className="mt-3 font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm text-muted">{item.value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <h2 className="text-xl font-semibold">Response field reference</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {fieldReference.map(([field, description]) => (
            <div key={field} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="font-mono text-xs text-accent">{field}</p>
              <p className="mt-1 text-sm text-muted">{description}</p>
            </div>
          ))}
        </div>
      </Card>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">API access plans</h2>
        <div className="grid gap-4 lg:grid-cols-4">
          {pricingTiers.map((tier) => (
            <Card key={tier.name}>
              <p className="text-sm text-muted">{tier.name}</p>
              <p className="mt-1 text-2xl font-semibold">{tier.price}</p>
              <p className="mt-2 text-sm text-muted">{tier.volume}</p>
              <p className="mt-2 text-sm text-muted">{tier.support}</p>
              <p className="mt-2 text-sm text-muted">Ideal for: {tier.profile}</p>
              <Link href="/contact" className="mt-4 inline-flex items-center gap-2 text-sm text-accent hover:underline">
                {tier.cta} <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <Card className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-semibold">Ready to operationalize call intent intelligence?</h3>
          <p className="text-sm text-muted">Bring FilterCalls into your support, fraud, CRM, or routing stack with a simple API integration.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/contact" className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm hover:bg-white/10">Request API access</Link>
          <Link href="/contact" className="rounded-xl bg-primary px-4 py-2.5 text-sm text-white hover:opacity-90">Talk to sales</Link>
        </div>
      </Card>
    </section>
  );
}
