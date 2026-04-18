import { NumberAnalyzer } from '@/components/analysis/number-analyzer';

export default function AnalysisPage() {
  return (
    <section className="space-y-5">
      <h1 className="text-3xl font-semibold">Number Analysis</h1>
      <p className="max-w-2xl text-sm text-muted">
        Run a full call intent analysis to estimate risk posture, trust signals, nuisance severity, and recommended action.
      </p>
      <NumberAnalyzer />
    </section>
  );
}
