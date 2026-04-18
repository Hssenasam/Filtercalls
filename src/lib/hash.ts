export function fnv1a32(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function digitFingerprint(national: string): number {
  let hash = 2166136261 >>> 0;
  for (let index = 0; index < national.length; index += 1) {
    const digit = national.charCodeAt(index) - 48;
    hash ^= (digit * 0x9e3779b1) ^ (index * 0x85ebca77);
    hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35);
    hash = (hash + Math.imul(digit + 1, index * 31 + 7)) >>> 0;
  }
  return hash >>> 0;
}

export function boundedJitter(seed: number, base: number, spreadPct = 0.18): number {
  const span = Math.max(4, Math.round(base * spreadPct));
  const offset = (digitFingerprint(String(seed)) % (span * 2)) - span;
  return Math.max(0, Math.min(100, base + offset));
}
