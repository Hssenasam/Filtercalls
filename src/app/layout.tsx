import type { Metadata } from 'next';
import '@/app/globals.css';
import { SiteShell } from '@/components/layout/site-shell';

export const metadata: Metadata = {
  metadataBase: new URL('https://filtercalls.com'),
  title: 'FilterCalls | Call Intent Intelligence Platform',
  description: 'Analyze inbound numbers with risk, trust, intent classification, and action guidance.',
  openGraph: {
    title: 'FilterCalls',
    description: 'Understand call intent before you answer.',
    url: 'https://filtercalls.com',
    siteName: 'FilterCalls'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
