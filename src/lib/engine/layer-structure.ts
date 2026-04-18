import { fnv1a32 } from '@/lib/hash';
import { LayerResult } from '@/lib/engine/layer-types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const digitEntropy = (digits: string) => {
  if (!digits.length) return 0;
  const counts = new Array(10).fill(0);
  for (const d of digits) counts[Number(d)] += 1;

  let entropy = 0;
  for (const count of counts) {
    if (!count) continue;
    const p = count / digits.length;
    entropy -= p * Math.log2(p);
  }

  return entropy / Math.log2(10);
};

export const structureLayer = (e164: string): LayerResult => {
  const startedAt = performance.now();
  const digits = e164.replace(/\D/g, '');
  const national = digits.length > 10 ? digits.slice(-10) : digits;

  const entropy = digitEntropy(national);
  const repeatBlocks = /(\d)\1\1/.test(national) ? 1 : 0;
  const sequenceRun = /0123|1234|2345|3456|4567|5678|6789|9876|8765|7654/.test(national) ? 1 : 0;
  const suspiciousTail = /(0000|1234|9999|1212|4321)$/.test(national) ? 1 : 0;

  const baseRisk =
    15 +
    Math.round((1 - entropy) * 35) +
    repeatBlocks * 20 +
    sequenceRun * 12 +
    suspiciousTail * 15 +
    (fnv1a32(national) % 9);

  const risk = clamp(baseRisk, 0, 100);
  const trust = clamp(100 - risk + (fnv1a32(`${national}:trust`) % 7) - 3, 0, 100);

  const evidence = [
    `digit_entropy=${entropy.toFixed(2)}`,
    `repeat_blocks=${repeatBlocks}`,
    `sequence_run=${sequenceRun}`,
    `suspicious_tail=${suspiciousTail}`
  ];

  return {
    name: 'structure',
    risk,
    trust,
    confidence: 1,
    evidence,
    latencyMs: Math.max(1, Math.round(performance.now() - startedAt))
  };
};
