import Link from 'next/link';
import { ArrowRight, Radar, Shield, Waves } from 'lucide-react';
import { NumberAnalyzer } from '@/components/analysis/number-analyzer';
import { Badge } from '@/components/ui/badge';

export const HomeHero = () => (
  <section className="space-y-8">
    <div className="space-y-4">
      <Badge className="border-primary/40 text-primary">Call Intent Intelligence Platform</Badge>
      <h1 className="max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
        See why a number is calling before you decide how to respond.
      </h1>
      <p className="max-w-2xl text-muted">
        FilterCalls analyzes intent, risk, trust, and nuisance behavior in one flow. Move from basic spam checks to calm, consistent call decisions.
      </p>
      <div className="flex flex-wrap gap-3 text-sm text-muted">
        <span className="inline-flex items-center gap-1"><Shield className="h-4 w-4 text-success" /> Action guidance engine</span>
        <span className="inline-flex items-center gap-1"><Radar className="h-4 w-4 text-accent" /> Signal breakdown visibility</span>
        <span className="inline-flex items-center gap-1"><Waves className="h-4 w-4 text-primary" /> API-ready architecture</span>
      </div>
      <Link href="/api-docs" className="inline-flex items-center gap-2 text-sm text-accent hover:underline">
        Explore API platform <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
    <NumberAnalyzer compact />
  </section>
);
