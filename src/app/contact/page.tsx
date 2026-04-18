'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function ContactPage() {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (formData: FormData) => {
    setLoading(true);
    setStatus('idle');
    const payload = {
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      type: String(formData.get('type') ?? ''),
      message: String(formData.get('message') ?? '')
    };

    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    setStatus(response.ok ? 'success' : 'error');
    setLoading(false);
  };

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-semibold">Contact FilterCalls</h1>
      <Card>
        <form action={onSubmit} className="space-y-3">
          <Input name="name" placeholder="Full name" required />
          <Input name="email" type="email" placeholder="Work email" required />
          <select name="type" className="h-11 w-full rounded-xl border border-white/20 bg-white/5 px-3 text-sm" required>
            <option value="general">General</option>
            <option value="partnership">Partnership</option>
            <option value="business">Business</option>
            <option value="api">API access</option>
          </select>
          <textarea
            name="message"
            required
            placeholder="Tell us about your goals"
            className="min-h-28 w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm"
          />
          <Button disabled={loading}>{loading ? 'Sending...' : 'Send inquiry'}</Button>
          {status === 'success' ? <p className="text-sm text-success">Thanks — we received your inquiry.</p> : null}
          {status === 'error' ? <p className="text-sm text-danger">Submission failed. Please retry.</p> : null}
        </form>
      </Card>
    </section>
  );
}
