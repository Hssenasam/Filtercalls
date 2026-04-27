import Link from 'next/link';
import type { RecipientReportViewModel } from '@/lib/report/public-report-view';

const toneByLevel: Record<RecipientReportViewModel['warningLevel'], { border: string; bg: string; text: string }> = {
  low: { border: 'border-emerald-400/30', bg: 'bg-emerald-400/10', text: 'text-emerald-100' },
  medium: { border: 'border-amber-400/30', bg: 'bg-amber-400/10', text: 'text-amber-100' },
  high: { border: 'border-orange-400/30', bg: 'bg-orange-400/10', text: 'text-orange-100' },
  critical: { border: 'border-red-400/30', bg: 'bg-red-400/10', text: 'text-red-100' }
};

export function RecipientReportView({ view }: { view: RecipientReportViewModel }) {
  const tone = toneByLevel[view.warningLevel];

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <p className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-cyan-100">
          Recipient Safety View
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">Should I answer this caller?</h1>
        <p className="text-sm text-white/60">Caller preview: {view.maskedNumber}</p>
      </div>

      <div className={`rounded-2xl border ${tone.border} ${tone.bg} p-5`}>
        <p className={`text-base font-semibold ${tone.text}`}>{view.warningBanner}</p>
        <p className="mt-2 text-sm text-white/80">Recommended action: {view.recommendedAction}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-white">What to do now</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            {view.whatToDoNow.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-semibold text-white">What they may ask for</h2>
          <ul className="mt-3 space-y-2 text-sm text-white/80">
            {view.whatTheyMayAskFor.map((item) => <li key={item}>• {item}</li>)}
          </ul>
        </div>
      </div>

      <div className="rounded-2xl border border-red-300/20 bg-red-300/[0.06] p-5">
        <h2 className="text-lg font-semibold text-white">Never share on incoming calls</h2>
        <ul className="mt-3 space-y-2 text-sm text-white/85">
          {view.doNotShare.map((item) => <li key={item}>• {item}</li>)}
        </ul>
      </div>

      {view.matchedPlaybookSlug && view.matchedPlaybookName ? (
        <div className="rounded-2xl border border-violet-300/20 bg-violet-300/[0.06] p-5">
          <h2 className="text-lg font-semibold text-white">Possible scam pattern</h2>
          <p className="mt-2 text-sm text-white/75">{view.matchedPlaybookName}</p>
          <Link href={`/scams/${view.matchedPlaybookSlug}`} className="mt-3 inline-flex text-sm font-medium text-violet-100 hover:text-white">
            Open protection playbook →
          </Link>
        </div>
      ) : null}

      <p className="text-xs text-white/45">{view.footerNote}</p>
    </section>
  );
}
