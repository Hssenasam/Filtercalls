import Link from 'next/link';
import type { Route } from 'next';
import { motion } from 'framer-motion';
import { Phone, ScanLine, CheckCheck, User, Building2, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    number: '01',
    icon: Phone,
    title: 'Enter any phone number',
    desc: 'Paste or type any number in international format. No account required to start.',
  },
  {
    number: '02',
    icon: ScanLine,
    title: 'Analyze risk and trust signals',
    desc: 'FilterCalls checks spam patterns, carrier data, country context, and trust indicators instantly.',
  },
  {
    number: '03',
    icon: CheckCheck,
    title: 'Act with confidence',
    desc: 'Block, allow, or route calls based on a clear trust score. Integrate via API for automated workflows.',
  },
];

const AUDIENCES = [
  {
    icon: User,
    label: 'For Individuals',
    headline: 'Stop unknown calls before they reach you',
    points: [
      'Identify suspicious caller patterns',
      'Block spam before it rings',
      'Check any number, instantly',
    ],
    cta: 'Analyze now',
    href: '/analysis',
    primary: false,
  },
  {
    icon: Building2,
    label: 'For Businesses and Developers',
    headline: 'Integrate phone intelligence into your stack',
    points: [
      'REST API with full documentation',
      'Webhook-based call screening',
      '25 API keys on Pro plan',
    ],
    cta: 'View API docs',
    href: '/api-docs',
    primary: true,
  },
];

export function HomeBlocks() {
  return (
    <section className="py-24 px-4">
      <div className="max-w-6xl mx-auto flex flex-col gap-24">

        <div className="flex flex-col gap-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="text-center max-w-xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              How it works
            </h2>
            <p className="text-white/45 text-base leading-relaxed">
              Three steps from unknown number to confident decision.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
            <div className="hidden md:block absolute top-10 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-gradient-to-r from-violet-500/0 via-violet-500/20 to-violet-500/0" />
            {STEPS.map(({ number, icon: Icon, title, desc }, i) => (
              <motion.div
                key={number}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="flex flex-col gap-4 p-6 rounded-2xl bg-white/[0.04] border border-white/[0.07]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-violet-500/40 font-mono text-sm font-bold tracking-wider">
                    {number}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-violet-400" />
                  </div>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-[15px] mb-2">{title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="text-center max-w-xl mx-auto"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-4">
              Built for every use case
            </h2>
            <p className="text-white/45 text-base">
              Whether you are checking one number or screening thousands.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {AUDIENCES.map(({ icon: Icon, label, headline, points, cta, href, primary }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className={`flex flex-col gap-6 p-7 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 ${
                  primary
                    ? 'bg-gradient-to-b from-violet-500/10 to-indigo-500/5 border-violet-500/20 hover:border-violet-500/30'
                    : 'bg-white/[0.04] border-white/[0.07] hover:bg-white/[0.07]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    primary
                      ? 'bg-violet-500/20 border border-violet-500/25'
                      : 'bg-white/[0.06] border border-white/[0.1]'
                  }`}>
                    <Icon className={`w-5 h-5 ${primary ? 'text-violet-300' : 'text-white/60'}`} />
                  </div>
                  <span className={`text-xs font-medium tracking-wide uppercase ${
                    primary ? 'text-violet-300/70' : 'text-white/40'
                  }`}>
                    {label}
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg leading-snug mb-4">{headline}</h3>
                  <ul className="flex flex-col gap-2">
                    {points.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-white/50">
                        <CheckCheck className={`w-4 h-4 mt-0.5 shrink-0 ${
                          primary ? 'text-violet-400/70' : 'text-white/30'
                        }`} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <a
                  href={href}
                  className={`mt-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.97] ${
                    primary
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/20'
                      : 'bg-white/[0.06] hover:bg-white/[0.1] text-white/80 hover:text-white border border-white/[0.08]'
                  }`}
                >
                  {cta}
                  <ArrowRight className="w-4 h-4" />
                </a>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
