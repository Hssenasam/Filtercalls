'use client';

import { motion } from 'framer-motion';
import {
  ShieldAlert,
  Bot,
  BarChart3,
  Globe,
  Code2,
  Webhook,
  CheckCircle2,
  Zap,
  Lock,
  BookOpen,
} from 'lucide-react';

const TRUST_STRIP = [
  { icon: Globe, label: '160+ countries', desc: 'Global number coverage' },
  { icon: Zap, label: 'Instant results', desc: 'Analysis in milliseconds' },
  { icon: ShieldAlert, label: 'Spam detection', desc: 'Pattern-based intelligence' },
  { icon: Code2, label: 'API-ready', desc: 'REST API + webhooks' },
];

const FEATURES = [
  {
    icon: ShieldAlert,
    title: 'Spam Detection',
    desc: 'Identifies flagged numbers, spam patterns, and reported call sources across global datasets.',
  },
  {
    icon: Bot,
    title: 'Scam & Robocall Intelligence',
    desc: 'Detects automated call signatures, scam indicators, and high-risk caller behaviors.',
  },
  {
    icon: BarChart3,
    title: 'Trust Scoring',
    desc: 'Every number receives a 0–100 trust score with confidence rating and risk classification.',
  },
  {
    icon: Globe,
    title: 'Number & Country Context',
    desc: 'Carrier identification, region data, line type, and country intelligence per number.',
  },
  {
    icon: BookOpen,
    title: 'Developer API',
    desc: 'REST API with full documentation, rate limits, and structured JSON responses.',
  },
  {
    icon: Webhook,
    title: 'Webhook Integrations',
    desc: 'Real-time event delivery to your systems for automated call screening workflows.',
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export function FeatureGrid() {
  return (
    <section className="py-24 px-4" id="features">
      <div className="max-w-6xl mx-auto flex flex-col gap-16">
        {/* Trust strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          {TRUST_STRIP.map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.07]"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium leading-tight">{label}</p>
                <p className="text-white/40 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="text-center max-w-xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-white/50 text-xs mb-5">
            <Lock className="w-3 h-3" />
            Platform capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight leading-tight mb-4">
            Everything you need to analyze calls
          </h2>
          <p className="text-white/45 text-base leading-relaxed">
            From spam filtering to developer integrations — one platform for phone number intelligence.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <motion.div
              key={title}
              variants={item}
              className="group flex flex-col gap-4 p-6 rounded-2xl bg-white/[0.04] border border-white/[0.07] hover:bg-white/[0.07] hover:border-violet-500/20 hover:-translate-y-0.5 transition-all duration-200 cursor-default"
            >
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center group-hover:bg-violet-500/15 transition-colors">
                <Icon className="w-5 h-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-[15px] mb-2">{title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
              </div>
              <div className="mt-auto">
                <CheckCircle2 className="w-4 h-4 text-violet-500/40 group-hover:text-violet-400/60 transition-colors" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
