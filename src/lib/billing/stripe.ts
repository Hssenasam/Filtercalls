import { secureEquals } from '@/lib/auth/api-key';

const getEnv = (name: string) => {
  const globalRef = globalThis as unknown as Record<string, string> & {
    env?: Record<string, string>;
    ENV?: Record<string, string>;
    __env__?: Record<string, string>;
    __ENV__?: Record<string, string>;
  };
  return process.env[name] ?? globalRef[name] ?? globalRef.env?.[name] ?? globalRef.ENV?.[name] ?? globalRef.__env__?.[name] ?? globalRef.__ENV__?.[name];
};

export const stripeConfig = () => ({
  secretKey: getEnv('STRIPE_SECRET_KEY') ?? '',
  webhookSecret: getEnv('STRIPE_WEBHOOK_SECRET') ?? '',
  proPriceId: getEnv('STRIPE_PRICE_PRO_MONTHLY') ?? '',
  appUrl: getEnv('PORTAL_BASE_URL') ?? 'http://localhost:3000'
});

const stripeFetch = async (path: string, body: URLSearchParams) => {
  const { secretKey } = stripeConfig();
  if (!secretKey) throw new Error('STRIPE_NOT_CONFIGURED');
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });
  const json = await response.json();
  if (!response.ok) throw new Error(`STRIPE_API_ERROR:${json?.error?.message ?? response.status}`);
  return json as Record<string, unknown>;
};

export const createStripeCustomer = async (email: string, userId: string) => {
  const body = new URLSearchParams();
  body.set('email', email);
  body.set('metadata[user_id]', userId);
  const customer = await stripeFetch('customers', body);
  return String(customer.id);
};

export const createCheckoutSession = async (input: { customerId: string; userId: string }) => {
  const { proPriceId, appUrl } = stripeConfig();
  if (!proPriceId) throw new Error('STRIPE_PRICE_NOT_CONFIGURED');
  const body = new URLSearchParams();
  body.set('mode', 'subscription');
  body.set('customer', input.customerId);
  body.set('line_items[0][price]', proPriceId);
  body.set('line_items[0][quantity]', '1');
  body.set('success_url', `${appUrl}/portal/billing?checkout=success`);
  body.set('cancel_url', `${appUrl}/portal/billing?checkout=cancel`);
  body.set('metadata[user_id]', input.userId);
  const session = await stripeFetch('checkout/sessions', body);
  return String(session.url);
};

export const createBillingPortalSession = async (customerId: string) => {
  const { appUrl } = stripeConfig();
  const body = new URLSearchParams();
  body.set('customer', customerId);
  body.set('return_url', `${appUrl}/portal/billing`);
  const session = await stripeFetch('billing_portal/sessions', body);
  return String(session.url);
};

const hmacHex = async (secret: string, payload: string) => {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

export const verifyStripeWebhookSignature = async (signatureHeader: string | null, payload: string) => {
  const { webhookSecret } = stripeConfig();
  if (!webhookSecret || !signatureHeader) return false;
  const parts = signatureHeader.split(',').map((p) => p.trim());
  const tsPart = parts.find((p) => p.startsWith('t='));
  const v1Part = parts.find((p) => p.startsWith('v1='));
  if (!tsPart || !v1Part) return false;
  const timestamp = tsPart.slice(2);
  const provided = v1Part.slice(3);
  const signedPayload = `${timestamp}.${payload}`;
  const expected = await hmacHex(webhookSecret, signedPayload);
  return secureEquals(expected, provided);
};
