'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { createFormSpamState } from '@/lib/form-spam-protection';

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';

function ResetareParolaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const initialEmail = useMemo(() => {
    const emailParam = searchParams.get('email');
    return emailParam && emailParam.trim() ? emailParam : '';
  }, [searchParams]);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [spamState, setSpamState] = useState(() => createFormSpamState());

  useEffect(() => {
    if (cooldownSeconds <= 0) return;

    const timeoutId = window.setTimeout(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [cooldownSeconds]);

  const handleRequestSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${backendUrl}/auth/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          websiteUrl: spamState.websiteUrl,
          formStartedAt: spamState.formStartedAt,
        }),
      });
      const result = (await response.json().catch(() => null)) as {
        cooldownSeconds?: number;
        message?: string;
        retryAfterSeconds?: number;
      } | null;

      if (!response.ok) {
        setErrorMessage(result?.message ?? 'Nu am putut trimite linkul de resetare.');
        if (response.status === 429 && result?.retryAfterSeconds) {
          setCooldownSeconds(result.retryAfterSeconds);
        }
        return;
      }

      setMessage(result?.message ?? 'Daca exista un cont pentru aceasta adresa, vei primi un link de resetare.');
      setSpamState(createFormSpamState());
      setCooldownSeconds(result?.cooldownSeconds ?? 60);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const response = await fetch(`${backendUrl}/auth/password-reset/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const result = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setErrorMessage(result?.message ?? 'Nu am putut reseta parola.');
        return;
      }

      setMessage('Parola a fost resetata. Te conectam acum.');
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
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                Reseteaza parola
              </h1>
              <p className="max-w-xl text-base leading-7 text-slate-700">
                {token
                  ? 'Alege o parola noua pentru contul tau.'
                  : 'Introdu adresa de email asociata contului tau, iar noi iti trimitem un link de resetare.'}
              </p>
            </div>

            {token ? (
              <form onSubmit={handleConfirmSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900" htmlFor="parola-noua">
                    Parola noua
                  </label>
                  <input
                    id="parola-noua"
                    type="password"
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Introdu parola noua"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900" htmlFor="confirma-parola">
                    Confirma parola
                  </label>
                  <input
                    id="confirma-parola"
                    type="password"
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeta parola noua"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
                  />
                </div>

                <FeedbackMessage message={message} errorMessage={errorMessage} />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-slate-900 py-3 text-base hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Se reseteaza...' : 'Salveaza parola noua'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-6">
                <input
                  type="text"
                  name="websiteUrl"
                  value={spamState.websiteUrl}
                  onChange={(event) => setSpamState((current) => ({ ...current, websiteUrl: event.target.value }))}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-900" htmlFor="email-reset">
                    Adresa de email
                  </label>
                  <input
                    id="email-reset"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="exemplu@email.com"
                    className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
                  />
                </div>

                <FeedbackMessage message={message} errorMessage={errorMessage} />

                <Button
                  type="submit"
                  disabled={isSubmitting || cooldownSeconds > 0}
                  className="w-full rounded-2xl bg-slate-900 py-3 text-base hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? 'Se trimite...'
                    : cooldownSeconds > 0
                      ? `Poti retrimite in ${cooldownSeconds}s`
                      : 'Trimite link de resetare'}
                </Button>
              </form>
            )}

            <Link
              href={`/autentificare/conectare${email ? `?email=${encodeURIComponent(email)}` : ''}`}
              className="inline-block text-base font-semibold underline text-slate-900 hover:text-slate-700"
            >
              Inapoi la autentificare
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}

function FeedbackMessage({
  message,
  errorMessage,
}: {
  message: string;
  errorMessage: string;
}) {
  if (errorMessage) {
    return <p className="text-sm font-semibold text-red-600">{errorMessage}</p>;
  }

  if (message) {
    return <p className="text-sm font-semibold text-emerald-700">{message}</p>;
  }

  return null;
}

export default function ResetareParolaPage() {
  return (
    <Suspense>
      <ResetareParolaContent />
    </Suspense>
  );
}
