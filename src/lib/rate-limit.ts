export type KvLike = {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
};

export const getRateKv = () => {
  const globalRef = globalThis as unknown as { RATE_LIMITS?: KvLike };
  return globalRef.RATE_LIMITS;
};

export const buildRateKey = (apiKeyId: string, ip: string, minute: number) => `rl:${apiKeyId}:${ip}:${minute}`;

export const enforceRateLimit = async (input: { apiKeyId: string; ip: string; rateLimitPerMin: number; amount?: number; kv?: KvLike }) => {
  const kv = input.kv ?? getRateKv();
  if (!kv) return { ok: true as const, count: 0 };

  const minute = Math.floor(Date.now() / 60_000);
  const key = buildRateKey(input.apiKeyId, input.ip, minute);
  const increment = Math.max(1, input.amount ?? 1);
  const next = Number((await kv.get(key)) ?? '0') + increment;
  await kv.put(key, String(next), { expirationTtl: 70 });

  if (next > input.rateLimitPerMin) {
    return { ok: false as const, retryAfterSeconds: 60, count: next };
  }

  return { ok: true as const, count: next };
};
