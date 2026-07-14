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

export default function CookieConsent() {
  const [hasMounted, setHasMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultCookiePreferences);

  useEffect(() => {
    setHasMounted(true);

    const storedPreferences = readCookiePreferences();
    if (!storedPreferences) {
      setIsVisible(true);
      return;
    }

    setPreferences(storedPreferences);
  }, []);

  const savePreferences = (nextPreferences: CookiePreferences) => {
    writeCookiePreferences(nextPreferences);
    setPreferences(nextPreferences);
    setIsVisible(false);
    setIsCustomizing(false);
  };

  const acceptAll = () => {
    savePreferences({
      necessary: true,
      analytics: true,
      marketing: true,
    });
  };

  const rejectOptional = () => {
    savePreferences(defaultCookiePreferences);
  };

  const togglePreference = (key: 'analytics' | 'marketing') => {
    setPreferences((current) => ({
      ...current,
      [key]: !current[key],
    }));
  };

  if (!hasMounted || !isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6">
      <section
        aria-label="Preferinte cookie-uri"
        className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-3 shadow-2xl sm:p-4"
      >
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-slate-950 sm:text-base">Setari cookie-uri</p>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Folosim cookie-uri necesare pentru functionarea magazinului. Cu acordul tau, putem
              folosi si cookie-uri pentru statistici si continut personalizat. Vezi detaliile pe{' '}
              <Link href="/gdpr" className="font-semibold text-indigo-700 underline underline-offset-4">
                pagina GDPR
              </Link>
              .
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <Button type="button" variant="secondary" onClick={rejectOptional}>
              Refuza optionale
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCustomizing((current) => !current)}
            >
              Personalizeaza
            </Button>
            <Link
              href="/gdpr"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Vezi pagina
            </Link>
            <Button type="button" onClick={acceptAll}>
              Accepta toate
            </Button>
          </div>
        </div>

        {isCustomizing ? (
          <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-3">
            <CookieToggle
              title="Necesare"
              description="Pastreaza cosul, sesiunea si setarile de baza."
              checked
              disabled
            />
            <CookieToggle
              title="Statistici"
              description="Ne ajuta sa intelegem ce pagini si produse sunt utile."
              checked={preferences.analytics}
              onChange={() => togglePreference('analytics')}
            />
            <CookieToggle
              title="Marketing"
              description="Permite continut si recomandari mai relevante."
              checked={preferences.marketing}
              onChange={() => togglePreference('marketing')}
            />

            <div className="sm:col-span-3">
              <Button type="button" className="w-full sm:w-auto" onClick={() => savePreferences(preferences)}>
                Salveaza preferintele
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function CookieToggle({
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
      className={`flex min-h-32 flex-col justify-between rounded-2xl border p-4 ${
        disabled ? 'border-slate-200 bg-slate-50' : 'cursor-pointer border-slate-200 bg-white'
      }`}
    >
      <span>
        <span className="block text-sm font-semibold text-slate-950">{title}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-600">{description}</span>
      </span>
      <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-slate-700">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={onChange}
          className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
        />
        {checked ? 'Activ' : 'Inactiv'}
      </span>
    </label>
  );
}
