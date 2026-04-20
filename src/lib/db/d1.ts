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

export const getD1 = () => {
  const globalRef = globalThis as unknown as { DB?: D1DatabaseLike };
  return globalRef.DB;
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
