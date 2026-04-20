import { Card } from '@/components/ui/card';
import { loadDashboardMetrics } from '@/lib/dashboard/metrics';

export const runtime = 'edge';

export default async function DashboardPage() {
  try {
    const data = await loadDashboardMetrics();

    const hasData = data.windows.some((window) => window.total > 0);
    return (
      <section className="space-y-6">
        <h1 className="text-3xl font-semibold">Dashboard</h1>

        <div className="grid gap-4 md:grid-cols-3">
          {data.windows.map((window) => (
            <Card key={window.label}>
              <p className="text-sm text-muted">{window.label.replace('_', ' ')}</p>
              <p className="mt-2 text-2xl font-semibold">{window.total} analyses</p>
              <p className="text-sm text-muted">{window.highRiskPct}% high risk · avg {window.averageRisk}</p>
            </Card>
          ))}
        </div>

        <Card>
          <h2 className="font-semibold">Top 5 countries</h2>
          {data.topCountries.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No analysis data yet.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {data.topCountries.map((country) => (
                <li key={country.country}>{country.country}: {country.count}</li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="font-semibold">Recent analyses</h2>
          {!hasData ? (
            <p className="mt-2 text-sm text-muted">No recent analyses available yet. Run /api/analyze to populate this dashboard.</p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full text-sm text-muted">
                <thead>
                  <tr className="text-left">
                    <th className="pr-4">Time</th>
                    <th className="pr-4">Number</th>
                    <th className="pr-4">Country</th>
                    <th className="pr-4">Risk</th>
                    <th>Level</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent.map((row) => (
                    <tr key={row.id} className="border-t border-white/10">
                      <td className="pr-4 py-1">{new Date(row.created_at).toISOString()}</td>
                      <td className="pr-4 py-1 font-mono">{row.masked_number}</td>
                      <td className="pr-4 py-1">{row.country}</td>
                      <td className="pr-4 py-1">{row.risk_score}</td>
                      <td className="py-1">{row.risk_level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    );
  } catch {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <Card>
          <p className="text-sm text-muted">Dashboard is temporarily unavailable. Please retry shortly.</p>
        </Card>
      </section>
    );
  }
}
