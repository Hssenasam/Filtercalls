'use client';
export const runtime = 'edge';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import type { DashboardMetrics } from '@/lib/dashboard/metrics';

export default function PortalOverview() {
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/portal/dashboard', { cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace('/login?next=/portal/overview');
          return;
        }
        if (!response.ok) throw new Error('Failed to load overview');
        setData(await response.json());
        setState('ready');
      })
      .catch(() => setState('error'));
  }, [router]);

  if (state === 'loading') return <p>Loading overview…</p>;
  if (state === 'error') return <p>Unable to load overview data right now.</p>;
  if (!data) return <p>No overview data available.</p>;

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Portal overview</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {data.windows.map((w) => (
          <Card key={w.label} className="p-4">
            <p className="text-sm text-muted">{w.label}</p>
            <p className="text-2xl font-semibold">{w.total}</p>
            <p className="text-xs text-muted">High risk: {w.highRiskPct}%</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
