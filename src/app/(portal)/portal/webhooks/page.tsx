'use client';
export const runtime = 'edge';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PortalWebhooksPage() {
  const [data, setData] = useState<Array<{id:string;url:string;disabled_at?:number|null}>>([]);
  const [state, setState] = useState<'loading'|'error'|'ready'>('loading');
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  const getCsrf = () =>
    document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith('fc_csrf='))
      ?.split('=')
      .slice(1)
      .join('=');

  const load = useCallback(
    () =>
      fetch('/api/portal/webhooks', { cache: 'no-store' })
        .then(async (response) => {
          if (response.status === 401) {
            router.replace('/login?next=/portal/webhooks');
            return;
          }
          if (!response.ok) throw new Error();
          const json = await response.json();
          setData(json.results ?? []);
          setState('ready');
        })
        .catch(() => setState('error')),
    [router]
  );

  useEffect(() => {
    load();
  }, [load]);

  const createWebhook = async () => {
    setMessage(null);
    try {
      const csrf = getCsrf();
      const response = await fetch('/api/portal/webhooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'x-csrf-token': decodeURIComponent(csrf) } : {})
        },
        body: JSON.stringify({ url, secret: secret || undefined })
      });
      if (response.status === 401) {
        router.replace('/login?next=/portal/webhooks');
        return;
      }
      if (!response.ok) throw new Error();
      setMessage('Webhook created.');
      setUrl('');
      setSecret('');
      await load();
    } catch {
      setMessage('Unable to create webhook.');
    }
  };

  const testWebhook = async (id: string) => {
    setMessage(null);
    try {
      const csrf = getCsrf();
      const response = await fetch(`/api/portal/webhooks/${id}/test`, {
        method: 'POST',
        headers: csrf ? { 'x-csrf-token': decodeURIComponent(csrf) } : {}
      });
      if (!response.ok) throw new Error();
      const json = await response.json();
      setMessage(json.ok ? 'Test delivery succeeded.' : `Test delivery failed (${json.status}).`);
    } catch {
      setMessage('Unable to send test webhook.');
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!window.confirm('Delete this webhook?')) return;
    setMessage(null);
    try {
      const csrf = getCsrf();
      const response = await fetch(`/api/portal/webhooks/${id}`, {
        method: 'DELETE',
        headers: csrf ? { 'x-csrf-token': decodeURIComponent(csrf) } : {}
      });
      if (!response.ok) throw new Error();
      setMessage('Webhook deleted.');
      setData((previous) => previous.filter((row) => row.id !== id));
    } catch {
      setMessage('Unable to delete webhook.');
    }
  };

  if (state==='loading') return <section className="space-y-4"><div className="h-8 w-40 animate-pulse rounded bg-white/10" /><div className="h-40 animate-pulse rounded-[2rem] bg-white/[0.04]" /><div className="h-24 animate-pulse rounded-[2rem] bg-white/[0.04]" /></section>;
  if (state==='error') return <p>Unable to load webhooks.</p>;
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Webhooks</h1>
        <p className="mt-2 text-sm text-slate-300">Send detection events directly into your own automations and systems.</p>
      </div>
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/webhook" className="w-full rounded-2xl bg-slate-900 border border-white/10 px-3 py-3" />
        <input value={secret} onChange={(event) => setSecret(event.target.value)} placeholder="Optional signing secret" className="w-full rounded-2xl bg-slate-900 border border-white/10 px-3 py-3" />
        <button type="button" onClick={createWebhook} className="rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white">Create webhook</button>
        {message ? <p className="text-sm text-slate-300">{message}</p> : null}
      </div>
      {!data.length ? (
        <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="text-xl font-medium text-white">No webhooks configured yet</p>
          <p className="mt-2 text-sm text-slate-400">Add a webhook to receive live notifications when FilterCalls processes new analyses.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((webhook) => (
            <li key={webhook.id} className="rounded-[1.5rem] border border-white/10 p-4 flex items-center justify-between gap-3 bg-white/[0.03]">
              <div>
                <p className="font-medium break-all">{webhook.url}</p>
                {webhook.disabled_at ? <p className="text-xs text-amber-300">Disabled</p> : null}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => testWebhook(webhook.id)} className="rounded-2xl border border-white/20 px-3 py-2 text-xs">Test</button>
                <button type="button" onClick={() => deleteWebhook(webhook.id)} className="rounded-2xl border border-rose-500/40 text-rose-300 px-3 py-2 text-xs">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
