import { Card } from '@/components/ui/card';

export default function AboutPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Why FilterCalls exists</h1>
      <Card>
        <p className="text-sm text-muted">
          Modern phone systems generate too much interruption and too little context. FilterCalls was created to shift decisions from instinct to intelligence.
        </p>
        <p className="mt-3 text-sm text-muted">
          We believe every inbound call should be evaluated as a behavioral signal: intent, trust, nuisance, and expected value. Our mission is calm control over digital noise.
        </p>
      </Card>
      <Card>
        <h2 className="font-semibold">Call Intent Intelligence philosophy</h2>
        <p className="mt-2 text-sm text-muted">
          Spam detection is binary. Intent intelligence is probabilistic and practical. FilterCalls surfaces uncertainty clearly, then recommends an action aligned with your policy.
        </p>
      </Card>
    </section>
  );
}
