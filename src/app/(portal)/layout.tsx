export const runtime = 'edge';
import Link from 'next/link';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-semibold">FilterCalls</Link>
          <nav className="flex gap-4 text-sm text-slate-300">
            <Link href="/portal/overview">Overview</Link>
            <Link href="/portal/keys">API Keys</Link>
            <Link href="/portal/webhooks">Webhooks</Link>
            <Link href="/portal/usage">Usage</Link>
            <Link href="/portal/settings">Settings</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
