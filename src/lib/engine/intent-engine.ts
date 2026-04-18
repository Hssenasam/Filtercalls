import { COUNTRIES, getCountryByIso2 } from '@/lib/countries';
import { boundedJitter, digitFingerprint, fnv1a32 } from '@/lib/hash';
import { normalizePhone } from '@/lib/phone-provider';
import { CallIntentAnalysis, CallSignal, IntentCategory, RecommendedAction } from '@/lib/engine/types';

type ExternalHints = {
  country?: string;
  region?: string;
  carrier?: string;
  lineType?: CallIntentAnalysis['line_type'];
  isValid?: boolean;
  formattedNumber?: string;
};

type EngineOptions = {
  requestedCountry?: string;
  external?: ExternalHints;
};

export interface PhoneSignals {
  entropyScore: number;
  repetitionScore: number;
  structuralAnomalyScore: number;
  prefixFamilyRisk: number;
  geoConsistencyScore: number;
  lengthValidityScore: number;
  sequentialRunScore: number;
  massRoutingScore: number;
  digitEntropy: number;
  positionalRepetition: number;
  ascendingRunLength: number;
  blockUniformity: number;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

type Tier = 'CRITICAL' | 'HIGH' | 'ELEVATED' | 'MODERATE' | 'LOW' | 'CLEAN';
export const tier = (risk: number): Tier => {
  if (risk >= 85) return 'CRITICAL';
  if (risk >= 70) return 'HIGH';
  if (risk >= 55) return 'ELEVATED';
  if (risk >= 40) return 'MODERATE';
  if (risk >= 20) return 'LOW';
  return 'CLEAN';
};

const safeIntents: IntentCategory[] = ['Likely Safe Personal/Business', 'Unknown but Low-Risk'];

type DominantSignal = 'REPUTATION' | 'GEOGRAPHY' | 'STRUCTURE' | 'BEHAVIORAL';

export const INTENT_MATRIX: Record<Tier, Record<DominantSignal, IntentCategory>> = {
  CRITICAL: {
    REPUTATION: 'Scam / Fraud Risk',
    GEOGRAPHY: 'Scam / Fraud Risk',
    STRUCTURE: 'Scam / Fraud Risk',
    BEHAVIORAL: 'Spam / Robocall'
  },
  HIGH: {
    REPUTATION: 'Spam / Robocall',
    GEOGRAPHY: 'Spam / Robocall',
    STRUCTURE: 'Aggressive Sales Outreach',
    BEHAVIORAL: 'Financial / Collections'
  },
  ELEVATED: {
    REPUTATION: 'Aggressive Sales Outreach',
    GEOGRAPHY: 'Cold Business Outreach',
    STRUCTURE: 'Cold Business Outreach',
    BEHAVIORAL: 'Financial / Collections'
  },
  MODERATE: {
    REPUTATION: 'Cold Business Outreach',
    GEOGRAPHY: 'Customer Service / Support',
    STRUCTURE: 'Unknown but Low-Risk',
    BEHAVIORAL: 'Recruiter / Hiring'
  },
  LOW: {
    REPUTATION: 'Unknown but Low-Risk',
    GEOGRAPHY: 'Delivery / Logistics',
    STRUCTURE: 'Unknown but Low-Risk',
    BEHAVIORAL: 'Recruiter / Hiring'
  },
  CLEAN: {
    REPUTATION: 'Likely Safe Personal/Business',
    GEOGRAPHY: 'Likely Safe Personal/Business',
    STRUCTURE: 'Likely Safe Personal/Business',
    BEHAVIORAL: 'Likely Safe Personal/Business'
  }
};

const dominantSignal = (signals: PhoneSignals): DominantSignal => {
  const structure = signals.structuralAnomalyScore + signals.repetitionScore + signals.blockUniformity;
  const geography = signals.geoConsistencyScore + signals.lengthValidityScore;
  const reputation = signals.prefixFamilyRisk + signals.massRoutingScore;
  const behavioral = signals.sequentialRunScore + signals.positionalRepetition;

  const entries: Array<[DominantSignal, number]> = [
    ['STRUCTURE', structure],
    ['GEOGRAPHY', geography],
    ['REPUTATION', reputation],
    ['BEHAVIORAL', behavioral]
  ];

  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
};

const shannonEntropy = (digits: string) => {
  if (!digits.length) return 0;
  const counts = new Array(10).fill(0);
  for (const char of digits) counts[Number(char)] += 1;
  let entropy = 0;
  for (const count of counts) {
    if (!count) continue;
    const p = count / digits.length;
    entropy -= p * Math.log2(p);
  }
  return clamp((entropy / Math.log2(10)) * 10, 0, 10);
};

const longestRun = (digits: string) => {
  let max = 1;
  let run = 1;
  for (let i = 1; i < digits.length; i += 1) {
    run = digits[i] === digits[i - 1] ? run + 1 : 1;
    max = Math.max(max, run);
  }
  return max;
};

const longestAscending = (digits: string) => {
  let longest = 1;
  let current = 1;
  for (let i = 1; i < digits.length; i += 1) {
    const prev = Number(digits[i - 1]);
    const next = Number(digits[i]);
    current = next === prev + 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
};

const positionalPatternScore = (digits: string) => {
  let score = 0;
  for (let i = 0; i < digits.length - 3; i += 1) {
    const a = digits[i];
    const b = digits[i + 1];
    const c = digits[i + 2];
    const d = digits[i + 3];
    if (a === c && b === d) score += 2;
    if (a === b && c === d) score += 1;
  }
  return score;
};

const prefixRisk = (national: string) => (/^(1900|900|976|555|000|666|800|888)/.test(national) ? 8 : 3);

const lengthValidity = (national: string) => (national.length >= 7 && national.length <= 12 ? 8 : 2);

const geoConsistency = (detectedIso2: string | null, requestedIso2?: string) => {
  if (!requestedIso2) return 6;
  if (!detectedIso2) return 4;

  const req = requestedIso2.toUpperCase();
  const det = detectedIso2.toUpperCase();

  const nanp = new Set(['US', 'CA', 'PR']);
  if (nanp.has(req) && nanp.has(det)) return 9;
  return req === det ? 9 : 2;
};

const jitterSignal = (base: number, seed: string) => clamp(base + ((fnv1a32(seed) % 5) - 2), 0, 10);

export const extractSignals = (normalizedNumber: string, detectedCountry: string, selectedCountry?: string): PhoneSignals => {
  const digits = normalizedNumber.replace(/^\+/, '');
  const national = digits.length > 4 ? digits.slice(-10) : digits;

  const digitEntropy = shannonEntropy(national);
  const repetitionScore = clamp(longestRun(national) + (/([0-9])\1\1/.test(national) ? 3 : 0), 0, 10);
  const positionalRepetition = clamp(positionalPatternScore(national), 0, 10);
  const ascendingRunLength = clamp(longestAscending(national), 0, 10);
  const blockUniformity = clamp(/(000|111|222|333|444|555|666|777|888|999)/.test(national) ? 8 : 3, 0, 10);

  const entropyScore = jitterSignal(Math.round(10 - digitEntropy), `${digits}:entropy`);
  const structuralAnomalyScore = jitterSignal(clamp((ascendingRunLength + blockUniformity) / 2, 0, 10), `${digits}:struct`);
  const prefixFamilyRisk = jitterSignal(prefixRisk(national), `${digits}:prefix`);
  const geoConsistencyScore = jitterSignal(geoConsistency(detectedCountry, selectedCountry), `${digits}:geo`);
  const lengthValidityScore = jitterSignal(lengthValidity(national), `${digits}:length`);
  const sequentialRunScore = jitterSignal(clamp(ascendingRunLength + (/(1234|2345|3456|4567|5678|6789)/.test(national) ? 2 : 0), 0, 10), `${digits}:seq`);
  const massRoutingScore = jitterSignal(clamp((blockUniformity + prefixFamilyRisk) / 2, 0, 10), `${digits}:mass`);

  return {
    entropyScore,
    repetitionScore: jitterSignal(repetitionScore, `${digits}:repeat`),
    structuralAnomalyScore,
    prefixFamilyRisk,
    geoConsistencyScore,
    lengthValidityScore,
    sequentialRunScore,
    massRoutingScore,
    digitEntropy: jitterSignal(digitEntropy, `${digits}:digitEntropy`),
    positionalRepetition: jitterSignal(positionalRepetition, `${digits}:positional`),
    ascendingRunLength: jitterSignal(ascendingRunLength, `${digits}:asc`),
    blockUniformity: jitterSignal(blockUniformity, `${digits}:block`)
  };
};

const toLineType = (providerType?: string): CallIntentAnalysis['line_type'] => {
  const t = providerType?.toUpperCase() ?? 'UNKNOWN';
  if (t.includes('VOIP')) return 'voip';
  if (t.includes('FIXED')) return 'landline';
  if (t.includes('MOBILE')) return 'mobile';
  return 'unknown';
};

const classifyIntent = (risk: number, signals: PhoneSignals): IntentCategory => {
  const t = tier(risk);
  const dom = dominantSignal(signals);
  const mapped = INTENT_MATRIX[t][dom];

  if (risk >= 70 && safeIntents.includes(mapped)) return 'Spam / Robocall';
  return mapped;
};

const recommendedAction = (intent: IntentCategory, risk: number): RecommendedAction => {
  if (intent === 'Scam / Fraud Risk') return 'Block';
  if (intent === 'Spam / Robocall' || risk >= 82) return 'Silence';
  if (intent === 'Aggressive Sales Outreach' || risk >= 65) return 'Send to Voicemail';
  if (intent === 'Likely Safe Personal/Business' && risk <= 25) return 'Safe to Answer';
  return 'Answer with Caution';
};

const nuisanceFromRisk = (risk: number): CallIntentAnalysis['nuisance_level'] => {
  if (risk >= 80) return 'critical';
  if (risk >= 60) return 'high';
  if (risk >= 35) return 'medium';
  return 'low';
};

const toCallSignals = (signals: PhoneSignals): CallSignal[] => {
  const entries: Array<[keyof PhoneSignals, string, string]> = [
    ['digitEntropy', 'Digit entropy', 'Entropy and digit diversity profile.'],
    ['positionalRepetition', 'Positional repetition', 'ABAB/AABB positional repetition patterns.'],
    ['ascendingRunLength', 'Ascending runs', 'Longest sequential run in national digits.'],
    ['blockUniformity', 'Block uniformity', 'Concentrated same-digit blocks.'],
    ['prefixFamilyRisk', 'Prefix family risk', 'Risk associated with prefix block families.'],
    ['geoConsistencyScore', 'Geo consistency', 'Consistency between parsed country and hint.'],
    ['lengthValidityScore', 'Length validity', 'National length plausibility for detected country.'],
    ['massRoutingScore', 'Mass routing score', 'Mass-routing style suffix and prefix patterns.']
  ];

  return entries.map(([id, label, detail]) => ({
    id,
    label,
    detail,
    weight: signals[id],
    impact: id === 'geoConsistencyScore' || id === 'lengthValidityScore'
      ? signals[id] >= 7 ? 'positive' : 'neutral'
      : signals[id] >= 7 ? 'negative' : signals[id] <= 3 ? 'positive' : 'neutral'
  }));
};

export const runFallbackIntentEngine = (inputNumber: string, options?: EngineOptions): CallIntentAnalysis => {
  const normalized = normalizePhone(inputNumber, options?.requestedCountry);

  if (!normalized.ok) {
    throw new Error(normalized.error);
  }

  const countryMeta = normalized.countryIso2 ? getCountryByIso2(normalized.countryIso2) : null;
  const detectedCountry = options?.external?.country ?? countryMeta?.name ?? 'Unknown';

  const signals = extractSignals(normalized.e164, normalized.countryIso2 ?? 'UN', options?.requestedCountry);

  const fingerprint = digitFingerprint(normalized.national);
  const baseRisk = clamp(
    Math.round(
      14 +
      signals.structuralAnomalyScore * 4.1 +
      signals.repetitionScore * 3.5 +
      signals.massRoutingScore * 3.2 +
      signals.prefixFamilyRisk * 2.7 +
      signals.sequentialRunScore * 2.2 +
      signals.positionalRepetition * 1.5
    ),
    0,
    100
  );
  const risk_score = Math.round(boundedJitter(fingerprint, baseRisk));

  const baseTrust = clamp(
    Math.round(
      24 +
      signals.geoConsistencyScore * 4 +
      signals.lengthValidityScore * 3.4 +
      (10 - signals.massRoutingScore) * 2.4 +
      (10 - signals.structuralAnomalyScore) * 2.1 +
      signals.digitEntropy * 1.3
    ),
    0,
    100
  );
  const trust_score = Math.round(boundedJitter(fnv1a32(`${fingerprint}:trust`), baseTrust, 0.22));

  const confidence = clamp(
    Math.round(
      35 + signals.geoConsistencyScore * 3 + signals.lengthValidityScore * 2 + Math.abs(risk_score - trust_score) * 0.4
    ),
    20,
    98
  );

  const probable_intent = classifyIntent(risk_score, signals);
  const nuisance_level = nuisanceFromRisk(risk_score);
  const recommended_action = recommendedAction(probable_intent, risk_score);

  const topSignals = Object.entries(signals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => key.replace(/([A-Z])/g, ' $1').toLowerCase())
    .join(', ');

  const parsePathText =
    inputNumber.trim().startsWith('+') || inputNumber.trim().startsWith('00')
      ? 'explicit international prefix'
      : options?.requestedCountry
        ? `selected-country hint (${options.requestedCountry.toUpperCase()})`
        : 'no explicit country hint';

  const explanation = `Detected country ${detectedCountry} using ${parsePathText}. Dominant contributors were ${topSignals}. This produced risk ${risk_score}/100 and trust ${trust_score}/100, so recommended action is ${recommended_action.toLowerCase()}.`;

  const line_type = options?.external?.lineType ?? toLineType(normalized.type);

  return {
    input_number: inputNumber,
    normalized_number: normalized.e164,
    formatted_number: options?.external?.formattedNumber ?? normalized.e164,
    country: detectedCountry,
    region: options?.external?.region,
    carrier: options?.external?.carrier ?? 'Unknown Carrier',
    line_type,
    is_valid: options?.external?.isValid ?? true,
    risk_score,
    trust_score,
    nuisance_level,
    probable_intent,
    intent: probable_intent,
    confidence,
    recommended_action,
    signals: toCallSignals(signals),
    explanation,
    last_checked_at: '1970-01-01T00:00:00.000Z'
  };
};

export const analyze = async (number: string, country?: string | null) =>
  runFallbackIntentEngine(number, { requestedCountry: country ?? undefined });

export const countryOptions = COUNTRIES.map((country) => ({
  iso: country.iso2,
  name: country.name,
  dialCode: '—'
}));
