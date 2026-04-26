import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CheckCircle2, PhoneCall, ShieldAlert, ShieldCheck, Siren, UserRoundSearch } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { getScamPattern, scamPatterns } from '@/lib/scams/patterns';
import type { ScamPatternRecommendedAction, ScamPatternRiskTier, ScamPressureLevel } from '@/lib/scams/patterns';
import { getScamDetailSchema } from '@/lib/scams/schema';

const baseUrl = 'https://filtercalls.com';

const RISK_STYLES: Record<ScamPatternRiskTier, { badge: string; panel: string; dot: string; text: string }> = {
  critical: {
    badge: 'border-red-300/25 bg-red-400/10 text-red-100',
    panel: 'border-red-300/20 bg-red-400/[0.06]',
    dot: 'bg-red-300',
    text: 'text-red-100'
  },
  high: {
    badge: 'border-orange-300/25 bg-orange-400/10 text-orange-100',
    panel: 'border-orange-300/20 bg-orange-400/[0.06]',
    dot: 'bg-orange-300',
    text: 'text-orange-100'
  },
  medium: {
    badge: 'border-amber-300/25 bg-amber-400/10 text-amber-100',
    panel: 'border-amber-300/20 bg-amber-400/[0.06]',
    dot: 'bg-amber-300',
    text: 'text-amber-100'
  },
  low: {
    badge: 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100',
    panel: 'border-emerald-300/20 bg-emerald-400/[0.06]',
    dot: 'bg-emerald-300',
    text: 'text-emerald-100'
  }
};

const ACTION_LABELS: Record<ScamPatternRecommendedAction, string> = {
  block: 'Block',
  send_to_voicemail: 'Send to voicemail',
  verify_first: 'Verify first',
  answer_cautiously: 'Answer cautiously'
};

const ACTION_STYLES: Record<ScamPatternRecommendedAction, string> = {
  block: 'border-red-300/20 bg-red-300/10 text-red-100',
  send_to_voicemail: 'border-orange-300/20 bg-orange-300/10 text-orange-100',
  verify_first: 'border-amber-300/20 bg-amber-300/10 text-amber-100',
  answer_cautiously: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100'
};

const PRESSURE_STYLES: Record<ScamPressureLevel, { label: string; track: string; bar: string; width: string; text: string }> = {
  low: { label: 'Low', track: 'bg-emerald-950/50', bar: 'bg-emerald-300', width: 'w-1/4', text: 'text-emerald-100' },
  medium: { label: 'Medium', track: 'bg-amber-950/50', bar: 'bg-amber-300', width: 'w-1/2', text: 'text-amber-100' },
  high: { label: 'High', track: 'bg-orange-950/50', bar: 'bg-orange-300', width: 'w-3/4', text: 'text-orange-100' },
  critical: { label: 'Critical', track: 'bg-red-950/50', bar: 'bg-red-300', width: 'w-full', text: 'text-red-100' }
};

const LIFECYCLE_TONES: Record<'neutral' | 'warning' | 'danger', string> = {
  neutral: 'border-cyan-300/20 bg-cyan-300/10 text-cyan-50',
  warning: 'border-amber-300/20 bg-amber-300/10 text-amber-50',
  danger: 'border-red-300/20 bg-red-300/10 text-red-50'
};

type PageProps = {
  params: { slug: string };
};

