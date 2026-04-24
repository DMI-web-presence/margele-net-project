'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:3001';

const accountLinks = [
  { href: '/cont/adrese', label: 'Contul tau' },
  { href: '/cont/comenzi', label: 'Comenzi' },
  { href: '/cont/date-personale', label: 'Date personale' },
  { href: '/cont', label: 'Ajutor & FAQ' },
];

type AccountPreviewCardProps = {
  isAuthenticated: boolean;
  onLoggedOut?: () => void;
};

export default function AccountPreviewCard({
  isAuthenticated,
  onLoggedOut,
}: AccountPreviewCardProps) {
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
      onLoggedOut?.();
      router.push('/');
      router.refresh();
      setIsSigningOut(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="w-[340px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
        <Link
          href="/autentificare"
          className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
        >
          Conectare
        </Link>

        <div className="mt-2">
          <Link
            href="/autentificare"
            className="block rounded-lg px-2 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
          >
            Contul meu
          </Link>
          <Link
            href="/autentificare"
            className="block rounded-lg px-2 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
          >
            Comenzi
          </Link>
          <Link
            href="/autentificare"
            className="block rounded-lg px-2 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
          >
            Date personale
          </Link>
          {/* <Link
            href="/autentificare"
            className="block rounded-lg px-2 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
          >
            Retur produs
          </Link> */}
          <Link
            href="/autentificare"
            className="block rounded-lg px-2 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
          >
            Ajutor & FAQ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[340px] rounded-2xl border border-slate-200 bg-white p-0 shadow-xl">
      <div className="space-y-1 px-6 py-5">
        {accountLinks.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="block rounded-lg px-2 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="border-t border-slate-200 px-6 py-4">
        <button
          type="button"
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="cursor-pointer text-sm font-semibold text-slate-900 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSigningOut ? 'Se deconecteaza...' : 'Deconectare'}
        </button>
      </div>
    </div>
  );
}
