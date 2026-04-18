import { AlertTriangle, CheckCircle2, PhoneForwarded } from 'lucide-react';
import { CallIntentAnalysis } from '@/lib/engine/types';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScoreRing } from '@/components/analysis/score-ring';

export const AnalysisResultCard = ({ result }: { result: CallIntentAnalysis }) => (
  <Card className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm text-muted">Analyzed number</p>
        <h3 className="text-2xl font-semibold">{result.formatted_number}</h3>
      </div>
      <Badge className="border-accent/30 text-accent">{result.probable_intent}</Badge>
    </div>

    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <ScoreRing label="Risk Score" score={result.risk_score} />
      <ScoreRing label="Trust Score" score={result.trust_score} />
      <div className="rounded-xl border border-white/15 bg-white/5 p-4">
        <p className="text-xs text-muted">Nuisance Level</p>
        <p className="mt-2 text-xl font-semibold capitalize">{result.nuisance_level}</p>
      </div>
      <div className="rounded-xl border border-white/15 bg-white/5 p-4">
        <p className="text-xs text-muted">Confidence</p>
        <p className="mt-2 text-xl font-semibold">{result.confidence}%</p>
      </div>
    </div>

    <div className="signal-separator" />

    <div className="space-y-3">
      <p className="flex items-center gap-2 text-sm text-muted"><PhoneForwarded className="h-4 w-4" /> Recommended action</p>
      <h4 className="text-lg font-semibold">{result.recommended_action}</h4>
      <p className="text-sm text-muted">{result.explanation}</p>
    </div>

    <div className="grid gap-3 md:grid-cols-2">
      {result.signals.map((signal) => (
        <div key={signal.id} className="rounded-xl border border-white/15 bg-white/5 p-3">
          <p className="flex items-center gap-2 text-sm font-medium">
            {signal.impact === 'positive' ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : signal.impact === 'negative' ? (
              <AlertTriangle className="h-4 w-4 text-warning" />
            ) : (
              <span className="h-2 w-2 rounded-full bg-muted" />
            )}
            {signal.label}
          </p>
          <p className="mt-1 text-sm text-muted">{signal.detail}</p>
        </div>
      ))}
    </div>
  </Card>
);
