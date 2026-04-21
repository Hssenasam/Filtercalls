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

  if (loading) return <p>Loading keys…</p>;
  if (error) return <p>{error}</p>;

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">API Keys</h1>
      <div className="rounded border border-white/10 p-3 space-y-2">
        <label className="block text-sm">
          Key name
          <input
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            className="mt-1 w-full rounded bg-slate-900 border border-white/10 px-2 py-1"
            placeholder="production"
          />
        </label>
        <button type="button" onClick={createKey} disabled={creating} className="rounded bg-white text-slate-900 px-3 py-1 text-sm disabled:opacity-60">
          {creating ? 'Creating…' : 'Create key'}
        </button>
        {rawKey ? (
          <div className="rounded bg-emerald-900/30 border border-emerald-500/40 p-2 text-sm">
            <p className="font-medium">Copy this key now (shown once):</p>
            <code className="break-all">{rawKey}</code>
          </div>
        ) : null}
        {success ? <p className="text-emerald-300 text-sm">{success}</p> : null}
      </div>

      {!data.length ? (
        <p>No API keys yet.</p>
      ) : (
        <ul className="space-y-2">
          {data.map((row) => (
            <li key={row.id} className="rounded border border-white/10 p-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{row.name ?? 'Unnamed key'}</p>
                <p className="text-xs text-slate-400">Created {new Date(row.created_at).toLocaleString()}</p>
                {row.revoked_at ? <p className="text-xs text-rose-300">Revoked</p> : null}
              </div>
              {!row.revoked_at ? (
                <button type="button" onClick={() => revokeKey(row.id)} className="rounded border border-rose-500/40 text-rose-300 px-2 py-1 text-xs">
                  Revoke
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
