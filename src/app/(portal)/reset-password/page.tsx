'use client';
export const runtime = 'edge';

import { useMemo, useState } from 'react';

export default function ResetPasswordPage() {
  const token = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('token') ?? '';
  }, []);
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  return (
    <form className="mx-auto max-w-md space-y-4" onSubmit={async (e)=>{e.preventDefault(); const res=await fetch('/api/portal/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,password})}); setMessage(res.ok?'Password updated':'Reset failed');}}>
      <h1 className="text-2xl font-semibold">Reset password</h1>
      <input className="w-full rounded bg-slate-800 px-3 py-2" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder="New password" />
      <button className="rounded bg-blue-500 px-4 py-2">Reset</button>
      {message ? <p className="text-sm text-slate-300">{message}</p> : null}
    </form>
  );
}
