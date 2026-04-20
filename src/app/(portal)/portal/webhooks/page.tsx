'use client';
import { useEffect, useState } from 'react';

export default function PortalWebhooksPage() {
  const [data, setData] = useState<Array<{id:string;url:string}>>([]);
  const [state, setState] = useState<'loading'|'error'|'ready'>('loading');
  useEffect(()=>{fetch('/api/portal/webhooks').then(async r=>{if(!r.ok) throw new Error(); const j=await r.json(); setData(j.results ?? []); setState('ready');}).catch(()=>setState('error'));},[]);
  if (state==='loading') return <p>Loading webhooks…</p>;
  if (state==='error') return <p>Unable to load webhooks.</p>;
  if (!data.length) return <p>No webhooks configured.</p>;
  return <ul className='space-y-2'>{data.map((w)=><li key={w.id} className='rounded border border-white/10 p-3'>{w.url}</li>)}</ul>;
}
