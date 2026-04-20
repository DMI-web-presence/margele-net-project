import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type SignInPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export default async function ConectarePage({ searchParams }: SignInPageProps) {
  const params = (await searchParams) ?? {};
  const emailParam = params.email;
  const email = typeof emailParam === 'string' && emailParam.trim() ? emailParam : 'exemplu@email.com';

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-[560px]">
        <Card className="p-8 sm:p-10">
          <div className="space-y-8">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Autentificare</h1>
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
                <label className="text-sm font-semibold text-slate-900" htmlFor="parola-login">
                  Parola
                </label>
                <div className="flex items-center rounded-2xl border border-slate-300 bg-slate-100 px-4">
                  <input
                    id="parola-login"
                    type="password"
                    minLength={8}
                    placeholder="Introdu parola"
                    className="w-full bg-transparent py-3 text-base text-slate-900 outline-none"
                  />
                  <button
                    type="button"
                    aria-label="Afiseaza sau ascunde parola"
                    className="inline-flex cursor-pointer items-center justify-center text-slate-600 transition hover:text-slate-900"
                  >
                    <EyeIcon />
                  </button>
                </div>
              </div>

              <Button className="w-full rounded-2xl bg-slate-900 py-3 text-base hover:bg-black">
                Autentificare
              </Button>

              <Link
                href={`/autentificare/resetare-parola?email=${encodeURIComponent(email)}`}
                className="inline-block text-base font-semibold underline text-slate-900 hover:text-slate-700"
              >
                Ai uitat parola?
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
