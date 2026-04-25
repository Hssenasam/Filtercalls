import type {
  AICallDecision,
  AICallDecisionCommunityInput,
  AICallDecisionInput,
  CallDecisionRiskTier,
  CallDecisionScenario
} from './types';
import type { IntentCategory, NuisanceLevel } from '../engine/types';

const DISCLAIMER =
  'Decision-support guidance only. FilterCalls does not guarantee call intent. Always verify important contacts through official channels.';

const CRITICAL_HIGH_RED_FLAGS = [
  'Caller creates urgency or pressure',
  'Request for one-time password or verification code',
  'Payment requested outside official channels',
  'Caller refuses to identify their organization',
  'Request to install software or grant remote access',
  'Request for card or banking details'
];

const MEDIUM_RED_FLAGS = [
  'Unexpected request for sensitive information',
  'Pressure to confirm personal details quickly',
  'Unverified caller identity'
];

const LOW_RED_FLAGS = [
  'Unexpected contact from unknown number',
  'Refusal to provide clear caller identity',
  'Unusual request during call'
];

const CRITICAL_DO_NOT_SHARE = [
  'One-time passwords or verification codes',
  'Bank account or card details',
  'Passwords or PINs',
  'National ID or passport numbers',
  'Home address or personal details'
];

const HIGH_DO_NOT_SHARE = ['Personal identification details', 'Payment information', 'Account credentials'];
const MEDIUM_DO_NOT_SHARE = ['Verification or OTP codes', 'Payment information', 'Personal identification'];
const LOW_DO_NOT_SHARE = ['Sensitive personal or financial details', 'Verification codes you did not request'];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const clampScore = (value: number) => clamp(Number.isFinite(value) ? value : 0, 0, 100);
const normalizeText = (value: string | null | undefined) => value?.trim().toLowerCase() ?? '';
const includesAny = (value: string, tokens: string[]) => tokens.some((token) => value.includes(token));
const isScamSpamOrRobocall = (value: string | null | undefined) => includesAny(normalizeText(value), ['scam', 'fraud', 'spam', 'robocall']);

export const nuisanceWeight = (level: NuisanceLevel | null | undefined): number => {
  if (level === 'critical') return 90;
  if (level === 'high') return 70;
  if (level === 'medium') return 45;
  if (level === 'low') return 15;
  return 0;
};

export const detectScenario = (
  intent: IntentCategory | null | undefined,
  community: AICallDecisionCommunityInput | undefined
): CallDecisionScenario => {
  if (intent === 'Scam / Fraud Risk') return 'possible_impersonation';
  if (intent === 'Spam / Robocall') return 'possible_robocall';
  if (intent === 'Financial / Collections') return 'possible_financial_scam';
  if (intent === 'Delivery / Logistics' || intent === 'Recruiter / Hiring') return 'possible_delivery_or_service';
  if (intent === 'Aggressive Sales Outreach' || intent === 'Cold Business Outreach') return 'possible_sales_or_telemarketing';
  if (intent === 'Customer Service / Support' || intent === 'Invalid / Unverified Number') return 'unknown_caller';
  if (intent === 'Unknown but Low-Risk' || intent === 'Likely Safe Personal/Business') return 'likely_safe';

  const topCategory = normalizeText(community?.topCategory);
  if (includesAny(topCategory, ['scam', 'fraud'])) return 'possible_impersonation';
  if (includesAny(topCategory, ['spam', 'robocall'])) return 'possible_robocall';

  return 'unknown_caller';
};

const addReason = (reasons: string[], reason: string) => {
  if (!reasons.includes(reason)) reasons.push(reason);
};

const hasSuspiciousSignal = (signals: AICallDecisionInput['signals']) =>
  signals?.some((signal) => {
    const impact = normalizeText(signal.impact);
    const label = normalizeText(signal.label);
    return includesAny(impact, ['negative', 'risk', 'suspicious']) || includesAny(label, ['risk', 'spam', 'scam', 'suspicious']);
  }) ?? false;

const buildReasons = (input: AICallDecisionInput, riskScore: number, trustScore: number, tier: CallDecisionRiskTier) => {
  const reasons: string[] = [];
  const community = input.community;

  if (riskScore >= 70) addReason(reasons, 'Elevated risk score detected');
  else if (riskScore >= 40) addReason(reasons, 'Moderate risk score');

  if (trustScore <= 35) addReason(reasons, 'Low trust score');
  else if (trustScore <= 60) addReason(reasons, 'Below-average trust score');

  if ((community?.total ?? 0) >= 5) addReason(reasons, 'Multiple community reports');
  else if ((community?.total ?? 0) >= 1) addReason(reasons, 'Community reports on record');

  if ((community?.severity?.critical ?? 0) > 0) addReason(reasons, 'Critical severity community reports');
  if ((community?.severity?.high ?? 0) > 0) addReason(reasons, 'High severity community reports');
  if ((community?.recentReports24h ?? 0) > 0) addReason(reasons, 'Recent community activity in last 24h');

  if (input.lineType === 'voip') addReason(reasons, 'VoIP line type — commonly used in spam');
  if (input.lineType === 'unknown') addReason(reasons, 'Unknown line type');
  if (input.nuisanceLevel === 'high' || input.nuisanceLevel === 'critical') addReason(reasons, 'High nuisance level');
  if (hasSuspiciousSignal(input.signals)) addReason(reasons, 'Suspicious signals detected');

  const fallbackByTier: Record<CallDecisionRiskTier, string[]> = {
    critical: ['Critical risk indicators detected', 'Treat this caller as unsafe until independently verified', 'Blocking is the safest default action'],
    high: ['High-risk caller profile', 'Voicemail creates a safer verification buffer', 'Caller identity should be verified before callback'],
    medium: ['Caller identity needs verification', 'Use caution before sharing any information', 'Independent verification is recommended'],
    low: ['Risk indicators are limited', 'Trust score supports cautious answering', 'Still avoid sharing sensitive information']
  };

  for (const fallback of fallbackByTier[tier]) {
    if (reasons.length >= 3) break;
    addReason(reasons, fallback);
  }

  return reasons.slice(0, 6);
};

