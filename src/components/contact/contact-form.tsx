'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, LoaderCircle, Send, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xzdypggv';

const inquiryTypes = [
  ['general', 'General question'],
  ['support', 'Support'],
  ['business', 'Business / team use'],
  ['api', 'API access'],
  ['partnership', 'Partnership']
];

type ContactFormProps = {
  defaultType?: string;
  compact?: boolean;
  onSuccess?: () => void;
};

export const ContactForm = ({ defaultType = 'general', compact = false, onSuccess }: ContactFormProps) => {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus('idle');

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set('_subject', `FilterCalls inquiry: ${String(formData.get('type') ?? 'general')}`);
    formData.set('source', typeof window === 'undefined' ? 'FilterCalls' : window.location.href);

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData
      });

      if (!response.ok) throw new Error('Formspree submission failed');
      form.reset();
      setStatus('success');
      onSuccess?.();
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className={compact ? 'grid gap-3' : 'grid gap-3 sm:grid-cols-2'}>
        <Input name="name" placeholder="Full name" required autoComplete="name" />
        <Input name="email" type="email" placeholder="Work email" required autoComplete="email" />
      </div>

      <div className={compact ? 'grid gap-3' : 'grid gap-3 sm:grid-cols-2'}>
        <Input name="company" placeholder="Company / website" autoComplete="organization" />
        <select
          name="type"
          defaultValue={defaultType}
          className="h-11 w-full rounded-xl border border-white/20 bg-slate-950/80 px-3 text-sm text-white outline-none transition focus:border-violet-400/60"
          required
        >
          {inquiryTypes.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <textarea
        name="message"
        required
        maxLength={1200}
        placeholder="Tell us what you need. For custom pricing, use the dedicated custom plan request form on the pricing page."
        className="min-h-28 w-full rounded-xl border border-white/20 bg-slate-950/80 px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-violet-400/60"
      />

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {loading ? 'Sending...' : 'Send inquiry'}
      </Button>

      {status === 'success' ? (
        <p className="flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Thanks — your inquiry was sent successfully.</p>
      ) : null}
      {status === 'error' ? (
        <p className="flex items-center gap-2 text-sm text-red-300"><XCircle className="h-4 w-4" /> Submission failed. Please try again.</p>
      ) : null}
    </form>
  );
};
