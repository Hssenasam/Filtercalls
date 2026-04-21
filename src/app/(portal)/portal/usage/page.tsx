'use client';
export const runtime = 'edge';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PortalUsagePage() {
  const [data, setData] = useState<{daily:Array<{day:string;analyses:number;high_risk:number}>;keys:Array<{id:string;name:string|null;analyses:number}>}|null>(null);
  const [state, setState] = useState<'loading'|'error'|'ready'>('loading');
  const router = useRouter();
  useEffect(()=>{
    fetch('/api/portal/usage', { cache: 'no-store' })
      .then(async response=>{
        if(response.status===401){ router.replace('/login?next=/portal/usage'); return; }
        if(!response.ok) throw new Error();
        setData(await response.json());
        setState('ready');
      })
      .catch(()=>setState('error'));
  },[router]);
  if (state==='loading') return <p>Loading usage…</p>;
  if (state==='error') return <p>Unable to load usage right now. Please refresh in a moment.</p>;
  if (!data || !data.daily.length) return <p>No usage in the last 30 days.</p>;
  return (
    <section className='space-y-4'>
      <h1 className='text-2xl font-semibold'>Usage</h1>
      <div className='rounded border border-white/10 p-3'>
        <h2 className='font-medium mb-2'>Daily volume</h2>
        <ul className='space-y-1 text-sm'>
          {data.daily.map((row)=><li key={row.day} className='flex justify-between'><span>{row.day}</span><span>{row.analyses} analyses · {row.high_risk ?? 0} high risk</span></li>)}
        </ul>
      </div>
      <div className='rounded border border-white/10 p-3'>
        <h2 className='font-medium mb-2'>Per-key breakdown</h2>
        {!data.keys.length ? <p className='text-sm text-slate-300'>No keys with usage yet.</p> : (
          <ul className='space-y-1 text-sm'>
            {data.keys.map((row)=><li key={row.id} className='flex justify-between'><span>{row.name ?? 'Unnamed key'}</span><span>{row.analyses}</span></li>)}
          </ul>
        )}
      </div>
    </section>
  );
}
