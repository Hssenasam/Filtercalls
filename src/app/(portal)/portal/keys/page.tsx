'use client';
export const runtime = 'edge';
import { useEffect, useState } from 'react';

export default function PortalKeysPage() {
  const [data, setData] = useState<Array<{id:string;name:string|null;created_at:number;revoked_at:number|null}>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(()=>{fetch('/api/portal/keys').then(async r=>{if(!r.ok) throw new Error('Failed'); const j=await r.json(); setData(j.results ?? []);}).catch(()=>setError('Failed to load keys')).finally(()=>setLoading(false));},[]);

  if (loading) return <p>Loading keys…</p>;
  if (error) return <p>{error}</p>;
  if (!data.length) return <p>No API keys yet.</p>;

  return <ul className="space-y-2">{data.map((row)=><li key={row.id} className="rounded border border-white/10 p-3">{row.name ?? 'Unnamed key'} · {new Date(row.created_at).toISOString()}</li>)}</ul>;
}
