import { runFallbackIntentEngine } from '@/lib/engine/intent-engine';
import { aggregateLayers } from '@/lib/engine/aggregator';
import { behavioralLayer } from '@/lib/engine/layer-behavioral';
import { geographyLayer } from '@/lib/engine/layer-geography';
import { reputationLayer } from '@/lib/engine/layer-reputation';
import { structureLayer } from '@/lib/engine/layer-structure';
import { AnalyzeContext, LayerResult } from '@/lib/engine/layer-types';
import { normalizePhone } from '@/lib/phone-provider';

const riskySet = new Set(['Scam / Fraud Risk', 'Spam / Robocall', 'Aggressive Sales Outreach', 'Financial / Collections']);

const tierFromRisk = (risk: number) => {
  if (risk >= 85) return 'CRITICAL';
  if (risk >= 70) return 'HIGH';
  if (risk >= 55) return 'ELEVATED';
  if (risk >= 40) return 'MODERATE';
  if (risk >= 20) return 'LOW';
  return 'CLEAN';
};

const intentByTierDominant = (tier: string, dominant: LayerResult['name']) => {
  const matrix: Record<string, Record<LayerResult['name'], string>> = {
    CRITICAL: {
      structure: 'Synthetic / Burner Number',
      geography: 'Premium-Rate Trap',
      reputation: 'Confirmed Scam / Fraud',
      behavioral: 'Active Mass-Dialer'
    },
    HIGH: {
      structure: 'Likely Synthetic',
      geography: 'Suspicious VOIP Origin',
      reputation: 'Likely Scam',
      behavioral: 'Likely Mass Outreach'
    },
    ELEVATED: {
      structure: 'Structurally Suspicious',
      geography: 'Risky Region',
      reputation: 'Reported Spam',
      behavioral: 'High-Frequency Caller'
    },
    MODERATE: {
      structure: 'Mildly Anomalous Pattern',
      geography: 'Long-Distance Marketing',
      reputation: 'Mixed Reputation',
      behavioral: 'Frequent but Plausible'
    },
    LOW: {
      structure: 'Normal Pattern',
      geography: 'Standard Domestic',
      reputation: 'Mostly Clean',
      behavioral: 'Normal Activity'
    },
    CLEAN: {
      structure: 'Clean Pattern',
      geography: 'Verified Domestic Mobile',
      reputation: 'Verified Clean',
      behavioral: 'Rarely Seen'
    }
  };

  return matrix[tier][dominant];
};

export const analyzeNumberV2 = async (
  input: string,
  selectedCountry?: string,
  queryFresh?: boolean
): Promise<{ result: Record<string, unknown>; cacheStatus: 'HIT' | 'MISS' | 'BYPASS'; latencyMs: number }> => {
  const start = performance.now();
  const normalized = normalizePhone(input, selectedCountry);
  if (!normalized.ok) {
    throw new Error(normalized.error);
  }

  const context: AnalyzeContext = {
    e164: normalized.e164,
    selectedCountry,
    queryFresh
  };

  const settled = await Promise.allSettled([
    Promise.resolve(structureLayer(normalized.e164)),
    Promise.resolve(geographyLayer(normalized.e164)),
    reputationLayer(context),
    behavioralLayer(normalized.e164)
  ]);

  const layers: LayerResult[] = [];
  let cacheStatus: 'HIT' | 'MISS' | 'BYPASS' = 'MISS';

  for (const item of settled) {
    if (item.status === 'rejected') continue;

    if ('cacheStatus' in item.value) {
      cacheStatus = item.value.cacheStatus;
      layers.push(item.value.layer);
    } else {
      layers.push(item.value as LayerResult);
    }
  }

  const aggregated = aggregateLayers(layers);
  const dominant = layers.slice().sort((a, b) => b.confidence - a.confidence)[0]?.name ?? 'structure';
  const intentTier = tierFromRisk(aggregated.risk);
  const v2Intent = intentByTierDominant(intentTier, dominant);

  const fallback = runFallbackIntentEngine(input, {
    requestedCountry: selectedCountry,
    external: {
      formattedNumber: normalized.e164,
      lineType: layers.find((layer) => layer.name === 'reputation')?.evidence.find((ev) => ev.startsWith('line_type='))?.split('=')[1] as
        | 'mobile'
        | 'landline'
        | 'voip'
        | 'unknown'
        | undefined
    }
  });

  const finalIntent = aggregated.risk >= 70 && !riskySet.has(fallback.probable_intent) ? 'Spam / Robocall' : fallback.probable_intent;

  const result = {
    ...fallback,
    risk_score: aggregated.risk,
    trust_score: aggregated.trust,
    confidence: aggregated.confidence,
    probable_intent: finalIntent,
    intent: finalIntent,
    intent_tier: intentTier,
    layers,
    engine_version: '2.0.0',
    cached: cacheStatus === 'HIT',
    request_id: `req_${normalized.e164.replace(/\D/g, '').slice(-8)}_${Math.round(start)}`,
    v2_intent_label: v2Intent
  };

  return {
    result,
    cacheStatus,
    latencyMs: Math.max(1, Math.round(performance.now() - start))
  };
};
