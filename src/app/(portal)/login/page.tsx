'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <form className="mx-auto max-w-md space-y-4 rounded-lg border border-white/10 bg-slate-900 p-6" onSubmit={async (event) => {
      event.preventDefault();
      setError(null);
      const response = await fetch('/api/portal/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      if (!response.ok) {
        const data = await response.json();
        setError(data.error?.message ?? 'Login failed');
        return;
      }
      router.push('/portal/overview');
    }}>
      <h1 className="text-2xl font-semibold">Log in</h1>
      <input className="w-full rounded bg-slate-800 px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="w-full rounded bg-slate-800 px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button className="rounded bg-blue-500 px-4 py-2 font-medium">Log in</button>
    </form>
  );
}
