import { AlertTriangle, CheckCircle2, DatabaseZap, Download, PhoneForwarded, ShieldCheck } from 'lucide-react';
import { CallIntentAnalysis } from '@/lib/engine/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AICallDecisionCard } from '@/components/analysis/ai-call-decision-card';
import { ScoreRing, getScoreToneClasses } from '@/components/analysis/score-ring';
import { CommunityReputation } from '@/components/reputation/community-reputation';
import { cn } from '@/lib/utils';

const REPORT_STORAGE_TTL_MS = 30 * 60 * 1000;

type StoredReportData = {
  number: string;
  data: CallIntentAnalysis;
  createdAt: number;
};

const verificationTone = (result: CallIntentAnalysis) => {
  if (result.verification.status === 'verified') return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
  if (result.verification.status === 'not_verified') return 'border-amber-400/40 bg-amber-400/10 text-amber-200';
  return 'border-white/15 bg-white/5 text-white/65';
};

const formatValue = (value?: string | boolean) => {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return value && value.trim() ? value : 'Unknown';
};

const confidenceTone = (confidence: number) => getScoreToneClasses(confidence, 'confidence');

const recommendationTone = (riskScore: number, trustScore: number) => {
  if (riskScore >= 70 || trustScore < 40) return 'border-red-400/25 bg-red-400/10 text-red-200';
  if (riskScore >= 35 || trustScore < 70) return 'border-amber-400/25 bg-amber-400/10 text-amber-200';
  return 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200';
};

const cleanupOldStoredReports = (storage: Storage) => {
  const now = Date.now();
  const keysToRemove: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key?.startsWith('fc_report_')) continue;

    const raw = storage.getItem(key);
    if (!raw) {
      keysToRemove.push(key);
      continue;
    }

    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        keysToRemove.push(key);
        continue;
      }

      const entry = parsed as Partial<StoredReportData>;
      if (typeof entry.createdAt !== 'number' || now - entry.createdAt > REPORT_STORAGE_TTL_MS) {
        keysToRemove.push(key);
      }
    } catch {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => storage.removeItem(key));
};

const persistReportData = (key: string, payload: StoredReportData) => {
  const serialized = JSON.stringify(payload);
  window.sessionStorage.setItem(key, serialized);
  window.localStorage.setItem(key, serialized);

  cleanupOldStoredReports(window.sessionStorage);
  cleanupOldStoredReports(window.localStorage);
};

export const AnalysisResultCard = ({ result }: { result: CallIntentAnalysis }) => {
  const confidence = Math.max(0, Math.min(100, Math.round(result.confidence)));
  const confidenceClasses = confidenceTone(confidence);

  const handlePdfExport = () => {
    const storageKey = `fc_report_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    const payload: StoredReportData = {
      number: result.input_number || result.normalized_number || result.formatted_number,
      data: result,
      createdAt: Date.now()
    };

    persistReportData(storageKey, payload);

    const url = `/analysis/report?key=${encodeURIComponent(storageKey)}&number=${encodeURIComponent(payload.number)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Analyzed number</p>
          <h3 className="text-2xl font-semibold">{result.formatted_number}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={verificationTone(result)}>{result.verification.label}</Badge>
          <Badge className={recommendationTone(result.risk_score, result.trust_score)}>{result.probable_intent}</Badge>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ScoreRing label="Risk Score" score={result.risk_score} tone="risk" />
        <ScoreRing label="Trust Score" score={result.trust_score} tone="trust" />
        <div className="rounded-xl border border-white/15 bg-white/5 p-4">
          <p className="text-xs text-muted">Nuisance Level</p>
          <p className="mt-2 text-xl font-semibold capitalize">{result.nuisance_level}</p>
        </div>
        <div className="rounded-xl border border-white/15 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted">Confidence</p>
            <span className={cn('rounded-full border px-2 py-0.5 text-xs font-medium', confidenceClasses.badge)}>{confidence}%</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${confidence}%`, backgroundColor: confidenceClasses.stroke }} />
          </div>
          <p className={cn('mt-2 text-xl font-semibold', confidenceClasses.text)}>{confidence}%</p>
        </div>
      </div>

      <AICallDecisionCard result={result} />

      <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-sm font-medium text-white"><ShieldCheck className="h-4 w-4" /> Verification intelligence</p>
            <p className="text-sm text-muted">{result.verification.confidence_note}</p>
          </div>
          <Badge className={verificationTone(result)}>{result.verification.status === 'verified' ? 'External verification' : result.verification.status === 'not_verified' ? 'Not verified' : 'Internal engine only'}</Badge>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="text-xs text-muted">Valid number</p><p className="mt-1 text-sm font-medium">{formatValue(result.is_valid)}</p></div>
          <div className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="text-xs text-muted">Line type</p><p className="mt-1 text-sm font-medium capitalize">{formatValue(result.line_type)}</p></div>
          <div className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="text-xs text-muted">Carrier</p><p className="mt-1 text-sm font-medium">{formatValue(result.carrier)}</p></div>
          <div className="rounded-xl border border-white/10 bg-black/10 p-3"><p className="text-xs text-muted">Region</p><p className="mt-1 text-sm font-medium">{formatValue(result.region)}</p></div>
        </div>

        <p className="mt-3 flex items-center gap-2 text-xs text-white/35"><DatabaseZap className="h-3.5 w-3.5" /> Data source: {result.data_source === 'apilayer_number_verification' ? 'APILayer Number Verification + FilterCalls risk engine' : 'FilterCalls internal deterministic risk engine'}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white">Professional PDF report</p>
            <p className="text-xs text-white/50">Opens a print-ready report. Use browser Print → Save as PDF.</p>
          </div>
          <Button type="button" variant="secondary" className="gap-2" onClick={handlePdfExport}>
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download PDF Report</span>
            <span className="sm:hidden">PDF Report</span>
          </Button>
        </div>
      </div>

      <CommunityReputation number={result.formatted_number} />

      <div className="signal-separator" />

      <div className="space-y-3">
        <p className="flex items-center gap-2 text-sm text-muted"><PhoneForwarded className="h-4 w-4" /> Recommended action</p>
        <h4 className={cn('inline-flex rounded-full border px-3 py-1 text-lg font-semibold', recommendationTone(result.risk_score, result.trust_score))}>{result.recommended_action}</h4>
        <p className="text-sm text-muted">{result.explanation}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {result.signals.map((signal) => (
          <div key={signal.id} className="rounded-xl border border-white/15 bg-white/5 p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-medium">
                {signal.impact === 'positive' ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : signal.impact === 'negative' ? <AlertTriangle className="h-4 w-4 text-amber-300" /> : <span className="h-2 w-2 rounded-full bg-muted" />}
                {signal.label}
              </p>
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] uppercase tracking-wide text-white/45">{signal.impact}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{signal.detail}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};
