import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type RegisterPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InregistrarePage({ searchParams }: RegisterPageProps) {
  const params = (await searchParams) ?? {};
  const emailParam = params.email;
  const email = typeof emailParam === 'string' && emailParam.trim() ? emailParam : 'exemplu@email.com';

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[560px]">
        <Card className="p-8 sm:p-10">
          <div className="space-y-8">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Inregistrare</h1>
            </div>

            <div className="space-y-6">
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
                <label className="text-sm font-semibold text-slate-900" htmlFor="parola-register">
                  Parola
                </label>
                <input
                  id="parola-register"
                  type="password"
                  minLength={8}
                  placeholder="Introdu parola"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
                />
                <p className="text-xs text-slate-600">Parola trebuie sa aiba cel putin 8 caractere.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900" htmlFor="prenume">
                  Prenume
                </label>
                <input
                  id="prenume"
                  type="text"
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
                  placeholder="Introdu numele"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
                />
              </div>

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

              <Button className="w-full rounded-2xl bg-slate-900 py-3 text-base hover:bg-black">
                Inregistrare
              </Button>
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
