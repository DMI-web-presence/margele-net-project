'use client';

import Link from 'next/link';
import {
  useState,
  useSyncExternalStore,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import {
  defaultCookiePreferences,
  readCookiePreferences,
  writeCookiePreferences,
  type CookiePreferences,
} from '@/lib/cookie-consent';

const consentHighlights = [
  { label: 'GDPR', icon: <LockIcon className="h-4 w-4" /> },
  { label: 'Confidential', icon: <ShieldOutlineIcon className="h-4 w-4" /> },
  { label: 'Control rapid', icon: <BoltIcon className="h-4 w-4" /> },
];

export default function CookieConsent() {
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [draftPreferences, setDraftPreferences] = useState<CookiePreferences | null>(null);
  const [hasSavedChoice, setHasSavedChoice] = useState(false);
  const isHydrated = useSyncExternalStore(subscribeToHydration, getClientSnapshot, getServerSnapshot);
  const storedPreferences = isHydrated ? readCookiePreferences() : null;
  const preferences = draftPreferences ?? storedPreferences ?? defaultCookiePreferences;
  const isVisible = isHydrated && !storedPreferences && !hasSavedChoice;

  const savePreferences = (nextPreferences: CookiePreferences) => {
    writeCookiePreferences(nextPreferences);
    setDraftPreferences(nextPreferences);
    setHasSavedChoice(true);
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
    setDraftPreferences((current) => ({
      ...(current ?? preferences),
      [key]: !(current ?? preferences)[key],
    }));
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6">
      <section
        aria-label="Preferinte cookie-uri"
        className="relative mx-auto max-w-[1720px] overflow-hidden rounded-[30px] border border-[#d9ddf3] bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(250,248,255,0.98)_100%)] px-5 py-5 text-[#172554] shadow-[0_24px_90px_rgba(88,28,135,0.12)] backdrop-blur md:px-8 md:py-7"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-[#d9ddf3]" />
        <div className="absolute left-0 top-0 h-[3px] w-[42%] max-w-[810px] rounded-r-full bg-[linear-gradient(90deg,#8b7dff_0%,#3d27ff_100%)]" />

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_auto] xl:items-center xl:gap-8">
          <div className="min-w-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.95)_0%,rgba(99,102,241,0.12)_58%,rgba(99,102,241,0.16)_100%)] text-[#4f46e5] shadow-[inset_0_0_0_1px_rgba(129,140,248,0.08)]">
                <CookieShieldIcon className="h-9 w-9" />
              </div>

              <div className="min-w-0 space-y-4 pt-1">
                <div className="space-y-2.5">
                  <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-[#14213d] sm:text-[2.7rem] sm:leading-[1.02]">
                    Setari cookie-uri
                  </h2>
                  <p className="max-w-[640px] text-[0.98rem] leading-[1.7] text-[#566585] sm:text-[1.05rem]">
                    Folosim cookie-uri necesare pentru functionarea magazinului. Cu acordul tau,
                    putem folosi cookie-uri pentru statistici si continut personalizat.
                  </p>
                </div>

                <Link
                  href="/gdpr"
                  className="inline-flex items-center gap-2.5 text-[0.98rem] font-medium text-[#4f46e5] transition hover:text-[#3827ff]"
                >
                  <span>Pagina GDPR</span>
                  <ArrowUpRightIcon className="h-4 w-4" />
                </Link>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  {consentHighlights.map((item) => (
                    <span
                      key={item.label}
                      className="inline-flex min-h-10 items-center gap-2 rounded-2xl border border-[#d8dcec] bg-white px-4 text-[0.92rem] font-medium text-[#33415c] shadow-[0_10px_30px_rgba(76,81,109,0.06)]"
                    >
                      <span className="text-[#4f46e5]">{item.icon}</span>
                      <span>{item.label}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3 xl:min-w-[860px] xl:flex-row xl:items-stretch xl:justify-end">
            <CookieActionButton onClick={rejectOptional} icon={<BanIcon className="h-5 w-5" />}>
              Refuza optionale
            </CookieActionButton>
            <CookieActionButton
              onClick={() => setIsCustomizing((current) => !current)}
              icon={<SlidersIcon className="h-5 w-5" />}
            >
              Personalizeaza
            </CookieActionButton>
            <CookieLinkButton href="/gdpr" icon={<ArrowUpRightIcon className="h-5 w-5" />}>
              Vezi pagina
            </CookieLinkButton>
            <button
              type="button"
              onClick={acceptAll}
              className="inline-flex min-h-[62px] cursor-pointer items-center justify-center gap-2 rounded-[18px] border border-[#5b3fff] bg-[linear-gradient(135deg,#7c3aed_0%,#3d27ff_100%)] px-4.5 text-[0.92rem] font-semibold text-white shadow-[0_16px_38px_rgba(90,48,245,0.34)] transition hover:translate-y-[-1px] hover:shadow-[0_20px_44px_rgba(90,48,245,0.38)] xl:min-w-[176px]"
            >
              <CheckCircleIcon className="h-5 w-5" />
              <span>Accepta toate</span>
            </button>
          </div>
        </div>

        {isCustomizing ? (
          <div className="mt-7 rounded-[26px] border border-[#e2e5f2] bg-[rgba(255,255,255,0.92)] p-5 shadow-[0_16px_40px_rgba(90,48,245,0.06)] sm:p-6">
            <div className="grid gap-3 sm:grid-cols-3">
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
            </div>

            <div className="mt-4">
              <button
                type="button"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#7c3aed_0%,#3d27ff_100%)] px-6 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(90,48,245,0.22)] transition hover:translate-y-[-1px]"
                onClick={() => savePreferences(preferences)}
              >
                Salveaza preferintele
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function subscribeToHydration() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

function CookieActionButton({
  className,
  icon,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: ReactNode }) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-[62px] cursor-pointer items-center justify-center gap-2 rounded-[18px] border border-[#d8dcec] bg-white px-4.5 text-[0.92rem] font-semibold text-[#1e293b] shadow-[0_12px_30px_rgba(76,81,109,0.08)] transition hover:translate-y-[-1px] hover:border-[#c8cfe6] hover:shadow-[0_16px_34px_rgba(76,81,109,0.1)] xl:min-w-[176px] ${className ?? ''}`}
    >
      <span className="text-[#4f46e5]">{icon}</span>
      <span>{children}</span>
    </button>
  );
}

function CookieLinkButton({
  className,
  icon,
  children,
  href,
}: {
  className?: string;
  icon: ReactNode;
  children: ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-[62px] cursor-pointer items-center justify-center gap-2 rounded-[18px] border border-[#d8dcec] bg-white px-4.5 text-[0.92rem] font-semibold text-[#1e293b] shadow-[0_12px_30px_rgba(76,81,109,0.08)] transition hover:translate-y-[-1px] hover:border-[#c8cfe6] hover:shadow-[0_16px_34px_rgba(76,81,109,0.1)] xl:min-w-[164px] ${className ?? ''}`}
    >
      <span className="text-[#4f46e5]">{icon}</span>
      <span>{children}</span>
    </Link>
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
      className={`flex min-h-32 flex-col justify-between rounded-3xl border p-4 ${
        disabled
          ? 'border-[#e2e5f2] bg-[#f7f8fc]'
          : 'cursor-pointer border-[#d8dcec] bg-white shadow-[0_10px_24px_rgba(76,81,109,0.05)]'
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

function CookieShieldIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M24 5.5c3.8 4 9.13 5.25 14.5 5.92v11.32c0 8.73-5.65 16.62-14.5 19.76C15.15 39.36 9.5 31.47 9.5 22.74V11.42C14.87 10.75 20.2 9.5 24 5.5Z"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path
        d="M27.9 19.2a7.2 7.2 0 1 0-3.93 13.84 7.2 7.2 0 0 0 6.84-4.95"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M29.4 15.7c-1.28-.63-2.75-.96-4.3-.88"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="21.2" cy="23.1" r="1.2" fill="currentColor" />
      <circle cx="27" cy="24.6" r="1.2" fill="currentColor" />
      <circle cx="24.2" cy="28.7" r="1.2" fill="currentColor" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7.5 10V7.75a4.5 4.5 0 1 1 9 0V10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="5" y="10" width="14" height="10" rx="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="15" r="1.2" fill="currentColor" />
    </svg>
  );
}

function ShieldOutlineIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 3.75c1.8 1.88 4.33 2.47 6.88 2.79v5.32c0 4.1-2.68 7.8-6.88 9.27-4.2-1.47-6.88-5.17-6.88-9.27V6.54C7.67 6.22 10.2 5.63 12 3.75Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M13.25 3.75 6.5 13h4.65L10.75 20.25 17.5 11h-4.65l.4-7.25Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BanIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="m8.8 8.8 6.4 6.4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SlidersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 6h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 18h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="9" cy="6" r="2" fill="white" stroke="currentColor" strokeWidth="2" />
      <circle cx="15" cy="12" r="2" fill="white" stroke="currentColor" strokeWidth="2" />
      <circle cx="11" cy="18" r="2" fill="white" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function ArrowUpRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9 7h8v8M16.5 7.5 7 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="m8.5 12 2.3 2.3 4.7-4.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
