import { Card } from '@/components/ui/card';
import { loadDashboardMetrics } from '@/lib/dashboard/metrics';

export const runtime = 'edge';

export default async function PortalOverview() {
  const data = await loadDashboardMetrics();
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Portal overview</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {data.windows.map((w) => <Card key={w.label}><p className="text-sm text-muted">{w.label}</p><p className="text-2xl font-semibold">{w.total}</p></Card>)}
      </div>
    </section>
  );
}
