import { redirect } from 'next/navigation';

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const token = (await searchParams).token;
  if (token) {
    await fetch(`${process.env.PORTAL_BASE_URL ?? 'http://localhost:3000'}/api/portal/verify-email?token=${encodeURIComponent(token)}`, { cache: 'no-store' });
  }
  redirect('/portal/overview');
}
