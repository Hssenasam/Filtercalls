import { getRateKv } from '@/lib/rate-limit';

export const enforceWindowRateLimit = async (key: string, limit: number, windowSec: number) => {
  const kv = getRateKv();
  if (!kv) return { ok: true as const };

  const now = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(now / windowSec);
  const rlKey = `portal:${key}:${bucket}`;
  const current = Number((await kv.get(rlKey)) ?? '0') + 1;
  await kv.put(rlKey, String(current), { expirationTtl: windowSec + 10 });
  if (current > limit) return { ok: false as const, retryAfter: windowSec };
  return { ok: true as const };
};
