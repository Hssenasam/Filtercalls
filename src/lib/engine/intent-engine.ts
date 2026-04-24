import { fnv1a32 } from '@/lib/hash';
import { COUNTRIES, COUNTRY_BY_ISO, DIAL_TO_COUNTRY, SORTED_DIAL_CODES } from '@/lib/countries';
import { CallIntentAnalysis, CallSignal, IntentCategory, RecommendedAction } from '@/lib/engine/types';

type ExternalHints = {
  provider?: 'apilayer';
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

type CalibrationSignals = {
  repeatedRun: boolean;
  sequentialRun: boolean;
  allSameRun: boolean;
  placeholderLike: boolean;
  lengthBand: 'plausible' | 'borderline' | 'implausible';
  carrierKnown: boolean;
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
    rawInput,
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

const signalJitter = (base: number) => clamp(base, 0, 10);

const countryLengthBand = (nationalDigits: string, iso?: string): CalibrationSignals['lengthBand'] => {
  const exactLengths: Record<string, number[]> = {
    US: [10], CA: [10], DZ: [9], GB: [10], FR: [9], DE: [10, 11], MA: [9], TN: [8], EG: [10], SA: [9], AE: [9]
  };
  const expected = iso ? exactLengths[iso.toUpperCase()] : undefined;
  if (!expected) return nationalDigits.length >= 7 && nationalDigits.length <= 12 ? 'plausible' : 'borderline';
  if (expected.includes(nationalDigits.length)) return 'plausible';
  if (expected.some((length) => Math.abs(length - nationalDigits.length) === 1)) return 'borderline';
  return 'implausible';
};

const hasSequentialRun = (digits: string) => {
  for (let index = 0; index <= digits.length - 4; index += 1) {
    const chunk = digits.slice(index, index + 4);
    const asc = chunk.split('').every((digit, idx, arr) => idx === 0 || Number(digit) === Number(arr[idx - 1]) + 1);
    const desc = chunk.split('').every((digit, idx, arr) => idx === 0 || Number(digit) === Number(arr[idx - 1]) - 1);
    if (asc || desc) return true;
  }
  return false;
};

const getCalibrationSignals = (parsed: ParseResult, external?: ExternalHints): CalibrationSignals => {
  const national = parsed.nationalDigits;
  const carrier = external?.carrier?.trim().toLowerCase();
  const carrierKnown = Boolean(carrier && carrier !== 'unknown' && carrier !== 'unknown carrier');
  return {
    repeatedRun: /(\d)\1{3,}/.test(national),
    sequentialRun: hasSequentialRun(national),
    allSameRun: /^(\d)\1{6,}$/.test(national),
    placeholderLike: /(?:00000|11111|12345678|98765432)/.test(national),
    lengthBand: countryLengthBand(national, parsed.detectedCountryIso ?? parsed.selectedCountryIso),
    carrierKnown
  };
};

export const extractSignals = (normalizedNumber: string, detectedCountry: string): PhoneSignals => {
  const digits = digitsOnly(normalizedNumber);
  const national = detectDialCode(digits)?.dial ? digits.slice((detectDialCode(digits)?.dial ?? '').length) : digits;

  const uniqueDigits = new Set(national).size;
  const entropy = uniqueDigits / 10;

  const repeatedTriples = /(\d)\1\1/.test(national) || /(12){2,}|(34){2,}|(56){2,}/.test(national);
  const suspiciousStructure = /(0000|1111|1234|4321|9999|1212|1010)$/.test(national);
  const prefixRiskFamilies = /^(1900|900|976|800|888|666|555)/.test(national);
  const sequentialRuns = hasSequentialRun(national);
  const massRouting = /(000|111|222|333|444|555|666|777|888|999)$/.test(national) || /(00){2,}/.test(national);

  const detected = COUNTRY_BY_ISO.get(detectedCountry.toUpperCase());
  const expectedLengthScore =
    national.length >= 6 && national.length <= 12 ? 8 : national.length >= 5 && national.length <= 14 ? 5 : 2;

  const geoConsistencyScore = detected ? 8 : 4;

  return {
    entropyScore: signalJitter(Math.round(entropy * 10)),
    repetitionScore: signalJitter(repeatedTriples ? 8 : 3),
    structuralAnomalyScore: signalJitter(suspiciousStructure ? 9 : 3),
    prefixFamilyRisk: signalJitter(prefixRiskFamilies ? 8 : 4),
    geoConsistencyScore: signalJitter(geoConsistencyScore),
    lengthValidityScore: signalJitter(expectedLengthScore),
    sequentialRunScore: signalJitter(sequentialRuns ? 8 : 3),
    massRoutingScore: signalJitter(massRouting ? 8 : 4)
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

const classifyIntent = (risk: number, trust: number, signals: PhoneSignals, isVerifiedInvalid: boolean): IntentCategory => {
  if (isVerifiedInvalid) return 'Invalid / Unverified Number';
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
  if (intent === 'Invalid / Unverified Number') return 'Verify Before Answering';
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
  const hasExternalVerification = options?.external?.provider === 'apilayer';
  const isVerifiedInvalid = hasExternalVerification && options?.external?.isValid === false;
  const line_type = lineTypeFromSignals(signals, parsed, options?.external?.lineType);
  const calibrationSignals = getCalibrationSignals(parsed, options?.external);

  const nonLinearBase = fnv1a32(`${parsed.normalizedNumber}|${parsed.parsePath}|${parsed.detectedCountryIso ?? 'XX'}`);

  const riskRaw =
    10 +
    signals.structuralAnomalyScore * 3.9 +
    signals.repetitionScore * 2.8 +
    signals.massRoutingScore * 3.1 +
    signals.prefixFamilyRisk * 2.5 +
    signals.sequentialRunScore * 2.1 +
    (10 - signals.lengthValidityScore) * 1.9 +
    (10 - signals.geoConsistencyScore) * 1.6 +
    (nonLinearBase % 17) * 0.9;

  const trustRaw =
    28 +
    signals.geoConsistencyScore * 4.1 +
    signals.lengthValidityScore * 3.2 +
    signals.entropyScore * 1.5 +
    (10 - signals.structuralAnomalyScore) * 2.7 +
    (10 - signals.massRoutingScore) * 2.4 +
    (10 - signals.repetitionScore) * 2.0 +
    ((nonLinearBase >>> 3) % 19) * 0.6;

  // Phase 2.5 calibration: deterministic score differentiation
  // Signals: APILayer validity, line_type, carrier, number patterns, length
  // No Math.random() — same input always produces same output
  let risk_score = clamp(Math.round(riskRaw / 1.7), 0, 100);
  let trust_score = clamp(Math.round(trustRaw / 1.8), 0, 100);
  let confidenceAdjustment = 0;

  if (hasExternalVerification) {
    if (options?.external?.isValid === false) {
      risk_score += 26;
      trust_score -= 32;
      confidenceAdjustment += 14;
    } else if (options?.external?.isValid === true) {
      confidenceAdjustment += 12;
      trust_score += calibrationSignals.carrierKnown ? 5 : 1;
    }
  } else {
    confidenceAdjustment -= 8;
    trust_score -= 6;
  }

  if (line_type === 'voip') {
    risk_score += 8;
    trust_score -= 5;
  } else if (line_type === 'mobile' && calibrationSignals.carrierKnown) {
    trust_score += 5;
    confidenceAdjustment += 5;
  } else if (line_type === 'landline' && options?.external?.isValid === true) {
    confidenceAdjustment += 2;
  } else if (line_type === 'unknown') {
    confidenceAdjustment -= 8;
    trust_score -= 5;
  }

  if (calibrationSignals.carrierKnown) {
    confidenceAdjustment += 5;
  } else {
    confidenceAdjustment -= 10;
    trust_score -= 8;
  }

  if (calibrationSignals.repeatedRun) risk_score += 12;
  if (calibrationSignals.sequentialRun) risk_score += 10;
  if (calibrationSignals.allSameRun) {
    risk_score += 20;
    trust_score -= 15;
  }
  if (calibrationSignals.placeholderLike) risk_score += 18;
  if (calibrationSignals.lengthBand === 'implausible') {
    risk_score += 15;
    trust_score -= 12;
  } else if (calibrationSignals.lengthBand === 'borderline') {
    confidenceAdjustment -= 8;
  }

  // Deterministic calibration offset — not random. Kept small and secondary to real signals.
  const stableOffset = (nonLinearBase % 9) - 4;
  const applyStableOffset = (score: number, offset: number) => {
    const next = clamp(score + offset, 0, 100);
    const band = (value: number) => value >= 70 ? 'high' : value >= 35 ? 'mid' : 'low';
    return band(score) === band(next) ? next : score;
  };

  risk_score = applyStableOffset(risk_score, stableOffset);
  trust_score = applyStableOffset(trust_score, -stableOffset);

  risk_score = isVerifiedInvalid ? clamp(Math.max(risk_score, 60), 0, 88) : clamp(risk_score, 0, 100);
  trust_score = isVerifiedInvalid ? clamp(Math.min(trust_score, 30), 5, 30) : clamp(trust_score, 0, 100);

  const internalConfidence = clamp(
    Math.round(
      38 +
        signals.geoConsistencyScore * 2.2 +
        signals.lengthValidityScore * 1.8 +
        Math.abs(risk_score - trust_score) * 0.25 +
        (parsed.explicitInternational ? 6 : 2) +
        confidenceAdjustment
    ),
    hasExternalVerification ? 50 : 40,
    hasExternalVerification ? 95 : 78
  );
  const confidence = isVerifiedInvalid
    ? clamp(internalConfidence, 80, 90)
    : hasExternalVerification
      ? clamp(Math.max(internalConfidence, 80), 0, 95)
      : clamp(internalConfidence, 60, 78);

  const probable_intent = classifyIntent(risk_score, trust_score, signals, isVerifiedInvalid);
  const nuisance_level = nuisanceFromRisk(risk_score);
  const recommended_action = actionFor(probable_intent, risk_score, nuisance_level, trust_score);

  const topContributors = topSignalNames(signals).map(prettySignal).join(', ');
  const parseReason =
    parsed.parsePath === 'explicit_international'
      ? `The number was parsed using its explicit international prefix and resolved to ${parsed.detectedCountryName}.`
      : parsed.parsePath === 'selected_country_hint'
        ? `The number did not include an explicit international prefix, so ${parsed.detectedCountryName} was used as a country hint.`
        : `No explicit country signal was present, so heuristic parsing was applied with ${parsed.detectedCountryName} context.`;
  const verificationReason = hasExternalVerification
    ? isVerifiedInvalid
      ? ' APILayer could not verify this as a valid phone number, so trust was reduced and the recommendation was made more cautious.'
      : ' APILayer verification enriched the report with external phone metadata.'
    : ' No external phone verification provider was available, so confidence is capped to reflect an internal-engine-only result.';

  const explanation = `${parseReason}${verificationReason} The strongest contributors were ${topContributors}. Risk and trust were scored independently (risk ${risk_score}/100, trust ${trust_score}/100), leading to the recommended action: ${recommended_action.toLowerCase()}.`;

  const data_source: CallIntentAnalysis['data_source'] = hasExternalVerification ? 'apilayer_number_verification' : 'internal_engine';

  return {
    input_number: inputNumber,
    normalized_number: parsed.normalizedNumber,
    formatted_number: options?.external?.formattedNumber ?? parsed.formattedNumber,
    country: options?.external?.country ?? parsed.detectedCountryName,
    region: options?.external?.region,
    carrier: options?.external?.carrier ?? (line_type === 'voip' ? 'Virtual / VoIP pattern' : 'Unknown Carrier'),
    line_type,
    is_valid: options?.external?.isValid,
    data_source,
    verification: {
      provider: hasExternalVerification ? 'apilayer' : 'internal',
      status: hasExternalVerification ? (isVerifiedInvalid ? 'not_verified' : 'verified') : 'unavailable',
      label: hasExternalVerification ? 'APILayer Number Verification' : 'Internal deterministic engine',
      valid: options?.external?.isValid,
      confidence_note: hasExternalVerification
        ? isVerifiedInvalid
          ? 'External provider marked this number as not valid. Treat the result as a warning, not a safe caller identity.'
          : 'External provider returned phone metadata and the report was enriched with it.'
        : 'No external provider result was available. Scores are based on structural and country-code heuristics only.'
    },
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
