export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,X-API-Key,X-Request-ID,X-Admin-Token',
  Vary: 'Origin'
};

export const resolveRequestIdFromHeaders = (headers: Headers) => headers.get('x-request-id') ?? crypto.randomUUID();
