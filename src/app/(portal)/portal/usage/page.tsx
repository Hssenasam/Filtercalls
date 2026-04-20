'use client';
import { useEffect, useState } from 'react';

export default function PortalUsagePage() {
  const [data, setData] = useState<{daily:Array<{day:string;analyses:number;high_risk:number}>;keys:Array<{id:string;name:string|null;analyses:number}>}|null>(null);
  const [state, setState] = useState<'loading'|'error'|'ready'>('loading');
  useEffect(()=>{fetch('/api/portal/usage').then(async r=>{if(!r.ok) throw new Error(); setData(await r.json()); setState('ready');}).catch(()=>setState('error'));},[]);
  if (state==='loading') return <p>Loading usage…</p>;
  if (state==='error') return <p>Unable to load usage.</p>;
  if (!data || !data.daily.length) return <p>No usage in the last 30 days.</p>;
  return <div><h1 className='text-2xl font-semibold mb-4'>Usage</h1><pre className='text-xs'>{JSON.stringify(data,null,2)}</pre></div>;
}
