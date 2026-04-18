import { Card } from '@/components/ui/card';

const segments = [
  ['Individuals', 'Avoid distraction while still catching legitimate calls from delivery, support, and family contacts.'],
  ['Small Teams', 'Standardize inbound call handling across shared devices and front-desk operators.'],
  ['Customer Support', 'Prioritize known-service flows and de-prioritize nuisance patterns before agent pickup.'],
  ['Sales Teams', 'Protect outbound channel reputation and detect reciprocal cold outreach behavior.'],
  ['Call Centers', 'Apply dynamic routing and policy scoring at intake to reduce average handling time.'],
  ['Fraud Prevention', 'Flag probable social engineering calls with confidence-based escalation guidance.']
];

export default function SolutionsPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Solutions by workflow</h1>
      <p className="text-muted">FilterCalls is designed for both personal safety and operational scale, with one intelligence model and multiple deployment modes.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {segments.map(([title, text]) => (
          <Card key={title}>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-muted">{text}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
