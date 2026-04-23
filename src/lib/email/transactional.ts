type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type EmailSendResult = {
  ok: boolean;
  id?: string;
  error?: string;
  providerStatus?: number;
};

const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'FilterCalls <noreply@filtercalls.com>';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const getEmailFrom = () => process.env.EMAIL_FROM?.trim() || DEFAULT_FROM;

export const canSendTransactionalEmail = () => !!process.env.RESEND_API_KEY;

export const sendTransactionalEmail = async ({ to, subject, html, text }: SendEmailArgs): Promise<EmailSendResult> => {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY is not configured' };
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to: [to],
      subject,
      html,
      text
    })
  });

  const data = (await response.json().catch(() => null)) as
    | { id?: string; message?: string; error?: string; name?: string }
    | null;

  if (!response.ok) {
    return {
      ok: false,
      error: data?.message || data?.error || data?.name || `Resend API returned HTTP ${response.status}`,
      providerStatus: response.status
    };
  }

  if (!data?.id) {
    return {
      ok: false,
      error: 'Resend API did not return a message id',
      providerStatus: response.status
    };
  }

  return { ok: true, id: data.id, providerStatus: response.status };
};

type VerificationEmailArgs = {
  to: string;
  verificationUrl: string;
  fullName?: string;
};

export const sendVerificationEmail = async ({ to, verificationUrl, fullName }: VerificationEmailArgs) => {
  const greetingName = fullName?.trim() ? ` ${escapeHtml(fullName.trim())}` : '';
  const escapedUrl = escapeHtml(verificationUrl);
  const subject = 'Verify your FilterCalls email';
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:600px;margin:0 auto;padding:24px;">
      <p style="font-size:14px;color:#475569;margin:0 0 16px;">FilterCalls account verification</p>
      <h1 style="font-size:24px;line-height:1.3;margin:0 0 16px;color:#020617;">Verify your email address</h1>
      <p style="margin:0 0 16px;">Hi${greetingName},</p>
      <p style="margin:0 0 16px;">Thanks for creating your FilterCalls account. Please confirm that this email belongs to you before signing in.</p>
      <p style="margin:24px 0;">
        <a href="${escapedUrl}" style="display:inline-block;background:#0ea5e9;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:600;">Verify email</a>
      </p>
      <p style="margin:0 0 12px;">If the button does not work, copy and paste this link into your browser:</p>
      <p style="margin:0 0 16px;word-break:break-all;"><a href="${escapedUrl}" style="color:#0284c7;">${escapedUrl}</a></p>
      <p style="margin:0;color:#64748b;font-size:14px;">If you did not create this account, you can safely ignore this email.</p>
    </div>
  `;
  const text = [
    'Verify your FilterCalls email',
    '',
    `Hi${fullName?.trim() ? ` ${fullName.trim()}` : ''},`,
    '',
    'Thanks for creating your FilterCalls account. Please verify your email before signing in.',
    '',
    verificationUrl,
    '',
    'If you did not create this account, you can ignore this email.'
  ].join('\n');

  return sendTransactionalEmail({ to, subject, html, text });
};
