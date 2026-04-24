'use client';

import { Mail, MessageCircle, Phone, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ContactForm } from '@/components/contact/contact-form';

const phoneNumber = '+213794972473';
const whatsappUrl = 'https://wa.me/213794972473';
const email = 'contact@filtercalls.com';

export default function ContactPage() {
  return (
    <section className="space-y-8">
      <div className="max-w-3xl space-y-4">
        <p className="inline-flex rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-violet-200">Contact</p>
        <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">Contact FilterCalls</h1>
        <p className="text-lg text-white/60">Questions, support, API access, partnerships, or business inquiries — send a message and we will review it carefully.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <a href={`mailto:${email}`} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.05]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/10 text-violet-200"><Mail className="h-5 w-5" /></div>
          <p className="mt-4 text-sm font-medium text-white">Email</p>
          <p className="mt-1 text-sm text-white/50">{email}</p>
        </a>
        <a href={`tel:${phoneNumber}`} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.05]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200"><Phone className="h-5 w-5" /></div>
          <p className="mt-4 text-sm font-medium text-white">Phone</p>
          <p className="mt-1 text-sm text-white/50">{phoneNumber}</p>
        </a>
        <a href={whatsappUrl} target="_blank" rel="noreferrer" className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.05]">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200"><MessageCircle className="h-5 w-5" /></div>
          <p className="mt-4 text-sm font-medium text-white">WhatsApp</p>
          <p className="mt-1 text-sm text-white/50">{phoneNumber}</p>
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-4 border border-white/10 bg-white/[0.03]">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/10 text-violet-200"><Sparkles className="h-5 w-5" /></div>
          <h2 className="text-2xl font-semibold text-white">How to get the fastest response</h2>
          <p className="text-sm leading-6 text-white/50">For business, API, or partnership inquiries, include your use case, expected monthly lookup volume, and whether you need webhooks or custom limits.</p>
          <p className="text-sm leading-6 text-white/50">For custom plans, use the dedicated custom plan request form on the pricing page so we can qualify your volume and workflow correctly.</p>
        </Card>

        <Card className="space-y-5 border border-white/10 bg-white/[0.03]">
          <div>
            <h2 className="text-2xl font-semibold text-white">Send a message</h2>
            <p className="mt-1 text-sm text-white/45">This general contact form is connected to Formspree and delivered to the FilterCalls inbox.</p>
          </div>
          <ContactForm />
        </Card>
      </div>
    </section>
  );
}
