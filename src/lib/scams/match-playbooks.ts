import type { AICallDecision } from '../decision/types.ts';
import { getScamPattern } from './patterns.ts';

export type PlaybookMatchStrength = 'strong' | 'possible';

export type PlaybookMatch = {
  slug: string;
  matchStrength: PlaybookMatchStrength;
  matchScore: number;
};

const scoreFor = (matchStrength: PlaybookMatchStrength, boost = 0) => {
  const base = matchStrength === 'strong' ? 78 : 62;
  return Math.max(0, Math.min(100, base + boost));
};

const dedupeAndLimit = (matches: PlaybookMatch[]) => {
  const unique = new Map<string, PlaybookMatch>();
  for (const match of matches) {
    if (!unique.has(match.slug)) unique.set(match.slug, match);
  }

  return Array.from(unique.values())
    .filter((match) => Boolean(getScamPattern(match.slug)))
    .slice(0, 2);
};

export const matchPlaybooks = (decision: AICallDecision): PlaybookMatch[] => {
  const matches: PlaybookMatch[] = [];

  if (decision.primaryAction === 'answer_cautiously' || decision.scenario === 'likely_safe') {
    return [];
  }

  if (decision.primaryAction === 'block' && decision.scenario === 'possible_impersonation') {
    matches.push(
      { slug: 'bank-otp', matchStrength: 'strong', matchScore: scoreFor('strong', decision.riskTier === 'critical' ? 8 : 0) },
      { slug: 'government-impersonation', matchStrength: 'possible', matchScore: scoreFor('possible', 4) }
    );

    if (decision.riskTier === 'critical') {
      matches.push({ slug: 'ai-voice-deepfake', matchStrength: 'possible', matchScore: scoreFor('possible', 6) });
    }
  }

  if (decision.primaryAction === 'block' && decision.scenario === 'possible_financial_scam') {
    matches.push(
      { slug: 'crypto-investment', matchStrength: 'strong', matchScore: scoreFor('strong', 6) },
      { slug: 'fake-debt-collector', matchStrength: 'possible', matchScore: scoreFor('possible', 5) }
    );
  }

  if (decision.primaryAction === 'verify_first' && decision.scenario === 'possible_delivery_or_service') {
    matches.push({ slug: 'delivery-otp', matchStrength: 'strong', matchScore: scoreFor('strong') });
  }

  if (
    decision.primaryAction === 'verify_first' &&
    (decision.scenario === 'possible_robocall' || decision.scenario === 'possible_sales_or_telemarketing')
  ) {
    matches.push({ slug: 'tech-support', matchStrength: 'strong', matchScore: scoreFor('strong', 2) });
  }

  return dedupeAndLimit(matches);
};
