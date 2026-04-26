import { scamPatterns, type ScamPattern, type ScamPatternRecommendedAction, type ScamPatternRiskTier } from './patterns.ts';

export type RadarPattern = {
  slug: string;
  name: string;
  riskTier: ScamPatternRiskTier;
  primaryTactic: string;
  doNotShare: string[];
  recommendedAction: ScamPatternRecommendedAction;
};

export type PressureTactic = {
  id: string;
  label: string;
  warningPhrase: string;
  matchedPlaybooks: string[];
};

const RISK_ORDER: Record<ScamPatternRiskTier, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3
};

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();

const buildPatternText = (pattern: ScamPattern) =>
  normalize([
    pattern.title,
    pattern.shortTitle,
    pattern.summary,
    pattern.scamGoal,
    pattern.pressureTactics.join(' '),
    pattern.commonCallerClaims.join(' '),
    pattern.scriptDecoder.map((item) => `${item.says} ${item.means}`).join(' '),
    pattern.redFlags.join(' ')
      ].filter(Boolean).join(' '));

const TACTIC_RULES: Array<{
  id: string;
  label: string;
  warningPhrase: string;
  keywords: string[];
}> = [
  {
    id: 'urgency',
    label: 'Urgency pressure',
    warningPhrase: 'Your account will be blocked today unless you verify now.',
    keywords: ['urgent', 'urgency', 'today', 'now', 'immediately', 'last chance']
  },
  {
    id: 'authority-impersonation',
    label: 'Authority impersonation',
    warningPhrase: 'This is the fraud department. Do not hang up.',
    keywords: ['fraud department', 'police', 'government', 'official', 'agency', 'authority']
  },
  {
    id: 'fear-of-loss',
    label: 'Fear of loss',
    warningPhrase: 'If you do not act now, your account or package will be lost.',
    keywords: ['blocked', 'returned', 'lost', 'suspended', 'danger', 'hackers']
  },
  {
    id: 'payment-pressure',
    label: 'Payment pressure',
    warningPhrase: 'Pay this fee now so we can release your case.',
    keywords: ['pay now', 'small fee', 'transfer', 'gift card', 'payment']
  },
  {
    id: 'secrecy',
    label: 'Secrecy and isolation',
    warningPhrase: 'Do not tell anyone else. Keep this confidential.',
    keywords: ['do not tell', 'confidential', 'secrecy', 'keep this private']
  },
  {
    id: 'remote-access',
    label: 'Remote access coercion',
    warningPhrase: 'Install this support tool while I guide you.',
    keywords: ['install', 'remote access', 'support tool', 'download this app']
  },
  {
    id: 'voice-familiarity',
    label: 'Voice familiarity manipulation',
    warningPhrase: 'It is me. I need help right now.',
    keywords: ['it is me', 'familiar voice', 'voice', 'family member']
  },
  {
    id: 'legal-threat',
    label: 'Legal threat escalation',
    warningPhrase: 'This is your final notice before court action.',
    keywords: ['legal action', 'court', 'final notice', 'arrest', 'debt']
  }
];

const sortedByRisk = (patterns: ScamPattern[]) =>
  [...patterns].sort((a, b) => RISK_ORDER[a.riskTier] - RISK_ORDER[b.riskTier] || a.shortTitle.localeCompare(b.shortTitle));

export const getRadarPatterns = (): RadarPattern[] =>
  sortedByRisk(scamPatterns).map((pattern) => ({
    slug: pattern.slug,
    name: pattern.shortTitle,
    riskTier: pattern.riskTier,
    primaryTactic: pattern.pressureTactics[0] ?? pattern.summary,
    doNotShare: pattern.doNotShare.slice(0, 3),
    recommendedAction: pattern.recommendedAction
  }));

export const getHighestRiskPatterns = (limit = 4): RadarPattern[] => getRadarPatterns().slice(0, Math.max(1, limit));

export const getPressureTactics = (): PressureTactic[] => {
  const patternsWithText = scamPatterns.map((pattern) => ({ pattern, text: buildPatternText(pattern) }));

  return TACTIC_RULES.map((rule) => {
    const matchedPlaybooks = patternsWithText
      .filter(({ text }) => rule.keywords.some((keyword) => text.includes(normalize(keyword))))
      .map(({ pattern }) => pattern.slug)
      .slice(0, 4);

    return {
      id: rule.id,
      label: rule.label,
      warningPhrase: rule.warningPhrase,
      matchedPlaybooks
    };
  }).filter((tactic) => tactic.matchedPlaybooks.length > 0);
};
