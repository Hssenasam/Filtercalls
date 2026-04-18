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
  | 'Unknown but Low-Risk'
  | 'Likely Safe Personal/Business';

export type RecommendedAction =
  | 'Block'
  | 'Silence'
  | 'Send to Voicemail'
  | 'Answer with Caution'
  | 'Safe to Answer';

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
