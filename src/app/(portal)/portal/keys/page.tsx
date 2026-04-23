'use client';
export const runtime = 'edge';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PortalKeysPage() {
  const [data, setData] = useState<Array<{id:string;name:string|null;created_at:number;revoked_at:number|null}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const getCsrf = () =>
    document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith('fc_csrf='))
      ?.split('=')
      .slice(1)
      .join('=');

  const load = useCallback(() =>
    fetch('/api/portal/keys', { cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace('/login?next=/portal/keys');
          return;
        }
        if (!response.ok) throw new Error('Failed');
        const json = await response.json();
        setData(json.results ?? []);
      })
      .catch(() => setError('Failed to load keys'))
      .finally(() => setLoading(false)), [router]);

  useEffect(() => {
    load();
  }, [load]);

  const createKey = async () => {
    setError(null);
    setSuccess(null);
    setCreating(true);
    try {
      const csrf = getCsrf();
      const response = await fetch('/api/portal/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'x-csrf-token': decodeURIComponent(csrf) } : {})
        },
        body: JSON.stringify({ name: newName || undefined })
      });
      if (response.status === 401) {
        router.replace('/login?next=/portal/keys');
        return;
      }
      if (!response.ok) throw new Error('Unable to create key');
      const json = await response.json();
      setRawKey(json.key ?? null);
      setSuccess('API key created successfully.');
      setNewName('');
      setLoading(true);
      await load();
    } catch {
      setError('Unable to create API key.');
    } finally {
      setCreating(false);
    }
  };

  const revokeKey = async (id: string) => {
    if (!window.confirm('Revoke this key? Requests using it will stop working.')) return;
    setError(null);
    setSuccess(null);
    try {
      const csrf = getCsrf();
      const response = await fetch(`/api/portal/keys/${id}`, {
        method: 'DELETE',
        headers: csrf ? { 'x-csrf-token': decodeURIComponent(csrf) } : {}
      });
      if (response.status === 401) {
        router.replace('/login?next=/portal/keys');
        return;
      }
      if (!response.ok) throw new Error('Unable to revoke key');
      setSuccess('API key revoked.');
      setData((previous) => previous.map((row) => (row.id === id ? { ...row, revoked_at: Date.now() } : row)));
    } catch {
      setError('Unable to revoke API key.');
    }
  };

  if (loading) return <section className="space-y-4"><div className="h-8 w-40 animate-pulse rounded bg-white/10" /><div className="grid gap-4"><div className="h-40 animate-pulse rounded-[2rem] bg-white/[0.04]" /><div className="h-24 animate-pulse rounded-[2rem] bg-white/[0.04]" /></div></section>;
  if (error) return <p>{error}</p>;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">API Keys</h1>
        <p className="mt-2 text-sm text-slate-300">Generate secure credentials for your apps and revoke them when they are no longer needed.</p>
      </div>
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 space-y-3">
        <label className="block text-sm">
          Key name
          <input value={newName} onChange={(event) => setNewName(event.target.value)} className="mt-2 w-full rounded-2xl bg-slate-900 border border-white/10 px-3 py-3" placeholder="production" />
        </label>
        <button type="button" onClick={createKey} disabled={creating} className="rounded-2xl bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-500 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {creating ? 'Creating…' : 'Create key'}
        </button>
        {rawKey ? <div className="rounded-2xl bg-emerald-900/30 border border-emerald-500/40 p-3 text-sm"><p className="font-medium">Copy this key now (shown once):</p><code className="break-all">{rawKey}</code></div> : null}
        {success ? <p className="text-emerald-300 text-sm">{success}</p> : null}
      </div>

      {!data.length ? (
        <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
          <p className="text-xl font-medium text-white">No API keys yet</p>
          <p className="mt-2 text-sm text-slate-400">Create your first key to start analyzing phone numbers securely from your own app or workflow.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((row) => (
            <li key={row.id} className="rounded-[1.5rem] border border-white/10 p-4 flex items-center justify-between gap-3 bg-white/[0.03]">
              <div>
                <p className="font-medium">{row.name ?? 'Unnamed key'}</p>
                <p className="text-xs text-slate-400">Created {new Date(row.created_at).toLocaleString()}</p>
                {row.revoked_at ? <p className="text-xs text-rose-300">Revoked</p> : null}
              </div>
              {!row.revoked_at ? <button type="button" onClick={() => revokeKey(row.id)} className="rounded-2xl border border-rose-500/40 text-rose-300 px-3 py-2 text-xs">Revoke</button> : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
