export type D1Result<T> = { results: T[] };

export type D1Prepared = {
  bind: (...values: unknown[]) => {
    first: <T = unknown>() => Promise<T | null>;
    all: <T = unknown>() => Promise<D1Result<T>>;
    run: () => Promise<unknown>;
  };
};

export type D1DatabaseLike = {
  prepare: (query: string) => D1Prepared;
};

const isD1DatabaseLike = (value: unknown): value is D1DatabaseLike =>
  !!value && typeof value === 'object' && typeof (value as D1DatabaseLike).prepare === 'function';

export const getD1 = () => {
  const globalRef = globalThis as unknown as {
    DB?: unknown;
    env?: { DB?: unknown };
    ENV?: { DB?: unknown };
    __env__?: { DB?: unknown };
    __ENV__?: { DB?: unknown };
  };

  const processEnvDb = process.env.DB as unknown;
  const candidates: unknown[] = [
    globalRef.DB,
    globalRef.env?.DB,
    globalRef.ENV?.DB,
    globalRef.__env__?.DB,
    globalRef.__ENV__?.DB,
    processEnvDb
  ];

  return candidates.find((candidate) => isD1DatabaseLike(candidate));
};

export const safeRun = async (task: () => Promise<unknown>) => {
  try {
    await task();
    return true;
  } catch {
    return false;
  }
};

export const maskE164 = (input: string) => {
  const value = input.trim();
  if (!value.startsWith('+')) return '***';
  const digits = value.replace(/\D/g, '');
  if (digits.length < 4) return '***';
  const countryPrefix = digits.length > 10 ? digits.slice(0, digits.length - 10) : digits.slice(0, 1);
  const lastTwo = digits.slice(-2);
  return `+${countryPrefix}${'*'.repeat(Math.max(4, digits.length - countryPrefix.length - 2))}${lastTwo}`;
};
