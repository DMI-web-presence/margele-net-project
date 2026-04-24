'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AccountSidebar from '@/components/account-sidebar';
import { Card } from '@/components/ui/card';

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:3001';

export default function ContPage() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await fetch(`${backendUrl}/auth/logout`, {
        method: 'GET',
        credentials: 'include',
      });
    } finally {
      router.push('/');
      router.refresh();
      setIsSigningOut(false);
    }
  };

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto grid max-w-[1100px] gap-6 lg:grid-cols-[18rem_1fr]">
        <AccountSidebar />

        <Card className="p-0">
          <div className="border-b border-slate-200 px-8 py-6">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Contul meu
            </h1>
          </div>

          <div className="px-8 py-6">
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-slate-600">
              Selecteaza o sectiune din meniul din stanga.
            </div>
          </div>

          <div className="border-t border-slate-200 px-8 py-5">
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="cursor-pointer text-2xl font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSigningOut ? 'Se deconecteaza...' : 'Deconectare'}
            </button>
          </div>
        </Card>
      </div>
    </main>
  );
}
