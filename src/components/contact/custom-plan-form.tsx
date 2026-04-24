'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, LoaderCircle, Send, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xzdypggv';

const volumeOptions = ['1k–5k / month', '5k–25k / month', '25k–100k / month', '100k+ / month', 'Not sure yet'];

export const CustomPlanForm = () => {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setStatus('idle');

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set('_subject', 'FilterCalls Custom Plan Request');
    formData.set('type', 'custom-plan');
    formData.set('source', typeof window === 'undefined' ? 'FilterCalls pricing' : window.location.href);

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: formData
      });
      if (!response.ok) throw new Error('Formspree submission failed');
      form.reset();
      setStatus('success');
    } catch {
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="name" placeholder="Full name" required autoComplete="name" />
        <Input name="email" type="email" placeholder="Work email" required autoComplete="email" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input name="company" placeholder="Company / website" autoComplete="organization" />
        <select
          name="expected_volume"
          required
          defaultValue=""
          className="h-11 w-full rounded-xl border border-white/20 bg-slate-950/80 px-3 text-sm text-white outline-none transition focus:border-cyan-400/60"
        >
          <option value="" disabled>Expected monthly volume</option>
          {volumeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </div>

      <textarea
        name="message"
        required
        maxLength={1500}
        placeholder="Tell us about your use case, required limits, API/webhook needs, and timeline."
        className="min-h-32 w-full rounded-xl border border-white/20 bg-slate-950/80 px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-cyan-400/60"
      />

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {loading ? 'Sending custom request...' : 'Send custom plan request'}
      </Button>

      <p className="text-xs leading-5 text-white/40">Prefer direct contact? Email contact@filtercalls.com or message us on WhatsApp.</p>
      {status === 'success' ? <p className="flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4" /> Custom plan request sent successfully.</p> : null}
      {status === 'error' ? <p className="flex items-center gap-2 text-sm text-red-300"><XCircle className="h-4 w-4" /> We could not send the request. Please try again.</p> : null}
    </form>
  );
};
