import { Activity, BellOff, BrainCircuit, Gauge, SlidersHorizontal, Workflow } from 'lucide-react';
import { Card } from '@/components/ui/card';

const features = [
  { icon: BrainCircuit, title: 'Intent Engine', text: 'Classifies likely motive behind each inbound call with confidence scoring.' },
  { icon: Gauge, title: 'Dual Score Model', text: 'Risk and trust scores surface nuanced outcomes instead of binary spam labels.' },
  { icon: SlidersHorizontal, title: 'Signal Breakdown', text: 'Shows the exact behaviors and metadata patterns shaping each recommendation.' },
  { icon: Workflow, title: 'Action Automation', text: 'Translate intelligence into policy-ready actions: block, silence, VM, caution, answer.' },
  { icon: Activity, title: 'Cloudflare-ready API', text: 'Designed for low-latency edge deployment with swappable provider integrations.' },
  { icon: BellOff, title: 'Noise Reduction Focus', text: 'Built to reduce digital interruption without sacrificing important conversations.' }
];

export const FeatureGrid = () => (
  <section className="mt-20">
    <h2 className="text-2xl font-semibold">Built for precision, not guesswork.</h2>
    <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {features.map((feature) => (
        <Card key={feature.title}>
          <feature.icon className="h-5 w-5 text-accent" />
          <h3 className="mt-4 font-semibold">{feature.title}</h3>
          <p className="mt-2 text-sm text-muted">{feature.text}</p>
        </Card>
      ))}
    </div>
  </section>
);