const recommendedResponseForMedium = (intent: IntentCategory | null | undefined) => {
  if (intent === 'Delivery / Logistics') {
    return 'Please confirm the order reference number. I do not share verification codes or payment details over the phone.';
  }

  if (intent === 'Financial / Collections') {
    return 'Please send the request in writing, including your company name and reference number.';
  }

  if (intent === 'Aggressive Sales Outreach' || intent === 'Cold Business Outreach') {
    return 'Please send details by email. I am not sharing personal information on this call.';
  }

  return 'Who is calling, and what organization are you from? I would like to verify before continuing.';
};

const decisionBase = (
  input: AICallDecisionInput,
  riskScore: number,
  trustScore: number,
  tier: CallDecisionRiskTier,
  scenario: CallDecisionScenario
) => ({
  riskTier: tier,
  scenario,
  reasons: buildReasons(input, riskScore, trustScore, tier),
  disclaimer: DISCLAIMER
});

export function buildAICallDecision(input: AICallDecisionInput): AICallDecision {
  const riskScore = clampScore(input.riskScore);
  const trustScore = clampScore(input.trustScore);
  const community = input.community;
  const scenario = detectScenario(input.probableIntent, community);
  const normalizedRiskLabel = normalizeText(input.riskLabel);
  const normalizedCommunityRiskLabel = normalizeText(community?.riskLabel);
  const communityTotal = community?.total ?? 0;
  const communityCriticalSeverity = community?.severity?.critical ?? 0;
  const communityHighSeverity = community?.severity?.high ?? 0;
  const communityMediumSeverity = community?.severity?.medium ?? 0;
  const nuisanceScore = nuisanceWeight(input.nuisanceLevel);

  if (
    riskScore >= 85 ||
    normalizedRiskLabel === 'high_risk' ||
    normalizedCommunityRiskLabel === 'high_risk' ||
    communityCriticalSeverity > 0
  ) {
    return {
      ...decisionBase(input, riskScore, trustScore, 'critical', scenario),
      primaryAction: 'block',
      confidence: clamp(Math.floor(riskScore * 0.6 + (100 - trustScore) * 0.3 + 10), 80, 96),
      headline: 'Do not answer',
      recommendedResponse:
        'I do not share personal, payment, or verification information over unsolicited calls. I will contact the organization directly using official contact information.',
      doNotShare: CRITICAL_DO_NOT_SHARE,
      redFlags: CRITICAL_HIGH_RED_FLAGS,
      safestNextStep:
        'End the call immediately. If the claim seems legitimate, verify by calling the organization directly using their official published number.'
    };
  }

  if (
    riskScore >= 70 ||
    trustScore <= 35 ||
    (communityTotal >= 3 && isScamSpamOrRobocall(community?.topCategory)) ||
    communityHighSeverity > 0
  ) {
    return {
      ...decisionBase(input, riskScore, trustScore, 'high', scenario),
      primaryAction: 'send_to_voicemail',
      confidence: clamp(Math.floor(riskScore * 0.5 + (100 - trustScore) * 0.3 + 5), 65, 88),
      headline: 'Send to voicemail',
      recommendedResponse: 'Please leave a message with your name, company, and reason for calling. I will verify and call back if needed.',
      doNotShare: HIGH_DO_NOT_SHARE,
      redFlags: CRITICAL_HIGH_RED_FLAGS,
      safestNextStep: 'Let the call go to voicemail. If the message sounds legitimate, verify the caller independently before calling back.'
    };
  }

  if (
    riskScore >= 40 ||
    nuisanceScore >= 45 ||
    input.lineType === 'voip' ||
    input.probableIntent === 'Delivery / Logistics' ||
    input.probableIntent === 'Financial / Collections' ||
    input.probableIntent === 'Aggressive Sales Outreach' ||
    input.probableIntent === 'Cold Business Outreach' ||
    input.probableIntent === 'Recruiter / Hiring' ||
    communityMediumSeverity > 0
  ) {
    return {
      ...decisionBase(input, riskScore, trustScore, 'medium', scenario),
      primaryAction: 'verify_first',
      confidence: clamp(Math.floor(riskScore * 0.4 + (100 - trustScore) * 0.2 + 10), 50, 78),
      headline: 'Verify before responding',
      recommendedResponse: recommendedResponseForMedium(input.probableIntent),
      doNotShare: MEDIUM_DO_NOT_SHARE,
      redFlags: MEDIUM_RED_FLAGS,
      safestNextStep:
        "Ask for the caller's full name, company, and a reference number. Verify independently before providing any information."
    };
  }

  return {
    ...decisionBase(input, riskScore, trustScore, 'low', 'likely_safe'),
    primaryAction: 'answer_cautiously',
    confidence: clamp(Math.floor((100 - riskScore) * 0.4 + trustScore * 0.3 + 5), 45, 75),
    headline: 'Likely safe — answer cautiously',
    recommendedResponse: 'Who is calling, please, and what is this regarding?',
    doNotShare: LOW_DO_NOT_SHARE,
    redFlags: LOW_RED_FLAGS,
    safestNextStep: 'Answer normally, but stay alert. Do not share sensitive information unless you initiated the call.'
  };
}
