import { parsePhoneNumberFromString } from 'libphonenumber-js/min';
import { defaultRegionRisk, REGION_RISK } from '@/lib/data/region-risk';
import { LayerResult } from '@/lib/engine/layer-types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const geographyLayer = (e164: string): LayerResult => {
  const startedAt = performance.now();
  const parsed = parsePhoneNumberFromString(e164);

  if (!parsed) {
    return {
      name: 'geography',
      risk: 50,
      trust: 50,
      confidence: 0.2,
      evidence: ['parse_failed'],
      latencyMs: Math.max(1, Math.round(performance.now() - startedAt))
    };
  }

  const iso = parsed.country ?? 'UN';
  const type = parsed.getType() ?? 'UNKNOWN';
  const regionRisk = REGION_RISK[iso] ?? defaultRegionRisk;

  let risk = regionRisk;
  if (String(type).includes('VOIP')) risk += 20;
  if (String(type).includes('PREMIUM_RATE')) risk += 25;
  if (String(type).includes('MOBILE')) risk -= 8;
  if (String(type).includes('FIXED_LINE')) risk -= 4;

  risk = clamp(risk, 0, 100);
  const trust = clamp(100 - risk + (iso.length % 5), 0, 100);

  return {
    name: 'geography',
    risk,
    trust,
    confidence: 0.9,
    evidence: [`country=${iso}`, `line_type=${type}`, `region_risk=${regionRisk}`],
    latencyMs: Math.max(1, Math.round(performance.now() - startedAt))
  };
};
