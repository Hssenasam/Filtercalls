export const stripHtml = (value: string) => value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

export const sanitizeText = (value: unknown, maxLength: number) => {
  if (typeof value !== 'string') return null;
  const cleaned = stripHtml(value).slice(0, maxLength).trim();
  return cleaned || null;
};

export const toLowerString = (value: unknown) => (typeof value === 'string' ? value.trim().toLowerCase() : '');
