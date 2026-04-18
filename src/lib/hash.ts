export const fnv1a32 = (input: string): number => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
};

export const boundedJitter = (seedText: string, min: number, max: number) => {
  const hash = fnv1a32(seedText);
  const span = max - min + 1;
  return min + (hash % span);
};
