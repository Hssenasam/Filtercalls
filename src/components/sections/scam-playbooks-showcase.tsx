import Link from 'next/link';
import { ArrowRight, BookOpenCheck, BrainCircuit, PhoneCall, ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';

const highlightedPlaybooks = [
  { label: 'Bank OTP', href: '/scams/bank-otp', tone: 'border-red-300/20 bg-red-300/10 text-red-100' },
  { label: 'AI Voice Deepfake', href: '/scams/ai-voice-deepfake', tone: 'border-violet-300/20 bg-violet-300/10 text-violet-100' },
  { label: 'Government Impersonation', href: '/scams/government-impersonation', tone: 'border-orange-300/20 bg-orange-300/10 text-orange-100' },
  { label: 'Fake Debt Collector', href: '/scams/fake-debt-collector', tone: 'border-amber-300/20 bg-amber-300/10 text-amber-100' }
];

const intelligenceSteps = [
  {
    title: 'Analyze the number',
    description: 'Start with risk, trust, caller intent, and the AI call decision.',
    icon: PhoneCall
  },
  {
    title: 'Recognize the playbook',
    description: 'Understand the script, pressure pattern, lifecycle, and red flags.',
    icon: BrainCircuit
  },
  {
    title: 'Verify safely',
    description: 'Use saved contacts, official apps, websites, or known numbers before responding.',
    icon: ShieldCheck
  }
];

export function ScamPlaybooksShowcase() {
  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-white/[0.025] px-6 py-20 sm:py-24">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-cyan-500/10 via-violet-500/5 to-transparent" />
      <div className="relative mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100">
            <BookOpenCheck className="h-3.5 w-3.5" /> Scam Call Playbooks
          </div>
          <div className="space-y-4">
            <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Know the call before the caller controls the conversation.
            </h2>
            <p className="max-w-xl text-sm leading-7 text-white/55 sm:text-base">
              Explore practical call-scam playbooks that break down what the caller may say, what it really means, what not to share, and how to verify safely.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link href="/scams" className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:opacity-90">
              Explore playbooks <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/analysis" className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
              Analyze a suspicious number
            </Link>
          </div>
        </div>

        <Card className="relative overflow-hidden border border-white/10 bg-black/15 p-0">
          <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="border-b border-white/10 bg-white/[0.035] p-5 lg:border-b-0 lg:border-r">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">Live library</p>
              <p className="mt-3 text-5xl font-semibold leading-none text-white">8</p>
              <p className="mt-2 text-sm text-white/50">scam call playbooks</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {highlightedPlaybooks.map((playbook) => (
                  <Link key={playbook.href} href={playbook.href} className={`rounded-full border px-3 py-1 text-xs font-medium transition hover:opacity-85 ${playbook.tone}`}>
                    {playbook.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="divide-y divide-white/10">
              {intelligenceSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="flex gap-4 p-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-cyan-100">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/35">Step {index + 1}</p>
                      <h3 className="mt-1 text-base font-semibold text-white">{step.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-white/50">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
}
