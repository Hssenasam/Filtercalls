import type { ReputationSummary, RiskLabel } from '@/lib/reputation/types';

export type ReportViewMode = 'owner' | 'recipient';

export const parseViewMode = (value: string | string[] | undefined): ReportViewMode => {
  if (Array.isArray(value)) return value[0] === 'recipient' ? 'recipient' : 'owner';
  return value === 'recipient' ? 'recipient' : 'owner';
};

export const recipientHeadline = (riskLabel: RiskLabel | null | undefined, hasData: boolean): string => {
  if (!hasData) return 'No verified community alerts yet. Stay cautious and verify independently.';
  if (riskLabel === 'high_risk') return 'Warning: this caller has high-risk community signals.';
  if (riskLabel === 'suspicious') return 'Caution: suspicious community signals were reported for this caller.';
  if (riskLabel === 'watch') return 'Use caution: this caller has watch-level community risk signals.';
  return 'No major risk signals yet, but always verify unknown callers.';
};

export const recipientSteps = (riskLabel: RiskLabel | null | undefined): string[] => {
  if (riskLabel === 'high_risk' || riskLabel === 'suspicious') {
    return [
      'Do not answer unknown callbacks from this number.',
      'Do not share OTP codes, payment details, passwords, or ID numbers.',
      'Verify using an official app, website, or a saved trusted contact.',
      'Report suspicious behavior to help protect others.'
    ];
  }

  return [
    'Ask for the caller name, organization, and reference number.',
    'Do not share sensitive information during the call.',
    'Verify independently before taking any action.',
    'If pressure increases, end the call and report it.'
  ];
};

export const recipientSafeResponse = (riskLabel: RiskLabel | null | undefined): string => {
  if (riskLabel === 'high_risk' || riskLabel === 'suspicious') {
    return 'I do not share personal or payment information over incoming calls. I will verify through official channels.';
  }

  return 'Please send this request through an official channel. I will verify and call back if needed.';
};

export const recipientDoNotShare = (): string[] => ['OTP or verification codes', 'Passwords or PINs', 'Card or bank details', 'National ID numbers'];

export const recipientVerifyPath = (): string[] => [
  'Open the official app or website directly (do not use links sent during the call).',
  'Use a saved trusted contact or published support number.',
  'Only proceed after independent verification.'
];

export const recommendedPlaybookSlug = (summary: ReputationSummary): string | null => {
  if (!summary.has_community_data || summary.total <= 0) return null;
  if (summary.top_category === 'delivery') return 'delivery-otp';
  if (summary.top_category === 'scam' || summary.risk_label === 'high_risk') return 'bank-otp';
  if (summary.top_category === 'spam' || summary.top_category === 'robocall') return 'tech-support';
  if (summary.top_category === 'telemarketing') return 'fake-debt-collector';
  if (summary.top_category === 'suspicious') return 'government-impersonation';
  return null;
};
