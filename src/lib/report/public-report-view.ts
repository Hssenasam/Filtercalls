import type { ReputationSummary, RiskLabel } from '@/lib/reputation/types';

export type PublicReportViewMode = 'owner' | 'recipient';
export type RecipientWarningLevel = 'low' | 'medium' | 'high' | 'critical';

export type RecipientReportViewModel = {
  warningLevel: RecipientWarningLevel;
  warningBanner: string;
  maskedNumber: string;
  recommendedAction: string;
  whatToDoNow: string[];
  whatTheyMayAskFor: string[];
  doNotShare: string[];
  matchedPlaybookSlug: string | null;
  matchedPlaybookName: string | null;
  footerNote: string;
};

const RECIPIENT_SAFETY_LIST = [
  'One-time passwords (OTP) or verification codes',
  'Banking login details or card numbers',
  'Passwords, PINs, or seed phrases',
  'ID photos or full identity numbers'
];

const PLAYBOOK_BY_CATEGORY: Record<string, { slug: string; name: string }> = {
  scam: { slug: 'bank-otp', name: 'Bank OTP Scam Playbook' },
  suspicious: { slug: 'bank-otp', name: 'Bank OTP Scam Playbook' },
  delivery: { slug: 'delivery-otp', name: 'Delivery OTP Scam Playbook' },
  business: { slug: 'tech-support', name: 'Tech Support Scam Playbook' },
  unknown: { slug: 'family-emergency', name: 'Family Emergency Scam Playbook' }
};

const warningLevelForRisk = (risk: RiskLabel): RecipientWarningLevel => {
  if (risk === 'high_risk') return 'critical';
  if (risk === 'suspicious') return 'high';
  if (risk === 'watch') return 'medium';
  return 'low';
};

const warningBannerForRisk = (risk: RiskLabel, hasData: boolean): string => {
  if (!hasData) return 'No community history yet. Treat this caller as unverified and use caution.';
  if (risk === 'high_risk') return 'High-risk signals detected. Do not share personal or financial information.';
  if (risk === 'suspicious') return 'Suspicious signals detected. Verify identity before continuing.';
  if (risk === 'watch') return 'Some caution signals exist. Verify independently first.';
  return 'No significant risk signals detected, but always keep basic call safety.';
};

export function parsePublicReportViewMode(input: string | string[] | undefined): PublicReportViewMode {
  const value = Array.isArray(input) ? input[0] : input;
  return value === 'recipient' ? 'recipient' : 'owner';
}

export function buildRecipientReportView(summary: ReputationSummary): RecipientReportViewModel {
  const hasData = summary.has_community_data && summary.total > 0;
  const warningLevel = warningLevelForRisk(summary.risk_label);
  const playbook = summary.top_category ? PLAYBOOK_BY_CATEGORY[summary.top_category] ?? null : null;

  const recommendedAction = !hasData
    ? 'Verify the caller through an official channel before sharing anything.'
    : summary.risk_label === 'high_risk'
      ? 'Do not answer. Block and verify using an official number.'
      : summary.risk_label === 'suspicious'
        ? 'Do not continue the call until identity is verified independently.'
        : summary.risk_label === 'watch'
          ? 'Proceed carefully and verify the caller first.'
          : 'Low risk currently, but continue with normal safety checks.';

  const whatToDoNow = !hasData
    ? [
      'Let the call go to voicemail when possible.',
      'Ask for name, company, and callback reason only.',
      'Verify using a trusted official website or app.'
    ]
    : summary.risk_label === 'high_risk' || summary.risk_label === 'suspicious'
      ? [
        'End the call if pressure or urgency appears.',
        'Call the organization back using an official published number.',
        'Report suspicious behavior to help protect others.'
      ]
      : [
        'Keep the conversation short until verified.',
        'Never confirm sensitive data on incoming calls.',
        'If uncertain, end the call and verify independently.'
      ];

  return {
    warningLevel,
    warningBanner: warningBannerForRisk(summary.risk_label, hasData),
    maskedNumber: summary.number_hash_preview ? `···${summary.number_hash_preview}` : 'Hidden number',
    recommendedAction,
    whatToDoNow,
    whatTheyMayAskFor: ['Urgent payment or transfer', 'Verification code confirmation', 'Account reset approval', 'Identity details for "verification"'],
    doNotShare: RECIPIENT_SAFETY_LIST,
    matchedPlaybookSlug: playbook?.slug ?? null,
    matchedPlaybookName: playbook?.name ?? null,
    footerNote: 'Recipient view is simplified for safety guidance and intentionally hides technical details.'
  };
}
