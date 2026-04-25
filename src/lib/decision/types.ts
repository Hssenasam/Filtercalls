import type { IntentCategory, NuisanceLevel } from '../engine/types';

export type CallDecisionPrimaryAction =
  | 'block'
  | 'send_to_voicemail'
  | 'verify_first'
  | 'answer_cautiously';

export type CallDecisionRiskTier = 'low' | 'medium' | 'high' | 'critical';

export type CallDecisionScenario =
  | 'possible_impersonation'
  | 'possible_financial_scam'
  | 'possible_delivery_or_service'
  | 'possible_debt_collection'
  | 'possible_sales_or_telemarketing'
  | 'possible_robocall'
  | 'unknown_caller'
  | 'likely_safe';

export type AICallDecisionCommunityInput = {
  hasCommunityData?: boolean;
  total?: number;
  topCategory?: string | null;
  riskLabel?: string | null;
  verifiedReportCount?: number;
  recentReports24h?: number;
  severity?: {
    critical?: number;
    high?: number;
    medium?: number;
    low?: number;
  };
};

export type AICallDecisionInput = {
  riskScore: number;
  trustScore: number;
  nuisanceLevel?: NuisanceLevel;
  lineType?: 'mobile' | 'landline' | 'voip' | 'unknown' | null;
  countryCode?: string | null;
  probableIntent?: IntentCategory | null;
  riskLabel?: string | null;
  community?: AICallDecisionCommunityInput;
  signals?: Array<{
    label: string;
    impact?: string;
    description?: string;
  }>;
};

export type AICallDecision = {
  primaryAction: CallDecisionPrimaryAction;
  riskTier: CallDecisionRiskTier;
  confidence: number;
  scenario: CallDecisionScenario;
  headline: string;
  reasons: string[];
  recommendedResponse: string;
  doNotShare: string[];
  redFlags: string[];
  safestNextStep: string;
  disclaimer: string;
};
