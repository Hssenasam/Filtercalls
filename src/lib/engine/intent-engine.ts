import { boundedJitter, fnv1a32 } from '@/lib/hash';
import { COUNTRIES, COUNTRY_BY_ISO, DIAL_TO_COUNTRY, SORTED_DIAL_CODES } from '@/lib/countries';
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
}

type ParseResult = {
  rawInput: string;
  normalizedNumber: string;
  formattedNumber: string;
  nationalDigits: string;
  detectedCountryName: string;
  detectedCountryIso?: string;
  selectedCountryIso?: string;
  parsePath: 'explicit_international' | 'selected_country_hint' | 'heuristic_default';
  explicitInternational: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const digitsOnly = (value: string) => value.replace(/\D/g, '');

const detectDialCode = (digits: string) => {
  const match = SORTED_DIAL_CODES.find((dial) => digits.startsWith(dial));
  return match ? { dial: match, country: DIAL_TO_COUNTRY.get(match) } : undefined;
};

const formatDisplay = (normalized: string, detectedIso?: string) => {
  if (!normalized.startsWith('+')) return normalized;
  const digits = digitsOnly(normalized);

  if (detectedIso === 'US' || detectedIso === 'CA') {
    const national = digits.startsWith('1') ? digits.slice(1) : digits;
    if (national.length === 10) return `+1 (${national.slice(0, 3)}) ${national.slice(3, 6)}-${national.slice(6)}`;
  }

  if (detectedIso === 'GB') {
    const national = digits.startsWith('44') ? digits.slice(2) : digits;
    if (national.length >= 10) return `+44 ${national.slice(0, 4)} ${national.slice(4)}`;
  }

  if (detectedIso === 'FR') {
    const national = digits.startsWith('33') ? digits.slice(2) : digits;
    if (national.length === 9) return `+33 ${national[0]} ${national.slice(1, 3)} ${national.slice(3, 5)} ${national.slice(5, 7)} ${national.slice(7)}`;
  }

  const detectedDial = detectDialCode(digits)?.dial ?? '';
  const national = detectedDial ? digits.slice(detectedDial.length) : digits;
  const grouped = national.match(/.{1,3}/g)?.join(' ') ?? national;
  return `+${detectedDial}${grouped ? ` ${grouped}` : ''}`.trim();
};

const normalizePhone = (rawInput: string, selectedCountryIso?: string): ParseResult => {
  const raw = rawInput.trim();
  const selected = selectedCountryIso ? COUNTRY_BY_ISO.get(selectedCountryIso.toUpperCase()) : undefined;

  let explicitInternational = false;
  let normalized = raw;

  if (raw.startsWith('+')) {
    normalized = `+${digitsOnly(raw)}`;
    explicitInternational = true;
  } else if (raw.startsWith('00')) {
    normalized = `+${digitsOnly(raw).slice(2)}`;
    explicitInternational = true;
  } else {
    const localDigits = digitsOnly(raw);
    if (!localDigits) normalized = raw;
    else if (selected) {
      const dial = selected.dialCodes[0];
      const prefixed = localDigits.startsWith(dial) ? localDigits : `${dial}${localDigits}`;
      normalized = `+${prefixed}`;
    } else {
      normalized = `+1${localDigits}`;
    }
  }

  const normalizedDigits = digitsOnly(normalized);
  const detected = detectDialCode(normalizedDigits);
  const detectedCountry = detected?.country;
  const nationalDigits = detected ? normalizedDigits.slice(detected.dial.length) : normalizedDigits;

  return {
    rawInput: rawInput,
    normalizedNumber: normalized,
    formattedNumber: formatDisplay(normalized, detectedCountry?.iso),
    nationalDigits,
    detectedCountryName: detectedCountry?.name ?? selected?.name ?? 'Unknown',
    detectedCountryIso: detectedCountry?.iso ?? selected?.iso,
    selectedCountryIso: selected?.iso,
    parsePath: explicitInternational ? 'explicit_international' : selected ? 'selected_country_hint' : 'heuristic_default',
    explicitInternational
  };
};

const signalJitter = (base: number, _id: string, _normalized: string) => clamp(base, 0, 10);

export const extractSignals = (normalizedNumber: string, detectedCountry: string): PhoneSignals => {
  const digits = digitsOnly(normalizedNumber);
  const national = detectDialCode(digits)?.dial ? digits.slice((detectDialCode(digits)?.dial ?? '').length) : digits;

  const uniqueDigits = new Set(national).size;
  const entropy = uniqueDigits / 10;

  const repeatedTriples = /(\d)\1\1/.test(national) || /(12){2,}|(34){2,}|(56){2,}/.test(national);
  const suspiciousStructure = /(0000|1111|1234|4321|9999|1212|1010)$/.test(national);
  const prefixRiskFamilies = /^(1900|900|976|800|888|666|555)/.test(national);
  const sequentialRuns = /0123|1234|2345|3456|4567|5678|6789|9876|8765|7654/.test(national);
  const massRouting = /(000|111|222|333|444|555|666|777|888|999)$/.test(national) || /(00){2,}/.test(national);

  const detected = COUNTRY_BY_ISO.get(detectedCountry.toUpperCase());
  const expectedLengthScore =
    national.length >= 6 && national.length <= 12 ? 8 : national.length >= 5 && national.length <= 14 ? 5 : 2;

  const geoConsistencyScore = detected ? 8 : 4;

  return {
    entropyScore: signalJitter(Math.round(entropy * 10), 'entropy', normalizedNumber),
    repetitionScore: signalJitter(repeatedTriples ? 8 : 3, 'repetition', normalizedNumber),
    structuralAnomalyScore: signalJitter(suspiciousStructure ? 9 : 3, 'structural', normalizedNumber),
    prefixFamilyRisk: signalJitter(prefixRiskFamilies ? 8 : 4, 'prefixFamily', normalizedNumber),
    geoConsistencyScore: signalJitter(geoConsistencyScore, 'geo', normalizedNumber),
    lengthValidityScore: signalJitter(expectedLengthScore, 'length', normalizedNumber),
    sequentialRunScore: signalJitter(sequentialRuns ? 8 : 3, 'sequential', normalizedNumber),
    massRoutingScore: signalJitter(massRouting ? 8 : 4, 'massRouting', normalizedNumber)
  };
};

const lineTypeFromSignals = (signals: PhoneSignals, parsed: ParseResult, externalLineType?: CallIntentAnalysis['line_type']) => {
  if (externalLineType) return externalLineType;
  if (signals.massRoutingScore >= 7 || signals.prefixFamilyRisk >= 7) return 'voip' as const;
  if (signals.lengthValidityScore >= 7 && signals.entropyScore >= 6) return 'mobile' as const;
  return parsed.nationalDigits.length > 0 && parsed.nationalDigits.length < 8 ? 'landline' : 'unknown';
};

const nuisanceFromRisk = (riskScore: number): CallIntentAnalysis['nuisance_level'] => {
  if (riskScore >= 80) return 'critical';
  if (riskScore >= 60) return 'high';
  if (riskScore >= 35) return 'medium';
  return 'low';
};

const classifyIntent = (risk: number, trust: number, signals: PhoneSignals): IntentCategory => {
  if (risk >= 85 || (signals.structuralAnomalyScore >= 8 && signals.massRoutingScore >= 7)) return 'Scam / Fraud Risk';
  if (risk >= 72 || signals.repetitionScore >= 8) return 'Spam / Robocall';
  if (risk >= 62 && signals.prefixFamilyRisk >= 6) return 'Aggressive Sales Outreach';
  if (risk >= 52 && trust <= 40) return 'Financial / Collections';
  if (risk >= 45 && trust < 55) return 'Cold Business Outreach';
  if (trust >= 78 && risk <= 34 && signals.massRoutingScore <= 5) return 'Likely Safe Personal/Business';
  if (trust >= 70 && risk <= 40) return 'Customer Service / Support';
  if (trust >= 65 && risk <= 44) return 'Delivery / Logistics';
  if (trust >= 58 && risk <= 48) return 'Recruiter / Hiring';
  return 'Unknown but Low-Risk';
};

const actionFor = (intent: IntentCategory, risk: number, nuisance: CallIntentAnalysis['nuisance_level'], trust: number): RecommendedAction => {
  if (intent === 'Scam / Fraud Risk') return 'Block';
  if (risk >= 88) return 'Block';
  if (nuisance === 'critical' && trust < 70) return 'Silence';
  if (intent === 'Spam / Robocall' || intent === 'Aggressive Sales Outreach') return 'Silence';
  if (intent === 'Financial / Collections') return 'Send to Voicemail';
  if (intent === 'Likely Safe Personal/Business' && trust >= 75 && risk <= 35) return 'Safe to Answer';
  if (risk <= 30 && trust >= 70) return 'Safe to Answer';
  return 'Answer with Caution';
};

const signalsToList = (signals: PhoneSignals): CallSignal[] => {
  const list: Array<[keyof PhoneSignals, string, string, number]> = [
    ['structuralAnomalyScore', 'Structural anomaly', 'Digit endings and structure indicate irregular patterns.', signals.structuralAnomalyScore],
    ['massRoutingScore', 'Mass routing signature', 'Number pattern resembles high-throughput campaign routing.', signals.massRoutingScore],
    ['repetitionScore', 'Repetition profile', 'Repeated digits/pairs increase nuisance probability.', signals.repetitionScore],
    ['prefixFamilyRisk', 'Prefix family risk', 'Prefix family is associated with elevated nuisance or commercial behavior.', signals.prefixFamilyRisk],
    ['entropyScore', 'Entropy profile', 'Digit diversity and entropy were evaluated for synthetic patterns.', signals.entropyScore],
    ['geoConsistencyScore', 'Geo consistency', 'Parsed country code consistency confidence.', signals.geoConsistencyScore],
    ['lengthValidityScore', 'Length validity', 'National number length plausibility by country context.', signals.lengthValidityScore],
    ['sequentialRunScore', 'Sequential run detection', 'Sequential digit runs can indicate synthetic numbering blocks.', signals.sequentialRunScore]
  ];

  return list.map(([id, label, detail, weight]) => ({
    id,
    label,
    detail,
    weight,
    impact: id === 'geoConsistencyScore' || id === 'lengthValidityScore'
      ? weight >= 7 ? 'positive' : 'neutral'
      : weight >= 7 ? 'negative' : weight <= 3 ? 'positive' : 'neutral'
  }));
};

const topSignalNames = (signals: PhoneSignals) =>
  Object.entries(signals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

const prettySignal = (name: string) =>
  name
    .replace(/Score$/g, '')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase();

export const runFallbackIntentEngine = (inputNumber: string, options?: EngineOptions): CallIntentAnalysis => {
  const parsed = normalizePhone(inputNumber, options?.requestedCountry);

  const detectedIso = parsed.detectedCountryIso ?? options?.requestedCountry ?? 'US';
  const signals = extractSignals(parsed.normalizedNumber, detectedIso);

  const nonLinearBase = fnv1a32(`${parsed.normalizedNumber}|${parsed.parsePath}|${parsed.detectedCountryIso ?? 'XX'}`);
  const boundedRiskJitter = 0;
  const boundedTrustJitter = 0;

  const riskRaw =
    10 +
    signals.structuralAnomalyScore * 3.9 +
    signals.repetitionScore * 2.8 +
    signals.massRoutingScore * 3.1 +
    signals.prefixFamilyRisk * 2.5 +
    signals.sequentialRunScore * 2.1 +
    (10 - signals.lengthValidityScore) * 1.9 +
    (10 - signals.geoConsistencyScore) * 1.6 +
    (nonLinearBase % 17) * 0.9 +
    boundedRiskJitter;

  const risk_score = clamp(Math.round(riskRaw / 1.7), 0, 100);

  const trustRaw =
    28 +
    signals.geoConsistencyScore * 4.1 +
    signals.lengthValidityScore * 3.2 +
    signals.entropyScore * 1.5 +
    (10 - signals.structuralAnomalyScore) * 2.7 +
    (10 - signals.massRoutingScore) * 2.4 +
    (10 - signals.repetitionScore) * 2.0 +
    ((nonLinearBase >>> 3) % 19) * 0.6 +
    boundedTrustJitter;

  const trust_score = clamp(Math.round(trustRaw / 1.8), 0, 100);
  const confidence = clamp(
    Math.round(
      38 +
        signals.geoConsistencyScore * 3 +
        signals.lengthValidityScore * 2.5 +
        Math.abs(risk_score - trust_score) * 0.35 +
        (parsed.explicitInternational ? 8 : 3)
    ),
    35,
    98
  );

  const probable_intent = classifyIntent(risk_score, trust_score, signals);
  const nuisance_level = nuisanceFromRisk(risk_score);
  const recommended_action = actionFor(probable_intent, risk_score, nuisance_level, trust_score);

  const topContributors = topSignalNames(signals).map(prettySignal).join(', ');
  const parseReason =
    parsed.parsePath === 'explicit_international'
      ? `The number was parsed using its explicit international prefix and resolved to ${parsed.detectedCountryName}.`
      : parsed.parsePath === 'selected_country_hint'
        ? `The number did not include an explicit international prefix, so ${parsed.detectedCountryName} was used as a country hint.`
        : `No explicit country signal was present, so heuristic parsing was applied with ${parsed.detectedCountryName} context.`;

  const explanation = `${parseReason} The strongest contributors were ${topContributors}. Risk and trust were scored independently (risk ${risk_score}/100, trust ${trust_score}/100), leading to the recommended action: ${recommended_action.toLowerCase()}.`;

  const line_type = lineTypeFromSignals(signals, parsed, options?.external?.lineType);

  return {
    input_number: inputNumber,
    normalized_number: parsed.normalizedNumber,
    formatted_number: options?.external?.formattedNumber ?? parsed.formattedNumber,
    country: options?.external?.country ?? parsed.detectedCountryName,
    region: options?.external?.region,
    carrier: options?.external?.carrier ?? (line_type === 'voip' ? 'Twilio Voice' : 'Unknown Carrier'),
    line_type,
    is_valid: options?.external?.isValid,
    risk_score,
    trust_score,
    nuisance_level,
    probable_intent,
    confidence,
    recommended_action,
    signals: signalsToList(signals),
    explanation,
    last_checked_at: new Date().toISOString()
  };
};

export const countryOptions = COUNTRIES.map((country) => ({
  iso: country.iso,
  name: country.name,
  dialCode: country.dialCodes[0]
}));
