'use client';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);
  return (
    <form className="mx-auto max-w-md space-y-4" onSubmit={async (e)=>{e.preventDefault(); await fetch('/api/portal/forgot-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})}); setDone(true);}}>
      <h1 className="text-2xl font-semibold">Forgot password</h1>
      <input className="w-full rounded bg-slate-800 px-3 py-2" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="Email" />
      <button className="rounded bg-blue-500 px-4 py-2">Send reset link</button>
      {done ? <p className="text-sm text-slate-300">If that account exists, we sent a reset link.</p> : null}
    </form>
  );
}
