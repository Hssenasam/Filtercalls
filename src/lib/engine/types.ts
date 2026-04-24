export type NuisanceLevel = 'low' | 'medium' | 'high' | 'critical';

export type IntentCategory =
  | 'Scam / Fraud Risk'
  | 'Spam / Robocall'
  | 'Aggressive Sales Outreach'
  | 'Cold Business Outreach'
  | 'Customer Service / Support'
  | 'Delivery / Logistics'
  | 'Recruiter / Hiring'
  | 'Financial / Collections'
  | 'Invalid / Unverified Number'
  | 'Unknown but Low-Risk'
  | 'Likely Safe Personal/Business';

export type RecommendedAction =
  | 'Block'
  | 'Silence'
  | 'Send to Voicemail'
  | 'Answer with Caution'
  | 'Verify Before Answering'
  | 'Safe to Answer';

export type VerificationProvider = 'internal' | 'apilayer';
export type VerificationStatus = 'verified' | 'not_verified' | 'unavailable';

export interface PhoneVerification {
  provider: VerificationProvider;
  status: VerificationStatus;
  label: string;
  valid?: boolean;
  confidence_note: string;
  raw_provider?: string;
}

export interface CallSignal {
  id: string;
  label: string;
  impact: 'positive' | 'neutral' | 'negative';
  weight: number;
  detail: string;
}

export interface CallIntentAnalysis {
  input_number: string;
  normalized_number?: string;
  formatted_number: string;
  country: string;
  region?: string;
  carrier: string;
  line_type: 'mobile' | 'landline' | 'voip' | 'unknown';
  is_valid?: boolean;
  data_source: 'internal_engine' | 'apilayer_number_verification';
  verification: PhoneVerification;
  risk_score: number;
  trust_score: number;
  nuisance_level: NuisanceLevel;
  probable_intent: IntentCategory;
  confidence: number;
  recommended_action: RecommendedAction;
  signals: CallSignal[];
  explanation: string;
  last_checked_at: string;
}
