'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  defaultCookiePreferences,
  readCookiePreferences,
  writeCookiePreferences,
  type CookiePreferences,
} from '@/lib/cookie-consent';

export default function GdprPageContent() {
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultCookiePreferences);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const storedPreferences = readCookiePreferences();
    if (storedPreferences) {
      setPreferences(storedPreferences);
    }
  }, []);

  const savePreferences = (nextPreferences: CookiePreferences) => {
    writeCookiePreferences(nextPreferences);
    setPreferences(nextPreferences);
  };

  return (
    <main className="px-6 py-10 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="space-y-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">GDPR</p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Cookie-uri si preferinte
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Aici poti vedea ce tipuri de cookie-uri folosim si iti poti actualiza alegerile oricand.
              Datele necesare raman active pentru ca magazinul sa functioneze corect.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Ce fac cookie-urile</h2>
            <div className="mt-4 space-y-4 text-sm leading-6 text-slate-700">
              <p>
                Cookie-urile necesare pastreaza cosul, sesiunea si preferintele de baza. Fara ele,
                site-ul nu ar functiona corect.
              </p>
              <p>
                Cookie-urile pentru statistici ne ajuta sa intelegem ce pagini sunt utile si unde
                putem imbunatati experienta.
              </p>
              <p>
                Cookie-urile de marketing pot fi folosite pentru recomandari mai relevante si continut
                mai apropiat de ce cauti.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <InfoCard title="Necesare" value="Active" description="Cos, autentificare, siguranta." />
              <InfoCard title="Statistici" value={preferences.analytics ? 'Active' : 'Inactive'} description="Analize pentru imbunatatire." />
              <InfoCard title="Marketing" value={preferences.marketing ? 'Active' : 'Inactive'} description="Recomandari si continut relevant." />
            </div>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-950">Preferintele tale</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {hasMounted
                ? 'Aceasta sectiune reflecta alegerea salvata in browserul tau.'
                : 'Se incarca preferintele locale.'}
            </p>

            <div className="mt-5 space-y-3">
              <PreferenceRow
                title="Necesare"
                description="Sunt intotdeauna active."
                checked
                disabled
              />
              <PreferenceRow
                title="Statistici"
                description="Ne ajuta sa masuram performanta site-ului."
                checked={preferences.analytics}
                onChange={() =>
                  setPreferences((current) => ({
                    ...current,
                    analytics: !current.analytics,
                  }))
                }
              />
              <PreferenceRow
                title="Marketing"
                description="Ne ajuta cu recomandari si promovare."
                checked={preferences.marketing}
                onChange={() =>
                  setPreferences((current) => ({
                    ...current,
                    marketing: !current.marketing,
                  }))
                }
              />
            </div>

            <div className="mt-5">
              <Button type="button" className="w-full" onClick={() => savePreferences(preferences)}>
                Salveaza preferintele
              </Button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Inapoi acasa
              </Link>
              <Link
                href="/catalog"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Vezi catalogul
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function InfoCard({ title, value, description }: { title: string; value: string; description: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
    </div>
  );
}

function PreferenceRow({
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: () => void;
}) {
  return (
    <label
      className={`flex items-start justify-between gap-4 rounded-2xl border p-4 ${
        disabled ? 'border-slate-200 bg-white' : 'cursor-pointer border-slate-200 bg-white'
      }`}
    >
      <span className="space-y-1">
        <span className="block text-sm font-semibold text-slate-950">{title}</span>
        <span className="block text-xs leading-5 text-slate-600">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="mt-1 h-4 w-4 rounded border-slate-300 accent-indigo-600"
      />
    </label>
  );
}
