'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Card } from '@/components/ui/card';

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:3001';

const accountItems = [
  { label: 'Contul tau', href: '/cont/adrese' },
  { label: 'Comenzi', href: '#' },
  { label: 'Retur produs', href: '#' },
  { label: 'Marimile tale', href: '#' },
  { label: 'Ajutor & FAQ', href: '#' },
];

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
      <div className="mx-auto max-w-[560px]">
        <Card className="p-0">
          <div className="border-b border-slate-200 px-8 py-6">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Contul meu
            </h1>
          </div>

          <div className="space-y-1 px-8 py-6">
            {accountItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="block rounded-lg px-2 py-3 text-2xl text-slate-900 transition hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}

            <div className="px-2 py-3">
              <span className="inline-flex items-center rounded-full border border-slate-400 px-3 py-1 text-xl font-semibold text-slate-900">
                Plus
              </span>
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
