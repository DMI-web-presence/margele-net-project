'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:3001';

function EyeIcon({ visible = false }: { visible?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="2.5" />
      {visible ? <path d="M4 20 20 4" /> : null}
    </svg>
  );
}

export default function ConectarePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const email = useMemo(() => {
    const emailParam = searchParams.get('email');
    return emailParam && emailParam.trim() ? emailParam : 'exemplu@email.com';
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${backendUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        setErrorMessage('Emailul sau parola nu sunt corecte.');
        return;
      }

      router.push('/');
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[560px]">
        <Card className="p-8 sm:p-10">
          <div className="space-y-8">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Conectare</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">Adresa de email</label>
                <div className="flex items-center justify-between rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3">
                  <span className="truncate text-base text-slate-900">{email}</span>
                  <Link
                    href="/autentificare"
                    className="ml-4 shrink-0 text-sm font-semibold text-slate-700 underline hover:text-slate-900"
                  >
                    Editeaza
                  </Link>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900" htmlFor="parola-login">
                  Parola
                </label>
                <div className="flex items-center rounded-2xl border border-slate-300 bg-slate-100 px-4">
                  <input
                    id="parola-login"
                    type={showPassword ? 'text' : 'password'}
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Introdu parola"
                    className="w-full bg-transparent py-3 text-base text-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label="Afiseaza sau ascunde parola"
                    className="inline-flex cursor-pointer items-center justify-center text-slate-600 transition hover:text-slate-900"
                  >
                    <EyeIcon visible={showPassword} />
                  </button>
                </div>
              </div>

              {errorMessage ? (
                <p className="text-sm font-semibold text-red-600">{errorMessage}</p>
              ) : null}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-slate-900 py-3 text-base hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Se conecteaza...' : 'Conectare'}
              </Button>

              <Link
                href={`/autentificare/resetare-parola?email=${encodeURIComponent(email)}`}
                className="inline-block text-base font-semibold underline text-slate-900 hover:text-slate-700"
              >
                Ai uitat parola?
              </Link>
            </form>

            <div className="flex items-center justify-center gap-8 text-sm">
              <Link href="#" className="underline text-slate-700 hover:text-slate-900">
                Informare legala
              </Link>
              <Link href="#" className="underline text-slate-700 hover:text-slate-900">
                Nota de confidentialitate
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
