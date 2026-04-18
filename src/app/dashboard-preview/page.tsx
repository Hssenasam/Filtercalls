import { Card } from '@/components/ui/card';

export default function DashboardPreviewPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Dashboard Preview</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm text-muted">High-Risk Calls (24h)</p><p className="mt-2 text-2xl font-semibold">327</p></Card>
        <Card><p className="text-sm text-muted">Auto-Silenced</p><p className="mt-2 text-2xl font-semibold">1,904</p></Card>
        <Card><p className="text-sm text-muted">Safe Answer Rate</p><p className="mt-2 text-2xl font-semibold">81%</p></Card>
      </div>
      <Card>
        <p className="text-sm text-muted">This preview models a future authenticated workspace with policy control, live analytics, and team routing governance.</p>
      </Card>
    </section>
  );
}
