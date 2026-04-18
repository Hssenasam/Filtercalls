import { Card } from '@/components/ui/card';

export default function PricingPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Pricing</h1>
      <p className="text-sm text-muted">Simple usage tiers today, enterprise controls tomorrow.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Personal', '$9', '250 analyses/month for independent professionals'],
          ['Team', '$79', '10,000 analyses/month with shared policy presets'],
          ['Business API', '$299', '100,000 analyses/month + webhook and support']
        ].map(([tier, price, detail]) => (
          <Card key={tier}>
            <p className="text-sm text-muted">{tier}</p>
            <p className="mt-1 text-2xl font-semibold">{price}</p>
            <p className="mt-2 text-sm text-muted">{detail}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