export function generateStaticParams() {
  return scamPatterns.map((pattern) => ({ slug: pattern.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const pattern = getScamPattern(params.slug);
  if (!pattern) {
    return {
      title: 'Scam playbook not found — FilterCalls',
      robots: { index: false, follow: false }
    };
  }

  return {
    title: pattern.seoTitle,
    description: pattern.seoDescription,
    alternates: { canonical: `${baseUrl}/scams/${pattern.slug}` },
    robots: { index: true, follow: true },
    openGraph: {
      title: pattern.seoTitle,
      description: pattern.seoDescription,
      url: `${baseUrl}/scams/${pattern.slug}`,
      siteName: 'FilterCalls'
    }
  };
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card className="border border-white/10 bg-white/[0.03]">
    <h2 className="text-2xl font-semibold text-white">{title}</h2>
    <div className="mt-4">{children}</div>
  </Card>
);

const BulletList = ({ items, tone = 'neutral' }: { items: string[]; tone?: 'neutral' | 'warning' | 'safe' }) => {
  const iconClass = tone === 'warning' ? 'text-amber-200' : tone === 'safe' ? 'text-emerald-200' : 'text-cyan-200';
  const Icon = tone === 'warning' ? ShieldAlert : CheckCircle2;

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-sm leading-6 text-white/58">
          <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClass}`} />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};

const PressureRow = ({ label, value }: { label: string; value: ScamPressureLevel }) => {
  const styles = PRESSURE_STYLES[value];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm text-white/60">{label}</p>
        <p className={`text-xs font-semibold uppercase tracking-[0.12em] ${styles.text}`}>{styles.label}</p>
      </div>
      <div className={`h-2 overflow-hidden rounded-full ${styles.track}`}>
        <div className={`h-full rounded-full ${styles.bar} ${styles.width}`} />
      </div>
    </div>
  );
};

export default function ScamPatternPage({ params }: PageProps) {
  const pattern = getScamPattern(params.slug);
  if (!pattern) notFound();

  const riskStyles = RISK_STYLES[pattern.riskTier];
  const relatedPatterns = pattern.relatedScams.map(getScamPattern).filter((item): item is NonNullable<ReturnType<typeof getScamPattern>> => Boolean(item));
  const detailSchema = getScamDetailSchema(pattern.slug);

  return (
    <section className="space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: detailSchema }} />

      <Card className="what-to-do-now border border-cyan-300/20 bg-cyan-400/[0.05]">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-100">What is happening?</p>
            <p className="mt-2 text-sm leading-6 text-white/65">{pattern.summary}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-100">What are they trying to get?</p>
            <p className="mt-2 text-sm leading-6 text-white/65">{pattern.scamGoal ?? pattern.pressureTactics[0] ?? 'Sensitive information or urgent payment.'}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-100">What should I do?</p>
            <p className={`mt-2 text-sm font-semibold ${riskStyles.text}`}>{ACTION_LABELS[pattern.recommendedAction]}</p>
          </div>
          <div className="protection-guidance">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-cyan-100">What should I not share?</p>
            <p className="mt-2 text-sm leading-6 text-white/65">{pattern.doNotShare.slice(0, 4).join(', ')}</p>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/10 p-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/35">How do I verify?</p>
          <p className="mt-2 text-sm leading-6 text-white/65">{pattern.verificationSteps[0] ?? pattern.bestNextStep}</p>
        </div>
      </Card>

      <div className={`relative overflow-hidden rounded-3xl border p-6 shadow-glow sm:p-8 lg:p-10 ${riskStyles.panel}`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/10 via-white/[0.02] to-transparent" />
        <div className="relative grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div className="space-y-5">
            <Link href="/scams" className="inline-flex text-sm font-medium text-white/55 transition hover:text-white">← All scam call playbooks</Link>
            <div className="flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${riskStyles.badge}`}>{pattern.riskTier} risk</span>
              <span className={`rounded-full border px-3 py-1 text-xs font-medium ${ACTION_STYLES[pattern.recommendedAction]}`}>{ACTION_LABELS[pattern.recommendedAction]}</span>
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">{pattern.title}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/60 md:text-base">{pattern.summary}</p>
            </div>
          </div>

          <Card className="border border-white/10 bg-black/10">
            <div className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white">
                <Siren className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/40">Best next step</p>
                <p className="mt-2 text-sm leading-6 text-white/65">{pattern.bestNextStep}</p>
              </div>
              <Link href="/analysis" className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:opacity-90">
                Analyze a suspicious number <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border border-white/10 bg-white/[0.03]">
          <h2 className="text-2xl font-semibold text-white">Scam anatomy</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">Goal</p>
              <p className="mt-2 text-sm leading-6 text-white/62">{pattern.scamGoal ?? pattern.summary}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">Main pressure</p>
              <p className="mt-2 text-sm leading-6 text-white/62">{pattern.pressureTactics[0] ?? 'Caller pressure'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">Recommended action</p>
              <p className={`mt-2 text-sm font-semibold ${riskStyles.text}`}>{ACTION_LABELS[pattern.recommendedAction]}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-white/35">Risk tier</p>
              <p className={`mt-2 text-sm font-semibold capitalize ${riskStyles.text}`}>{pattern.riskTier}</p>
            </div>
          </div>
        </Card>

        <Card className="border border-white/10 bg-white/[0.03]">
          <h2 className="text-2xl font-semibold text-white">Pressure meter</h2>
          {pattern.pressureMeter ? (
            <div className="mt-5 space-y-4">
              <PressureRow label="Urgency" value={pattern.pressureMeter.urgency} />
              <PressureRow label="Authority pressure" value={pattern.pressureMeter.authority} />
              <PressureRow label="Money risk" value={pattern.pressureMeter.moneyRisk} />
              <PressureRow label="Identity risk" value={pattern.pressureMeter.identityRisk} />
            </div>
          ) : (
            <p className="mt-4 text-sm leading-6 text-white/55">This playbook relies on the risk tier, pressure tactics, and red flags below to describe caller pressure.</p>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="How this scam works">
          <BulletList items={pattern.howItWorks} />
        </Section>

        <Section title="What the caller may say">
          <div className="space-y-3">
            {pattern.commonCallerClaims.map((claim) => (
              <div key={claim} className="rounded-2xl border border-white/10 bg-black/10 p-4 text-sm leading-6 text-white/62">“{claim}”</div>
            ))}
          </div>
        </Section>
      </div>

      <Section title="Scam script decoder">
        <div className="grid gap-3 md:grid-cols-3">
          {pattern.scriptDecoder.map((entry) => (
            <div key={entry.says} className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/35">They say</p>
              <p className="mt-2 text-sm leading-6 text-white/75">“{entry.says}”</p>
              <p className="mt-4 text-xs font-medium uppercase tracking-[0.18em] text-white/35">What it means</p>
              <p className="mt-2 text-sm leading-6 text-white/55">{entry.means}</p>
            </div>
          ))}
        </div>
      </Section>

      {pattern.scamLifecycle ? (
        <Section title="How this scam unfolds">
          <div className="grid gap-3 md:grid-cols-5">
            {pattern.scamLifecycle.map((stage, index) => (
              <div key={stage.stage} className={`rounded-2xl border p-4 ${LIFECYCLE_TONES[stage.tone]}`}>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">Step {index + 1}</p>
                <h3 className="mt-2 text-base font-semibold">{stage.stage}</h3>
                <p className="mt-2 text-sm leading-6 opacity-75">{stage.description}</p>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {pattern.callerProfile ? (
        <Card className="border border-violet-300/20 bg-violet-400/[0.045]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-violet-100"><UserRoundSearch className="h-4 w-4" /> Caller psychological profile</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Understand the role they are playing</h2>
            </div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="text-xs uppercase tracking-[0.18em] text-white/35">Role</p><p className="mt-2 text-sm leading-6 text-white/65">{pattern.callerProfile.role}</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="text-xs uppercase tracking-[0.18em] text-white/35">Exploits</p><p className="mt-2 text-sm leading-6 text-white/65">{pattern.callerProfile.exploits}</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="text-xs uppercase tracking-[0.18em] text-white/35">Weakness</p><p className="mt-2 text-sm leading-6 text-white/65">{pattern.callerProfile.weakness}</p></div>
            <div className="rounded-2xl border border-white/10 bg-black/10 p-4"><p className="text-xs uppercase tracking-[0.18em] text-white/35">Emotional lever</p><p className="mt-2 text-sm leading-6 text-white/65">{pattern.callerProfile.emotionalLever}</p></div>
          </div>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Section title="Pressure tactics">
          <div className="flex flex-wrap gap-2">
            {pattern.pressureTactics.map((tactic) => (
              <span key={tactic} className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-medium text-amber-100">{tactic}</span>
            ))}
          </div>
        </Section>

        <Section title="Red flags">
          <BulletList items={pattern.redFlags} tone="warning" />
        </Section>

        <Section title="What not to share">
          <div className="flex flex-wrap gap-2">
            {pattern.doNotShare.map((item) => (
              <span key={item} className="rounded-full border border-red-300/20 bg-red-300/10 px-3 py-1 text-xs font-medium text-red-100">{item}</span>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Safe response scripts">
          <div className="space-y-3">
            {pattern.safeResponses.map((response) => (
              <div key={response} className="rounded-2xl border border-emerald-300/15 bg-emerald-300/[0.06] p-4 text-sm leading-6 text-emerald-50">“{response}”</div>
            ))}
          </div>
        </Section>

        <Section title="How to verify safely">
          <ol className="space-y-3">
            {pattern.verificationSteps.map((step, index) => (
              <li key={step} className="flex gap-3 text-sm leading-6 text-white/58">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-slate-950 ${riskStyles.dot}`}>{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </Section>
      </div>

      <Card className="border border-cyan-300/20 bg-cyan-400/[0.05]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-100">When FilterCalls detects this pattern</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Recommended protection flow</h2>
          </div>
          <Link href="/analysis" className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:opacity-90">
            Analyze a suspicious number <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/35">FilterCalls typically recommends</p>
            <p className={`mt-2 text-sm font-semibold ${riskStyles.text}`}>{ACTION_LABELS[pattern.recommendedAction]}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/35">Safe response</p>
            <p className="mt-2 text-sm leading-6 text-white/65">“{pattern.safeResponses[0] ?? 'Verify independently before sharing any details.'}”</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/35">Do not share</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {pattern.doNotShare.slice(0, 4).map((item) => (
                <span key={item} className="rounded-full border border-red-300/20 bg-red-300/10 px-2.5 py-1 text-xs text-red-100">{item}</span>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/35">Verify through</p>
            <ol className="mt-2 space-y-2">
              {pattern.verificationSteps.slice(0, 2).map((step, index) => (
                <li key={step} className="flex gap-2 text-sm leading-6 text-white/65">
                  <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-slate-950 ${riskStyles.dot}`}>{index + 1}</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-cyan-300/20 bg-cyan-400/[0.05]">
          <p className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-cyan-100"><PhoneCall className="h-4 w-4" /> Safe callback rule</p>
          <p className="mt-3 text-sm leading-6 text-white/65">Never verify the caller using the number that contacted you. Use an official app, official website, statement, saved contact, or a number you already trusted before the call.</p>
        </Card>
        <Card className="border border-emerald-300/20 bg-emerald-400/[0.05]">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-100">Protect someone else</p>
          <p className="mt-3 text-sm leading-6 text-white/65">If this call could target a parent, grandparent, coworker, or friend, share the safe response and verification steps. A short pause can prevent a fast mistake.</p>
        </Card>
      </div>

      <Card className="border border-cyan-300/20 bg-cyan-400/[0.05]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-100">Decision scenarios</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">This playbook relates to: {pattern.relatedDecisionScenarios.map((item) => item.replace(/_/g, ' ')).join(', ')}.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/analysis" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90">Analyze a number</Link>
            <Link href="/security" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]"><ShieldCheck className="h-4 w-4" /> Security</Link>
          </div>
        </div>
      </Card>

      {relatedPatterns.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">Related scam call playbooks</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {relatedPatterns.map((related) => (
              <Link key={related.slug} href={`/scams/${related.slug}`} className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/25 hover:bg-white/[0.055]">
                <p className="text-lg font-semibold text-white">{related.shortTitle}</p>
                <p className="mt-2 text-sm leading-6 text-white/55">{related.summary}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-100 transition group-hover:translate-x-0.5">Open playbook <ArrowRight className="h-4 w-4" /></span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
