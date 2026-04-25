import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact FilterCalls — Get in Touch',
  description: 'Contact the FilterCalls team for support, API access, partnerships, or business call intelligence questions.',
  alternates: { canonical: 'https://filtercalls.com/contact' }
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
