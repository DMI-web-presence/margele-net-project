'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:3001';

const socialActions = [
  {
    label: 'Continua cu Google',
    icon: 'G',
    iconClass: 'text-red-500',
    href: `${backendUrl}/auth/google`,
  },
  { label: 'Continua cu Apple', icon: '', iconClass: 'text-slate-900' },
  { label: 'Continua cu Facebook', icon: 'f', iconClass: 'text-blue-600' },
];

export default function AutentificarePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim().toLowerCase();
    if (!email) return;

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${backendUrl}/auth/email-exists?email=${encodeURIComponent(email)}`,
      );

      if (!response.ok) {
        throw new Error('Email lookup failed');
      }

      const result = (await response.json()) as { exists?: boolean };
      const nextPath = result.exists
        ? `/autentificare/conectare?email=${encodeURIComponent(email)}`
        : `/autentificare/inregistrare?email=${encodeURIComponent(email)}`;

      router.push(nextPath);
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
                Autentificare sau inregistrare
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="text-sm font-semibold text-slate-900" htmlFor="email">
                Adresa de email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="exemplu@email.com"
                className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-slate-900 py-3 text-base hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Se verifica...' : 'Continua'}
              </Button>
            </form>

            <p className="text-sm leading-6 text-slate-700">
              Cand iti creezi un cont, esti de acord cu{' '}
              <Link href="#" className="font-semibold underline">
                Termenii de utilizare
              </Link>
              . Afla cum iti prelucram datele in{' '}
              <Link href="#" className="font-semibold underline">
                Nota de confidentialitate
              </Link>
              .
            </p>

            <div className="space-y-3">
              {socialActions.map((action) => (
                action.href ? (
                  <a
                    key={action.label}
                    href={action.href}
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    <span className={`text-lg ${action.iconClass}`}>{action.icon}</span>
                    <span>{action.label}</span>
                  </a>
                ) : (
                  <button
                    key={action.label}
                    type="button"
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-3 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-100"
                  >
                    <span className={`text-lg ${action.iconClass}`}>{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                )
              ))}
            </div>

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
