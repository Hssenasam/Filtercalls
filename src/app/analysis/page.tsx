import { NumberAnalyzer } from '@/components/analysis/number-analyzer';

type AnalysisPageProps = {
  searchParams?: Promise<{
    number?: string | string[];
  }>;
};

export default async function AnalysisPage({ searchParams }: AnalysisPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialNumberParam = resolvedSearchParams?.number;
  const initialNumber = Array.isArray(initialNumberParam)
    ? initialNumberParam[0] ?? ''
    : initialNumberParam ?? '';

  return (
    <section className="space-y-8">
      <div className="max-w-3xl space-y-3">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/35">
          Report workspace
        </p>
        <h1 className="text-3xl font-semibold text-white sm:text-4xl">Phone Intelligence Report</h1>
        <p className="max-w-2xl text-sm text-white/45 sm:text-base">
          Review trust posture, nuisance risk, intent signals, and a recommended action for the number you are checking.
        </p>
      </div>

      <NumberAnalyzer compact initialNumber={initialNumber} autoRun />
    </section>
  );
}
