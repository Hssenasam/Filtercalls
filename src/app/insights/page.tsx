import { Card } from '@/components/ui/card';

export default function InsightsPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Insights</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-semibold">State of call intent in 2026</h2>
          <p className="mt-2 text-sm text-muted">Forthcoming report on nuisance pattern evolution, scam vectors, and response design strategies.</p>
        </Card>
        <Card>
          <h2 className="font-semibold">Designing trust-aware call workflows</h2>
          <p className="mt-2 text-sm text-muted">Framework for balancing customer accessibility and interruption control in high-volume teams.</p>
        </Card>
      </div>
    </section>
  );
}
