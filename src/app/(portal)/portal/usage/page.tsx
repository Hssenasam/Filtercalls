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
  if (state==='loading') return <section className='space-y-4'><div className='h-8 w-40 animate-pulse rounded bg-white/10' /><div className='h-40 animate-pulse rounded-[2rem] bg-white/[0.04]' /><div className='h-32 animate-pulse rounded-[2rem] bg-white/[0.04]' /></section>;
  if (state==='error') return <p>Unable to load usage right now. Please refresh in a moment.</p>;
  if (!data || !data.daily.length) return <section className='rounded-[2rem] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center'><h1 className='text-2xl font-semibold'>Usage</h1><p className='mt-3 text-sm text-slate-400'>No usage in the last 30 days yet. Your charts and per-key breakdown will appear here after your first live requests.</p></section>;
  return (
    <section className='space-y-6'>
      <div>
        <h1 className='text-2xl font-semibold'>Usage</h1>
        <p className='mt-2 text-sm text-slate-300'>Monitor daily request volume and see which keys are driving traffic.</p>
      </div>
      <div className='rounded-[2rem] border border-white/10 bg-white/[0.03] p-5'>
        <h2 className='font-medium mb-3'>Daily volume</h2>
        <ul className='space-y-2 text-sm'>
          {data.daily.map((row)=><li key={row.day} className='flex justify-between rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3'><span>{row.day}</span><span>{row.analyses} analyses · {row.high_risk ?? 0} high risk</span></li>)}
        </ul>
      </div>
      <div className='rounded-[2rem] border border-white/10 bg-white/[0.03] p-5'>
        <h2 className='font-medium mb-3'>Per-key breakdown</h2>
        {!data.keys.length ? <p className='text-sm text-slate-300'>No keys with usage yet.</p> : (
          <ul className='space-y-2 text-sm'>
            {data.keys.map((row)=><li key={row.id} className='flex justify-between rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3'><span>{row.name ?? 'Unnamed key'}</span><span>{row.analyses}</span></li>)}
          </ul>
        )}
      </div>
    </section>
  );
}
