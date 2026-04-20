import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type ResetPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ResetareParolaPage({ searchParams }: ResetPasswordPageProps) {
  const params = (await searchParams) ?? {};
  const emailParam = params.email;
  const email = typeof emailParam === 'string' && emailParam.trim() ? emailParam : 'exemplu@email.com';

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[560px]">
        <Card className="p-8 sm:p-10">
          <div className="space-y-8">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Reseteaza parola</h1>
              <p className="max-w-xl text-base leading-7 text-slate-700">
                Introdu adresa de email asociata contului tau, iar noi iti trimitem un link de resetare.
              </p>
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

              <Button className="w-full rounded-2xl bg-slate-900 py-3 text-base hover:bg-black">
                Trimite link de resetare
              </Button>

              <Link
                href={`/autentificare/conectare?email=${encodeURIComponent(email)}`}
                className="inline-block text-base font-semibold underline text-slate-900 hover:text-slate-700"
              >
                Inapoi la autentificare
              </Link>
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
