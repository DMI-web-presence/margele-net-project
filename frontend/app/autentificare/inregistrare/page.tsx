'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:3001';

export default function InregistrarePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [clientType, setClientType] = useState<'Persoana fizica' | 'Persoana juridica'>(
    'Persoana fizica',
  );
  const [companyName, setCompanyName] = useState('');
  const [cui, setCui] = useState('');
  const [tradeRegisterNumber, setTradeRegisterNumber] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
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
      const response = await fetch(`${backendUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          clientType,
          companyName,
          cui,
          tradeRegisterNumber,
          newsletterSubscribed,
        }),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { message?: string } | null;
        setErrorMessage(result?.message ?? 'Nu am putut crea contul.');
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
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Inregistrare</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900" htmlFor="email-register">
                  Adresa de email
                </label>
                <input
                  id="email-register"
                  type="email"
                  value={email}
                  disabled
                  className="w-full cursor-not-allowed rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none opacity-80"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900" htmlFor="parola-register">
                  Parola
                </label>
                <input
                  id="parola-register"
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Introdu parola"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
                />
                <p className="text-xs text-slate-600">Parola trebuie sa aiba cel putin 8 caractere.</p>
              </div>

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-900">Tip client</legend>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-900">
                    <input
                      type="radio"
                      name="tip-client"
                      value="Persoana fizica"
                      checked={clientType === 'Persoana fizica'}
                      onChange={() => setClientType('Persoana fizica')}
                      className="h-4 w-4 accent-slate-900"
                    />
                    Persoana fizica
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-900">
                    <input
                      type="radio"
                      name="tip-client"
                      value="Persoana juridica"
                      checked={clientType === 'Persoana juridica'}
                      onChange={() => setClientType('Persoana juridica')}
                      className="h-4 w-4 accent-slate-900"
                    />
                    Persoana juridica
                  </label>
                </div>
              </fieldset>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900" htmlFor="prenume">
                  Prenume
                </label>
                <input
                  id="prenume"
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Introdu prenumele"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900" htmlFor="nume">
                  Nume
                </label>
                <input
                  id="nume"
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Introdu numele"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
                />
              </div>

              {clientType === 'Persoana juridica' ? (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-900" htmlFor="nume-firma">
                      Nume firma
                    </label>
                    <input
                      id="nume-firma"
                      type="text"
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                      placeholder="Introdu numele firmei"
                      className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-900" htmlFor="cui">
                      CUI
                    </label>
                    <input
                      id="cui"
                      type="text"
                      value={cui}
                      onChange={(event) => setCui(event.target.value)}
                      placeholder="Introdu CUI"
                      className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-semibold text-slate-900"
                      htmlFor="registru-comert"
                    >
                      Numar de inregistrare registru comert
                    </label>
                    <input
                      id="registru-comert"
                      type="text"
                      value={tradeRegisterNumber}
                      onChange={(event) => setTradeRegisterNumber(event.target.value)}
                      placeholder="Introdu numarul de inregistrare"
                      className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
                    />
                  </div>
                </>
              ) : null}

              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-slate-900">
                  Abonare la newsletter
                </legend>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-900">
                    <input
                      type="radio"
                      name="newsletter"
                      checked={newsletterSubscribed}
                      onChange={() => setNewsletterSubscribed(true)}
                      className="h-4 w-4 accent-slate-900"
                    />
                    Da
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-900">
                    <input
                      type="radio"
                      name="newsletter"
                      checked={!newsletterSubscribed}
                      onChange={() => setNewsletterSubscribed(false)}
                      className="h-4 w-4 accent-slate-900"
                    />
                    Nu
                  </label>
                </div>
              </fieldset>

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

              {errorMessage ? (
                <p className="text-sm font-semibold text-red-600">{errorMessage}</p>
              ) : null}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-slate-900 py-3 text-base hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Se creeaza contul...' : 'Inregistrare'}
              </Button>
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
