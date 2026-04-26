'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpenCheck,
  Bot,
  CheckCheck,
  ClipboardCheck,
  FileText,
  LockKeyhole,
  Radar,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

const VALUE_PILLARS = [
  {
    icon: Bot,
    label: 'AI Decision Engine',
    title: 'Should I answer?',
    desc: 'Turns caller risk, trust, intent, and community signals into a clear action: block, verify first, voicemail, or answer cautiously.',
  },
  {
    icon: FileText,
    label: 'Call Safety Certificate',
    title: 'Share the proof',
    desc: 'Creates a report that explains the verdict, safe response, do-not-share list, and verification path in one readable certificate.',
  },
  {
    icon: BookOpenCheck,
    label: 'Scam Playbooks',
    title: 'Know the pattern',
    desc: 'Teaches users how bank OTP, delivery, government, AI voice, crypto, and debt collection scams typically unfold.',
  },
  {
    icon: LockKeyhole,
    label: 'Privacy-first',
    title: 'No call recording',
    desc: 'Designed around pre-answer decision intelligence, hashed reputation signals, and practical safety guidance without voice surveillance.',
  },
];

const DECISION_FLOW = [
  { step: '01', title: 'Analyze', desc: 'Risk, trust, intent, line type, and reputation signals.' },
  { step: '02', title: 'Decide', desc: 'Block, verify first, send to voicemail, or answer cautiously.' },
  { step: '03', title: 'Defend', desc: 'Safe response, do-not-share list, and verification path.' },
];

const SAFETY_DETAILS = [
  'Copy-safe response script',
  'Do-not-share checklist',
  'Verification path',
  'Related scam intelligence',
];

export function HomeProductProof() {
  return (
    <section className="relative overflow-hidden border-y border-white/10 bg-[#080812] px-4 py-20 sm:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[130px]" />
        <div className="absolute right-0 bottom-0 h-[360px] w-[360px] rounded-full bg-cyan-500/10 blur-[100px]" />
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col gap-12">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end"
        >
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3.5 py-1.5 text-xs font-medium text-emerald-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Product proof, not just phone lookup
            </div>
            <h2 className="max-w-3xl text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              A call safety decision system built for real-world scams.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/52">
              FilterCalls does more than label a number as spam. It explains what to do, what to say, what not to share, and how to verify safely before the conversation becomes risky.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-black/30 sm:p-5">
            <div className="rounded-2xl border border-violet-300/15 bg-gradient-to-br from-violet-500/15 via-[#11111d] to-cyan-500/10 p-5">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/60">
                  <Sparkles className="h-3.5 w-3.5 text-violet-200" />
                  AI Call Decision
                </div>
                <div className="rounded-full border border-red-300/20 bg-red-400/10 px-3 py-1.5 text-xs font-medium text-red-100">
                  Critical risk
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1.05fr_0.95fr]">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/35">The verdict</p>
                  <h3 className="mt-3 text-3xl font-bold tracking-tight text-white">Do not answer</h3>
                  <p className="mt-3 text-sm leading-6 text-white/55">
                    This caller matches high-risk indicators and should be verified through official channels, not through the incoming call.
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                      <p className="text-[11px] text-white/35">Call Safety Score</p>
                      <p className="mt-1 text-2xl font-semibold text-white">12/100</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                      <p className="text-[11px] text-white/35">Confidence</p>
                      <p className="mt-1 text-2xl font-semibold text-white">91%</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
                      <ClipboardCheck className="h-4 w-4 text-emerald-200" />
                      Safe response
                    </div>
                    <p className="text-sm leading-6 text-white/60">
                      “I do not share verification codes or payment details over unsolicited calls. I will verify through official channels.”
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                    <p className="mb-3 text-sm font-medium text-white">Safety guidance included</p>
                    <div className="grid gap-2">
                      {SAFETY_DETAILS.map((detail) => (
                        <div key={detail} className="flex items-center gap-2 text-sm text-white/58">
                          <CheckCheck className="h-4 w-4 text-cyan-200" />
                          {detail}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {VALUE_PILLARS.map(({ icon: Icon, label, title, desc }, index) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: index * 0.06 }}
              className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300/25 hover:bg-white/[0.065]"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-300/15 bg-violet-300/10 text-violet-100 transition-colors group-hover:bg-violet-300/15">
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-200/55">{label}</p>
              <h3 className="mt-3 text-base font-semibold text-white">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/48">{desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center"
        >
          <div className="grid gap-3 md:grid-cols-3">
            {DECISION_FLOW.map(({ step, title, desc }) => (
              <div key={step} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                <div className="mb-3 flex items-center gap-3">
                  <span className="font-mono text-xs font-bold tracking-wider text-cyan-200/55">{step}</span>
                  <p className="text-sm font-semibold text-white">{title}</p>
                </div>
                <p className="text-sm leading-6 text-white/48">{desc}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 lg:w-64">
            <Link href="/analysis" className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-lg shadow-violet-950/35 transition hover:from-violet-500 hover:to-indigo-500">
              Analyze a number
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/scams" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white/75 transition hover:bg-white/[0.08] hover:text-white">
              Explore scam playbooks
              <Radar className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
