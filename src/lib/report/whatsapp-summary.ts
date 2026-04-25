import type { AICallDecision } from '@/lib/decision';

const ACTION_LABELS: Record<AICallDecision['primaryAction'], string> = {
  block: 'BLOCK',
  send_to_voicemail: 'SEND TO VOICEMAIL',
  verify_first: 'VERIFY FIRST',
  answer_cautiously: 'ANSWER CAUTIOUSLY'
};

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim();

export function buildWhatsAppSummary(decision: AICallDecision, maskedPhoneNumber: string): string {
  const safeNumber = normalizeWhitespace(maskedPhoneNumber || 'Masked number');
  const primaryReason = decision.reasons[0] ?? 'Decision-support guidance available';
  const doNotShare = decision.doNotShare.slice(0, 3).join(', ');
  const safeResponse = normalizeWhitespace(decision.recommendedResponse);

  const lines = [
    '⚠️ FilterCalls Alert',
    `Number: ${safeNumber}`,
    `Decision: ${ACTION_LABELS[decision.primaryAction]}`,
    `Risk tier: ${decision.riskTier}`,
    `Confidence: ${decision.confidence}%`,
    `Reason: ${primaryReason}`,
    `Safe response: "${safeResponse}"`,
    `Do not share: ${doNotShare}`,
    'https://filtercalls.com'
  ];

  return lines.join('\n');
}
