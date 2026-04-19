export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-API-Key,X-Request-ID',
  Vary: 'Origin'
};

export const resolveRequestIdFromHeaders = (headers: Headers) => headers.get('x-request-id') ?? crypto.randomUUID();

export const rateLimitKey = (apiKeyId: string, ip: string, minuteWindow: number) => `rl:${apiKeyId}:${ip}:${minuteWindow}`;
