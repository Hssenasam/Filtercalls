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

  if (state==='loading') return <p>Loading webhooks…</p>;
  if (state==='error') return <p>Unable to load webhooks.</p>;
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Webhooks</h1>
      <div className="rounded border border-white/10 p-3 space-y-2">
        <input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/webhook" className="w-full rounded bg-slate-900 border border-white/10 px-2 py-1" />
        <input value={secret} onChange={(event) => setSecret(event.target.value)} placeholder="Optional signing secret" className="w-full rounded bg-slate-900 border border-white/10 px-2 py-1" />
        <button type="button" onClick={createWebhook} className="rounded bg-white text-slate-900 px-3 py-1 text-sm">Create webhook</button>
        {message ? <p className="text-sm text-slate-300">{message}</p> : null}
      </div>
      {!data.length ? (
        <p>No webhooks configured.</p>
      ) : (
        <ul className="space-y-2">
          {data.map((webhook) => (
            <li key={webhook.id} className="rounded border border-white/10 p-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium break-all">{webhook.url}</p>
                {webhook.disabled_at ? <p className="text-xs text-amber-300">Disabled</p> : null}
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => testWebhook(webhook.id)} className="rounded border border-white/20 px-2 py-1 text-xs">Test</button>
                <button type="button" onClick={() => deleteWebhook(webhook.id)} className="rounded border border-rose-500/40 text-rose-300 px-2 py-1 text-xs">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
