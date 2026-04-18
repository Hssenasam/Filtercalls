import Link from 'next/link';
import { Card } from '@/components/ui/card';

export const HomeBlocks = () => (
  <section className="mt-20 grid gap-6">
    <Card>
      <h3 className="text-xl font-semibold">How FilterCalls works</h3>
      <ol className="mt-4 grid gap-3 text-sm text-muted md:grid-cols-3">
        <li><strong className="text-foreground">1) Ingest:</strong> Number metadata and behavior signatures are normalized.</li>
        <li><strong className="text-foreground">2) Infer:</strong> Intent and nuisance probability are scored by the engine.</li>
        <li><strong className="text-foreground">3) Act:</strong> Recommendation engine converts signal into immediate call guidance.</li>
      </ol>
    </Card>

    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <p className="text-xs uppercase tracking-wide text-muted">For individuals</p>
        <h3 className="mt-2 text-lg font-semibold">Keep your attention protected.</h3>
        <p className="mt-2 text-sm text-muted">See likely intent and answer decisions fast, without over-blocking legitimate calls.</p>
        <Link className="mt-3 inline-block text-sm text-accent hover:underline" href="/solutions">View personal workflows</Link>
      </Card>
      <Card>
        <p className="text-xs uppercase tracking-wide text-muted">For businesses</p>
        <h3 className="mt-2 text-lg font-semibold">Embed call intelligence in your stack.</h3>
        <p className="mt-2 text-sm text-muted">Use API endpoints to route support, flag fraud, and improve agent decision consistency.</p>
        <Link className="mt-3 inline-block text-sm text-accent hover:underline" href="/api-docs">Read API docs</Link>
      </Card>
    </div>
  </section>
);
