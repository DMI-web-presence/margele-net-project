'use client';

import type { FormEvent, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import AccountSidebar from '@/components/account-sidebar';

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:3001';

type PersonalInfo = {
  fullName: string;
  phone: string;
  preferences: string;
  birthDate: string;
  companyName: string;
  cui: string;
  tradeRegisterNumber: string;
  email: string;
  password: string;
};

type ProfileResponse = {
  fullName?: string;
  email?: string;
  phone?: string;
  preferences?: string;
  birthDate?: string | null;
  companyName?: string;
  cui?: string;
  tradeRegisterNumber?: string;
  canEditEmail?: boolean;
  canEditPassword?: boolean;
};

const emptyPersonalInfo: PersonalInfo = {
  fullName: '',
  phone: '',
  preferences: 'Persoana fizica',
  birthDate: '--',
  companyName: '--',
  cui: '--',
  tradeRegisterNumber: '--',
  email: '',
  password: '**************',
};

function normalizeProfile(profile: ProfileResponse): PersonalInfo {
  return {
    fullName: profile.fullName?.trim() || '--',
    phone: profile.phone?.trim() || '--',
    preferences: profile.preferences?.trim() || '--',
    birthDate: profile.birthDate?.trim() || '--',
    companyName: profile.companyName?.trim() || '--',
    cui: profile.cui?.trim() || '--',
    tradeRegisterNumber: profile.tradeRegisterNumber?.trim() || '--',
    email: profile.email?.trim() || '--',
    password: '**************',
  };
}

function readErrorMessage(result: unknown, fallback: string) {
  if (
    typeof result === 'object' &&
    result !== null &&
    'message' in result &&
    typeof (result as { message?: unknown }).message === 'string'
  ) {
    return (result as { message: string }).message;
  }

  if (
    typeof result === 'object' &&
    result !== null &&
    'message' in result &&
    Array.isArray((result as { message?: unknown }).message)
  ) {
    return String((result as { message: string[] }).message[0] ?? fallback);
  }

  return fallback;
}

function ProfileIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-9 w-9 fill-none stroke-current stroke-[1.8] text-slate-900"
    >
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.5 20a8.2 8.2 0 0 1 15 0" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-9 w-9 fill-none stroke-current stroke-[1.8] text-slate-900"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-9 w-9 fill-none stroke-current stroke-[1.8] text-slate-900"
    >
      <rect x="5" y="10" width="14" height="10" rx="2" />
      <path d="M8 10V8a4 4 0 1 1 8 0v2" />
      <circle cx="12" cy="15" r="1.2" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-2"
    >
      <path d="M4 20h4l10-10-4-4L4 16v4Z" />
      <path d="m12 6 4 4" />
    </svg>
  );
}

function EyeIcon({ visible = false }: { visible?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
      <circle cx="12" cy="12" r="3" />
      {visible ? <path d="M4 20 20 4" /> : null}
    </svg>
  );
}

function DetailItem({
  label,
  value,
  extra,
}: {
  label: string;
  value: string;
  extra?: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold text-slate-900">
        {label} {extra}
      </p>
      <p className="text-lg text-slate-900">{value}</p>
    </div>
  );
}

function EditButton({
  onClick,
  disabled,
}: {
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-12 min-w-[220px] cursor-pointer items-center justify-center gap-3 rounded-2xl border border-slate-900 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
    >
      <EditIcon />
      Modifica
    </button>
  );
}

type EditPersonalInfoModalProps = {
  open: boolean;
  initialValues: PersonalInfo;
  onClose: () => void;
  onSave: (
    values: Pick<
      PersonalInfo,
      'fullName' | 'phone' | 'preferences' | 'birthDate' | 'companyName' | 'cui' | 'tradeRegisterNumber'
    >,
  ) => Promise<void>;
};

function EditPersonalInfoModal({
  open,
  initialValues,
  onClose,
  onSave,
}: EditPersonalInfoModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedPreferences, setSelectedPreferences] = useState(
    initialValues.preferences === 'Persoana juridica'
      ? 'Persoana juridica'
      : 'Persoana fizica',
  );

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSaving(true);

    const data = new FormData(event.currentTarget);

    try {
      await onSave({
        fullName: String(data.get('fullName') ?? '').trim(),
        phone: String(data.get('phone') ?? '').trim(),
        preferences: String(data.get('preferences') ?? '').trim(),
        birthDate: String(data.get('birthDate') ?? '').trim() || '--',
        companyName: String(data.get('companyName') ?? '').trim(),
        cui: String(data.get('cui') ?? '').trim(),
        tradeRegisterNumber: String(data.get('tradeRegisterNumber') ?? '').trim(),
      });
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nu am putut salva modificarile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Modifica date personale"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-8 py-5">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              Modifica date personale
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Actualizeaza informatiile si confirma noile valori.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Inchide"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="personal-full-name" className="text-sm font-semibold text-slate-900">
                Nume complet
              </label>
              <input
                id="personal-full-name"
                name="fullName"
                required
                defaultValue={initialValues.fullName === '--' ? '' : initialValues.fullName}
                className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="personal-phone" className="text-sm font-semibold text-slate-900">
                Nr. telefon mobil
              </label>
              <input
                id="personal-phone"
                name="phone"
                defaultValue={initialValues.phone === '--' ? '' : initialValues.phone}
                className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="personal-preferences" className="text-sm font-semibold text-slate-900">
                Preferinte
              </label>
              <div
                id="personal-preferences"
                className="flex flex-col space-y-3 rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3"
              >
                <label className="inline-flex cursor-pointer items-center gap-3 text-base text-slate-900">
                  <input
                    type="radio"
                    name="preferences"
                    value="Persoana fizica"
                    onChange={() => setSelectedPreferences('Persoana fizica')}
                    defaultChecked={
                      (initialValues.preferences === '--'
                        ? 'Persoana fizica'
                        : initialValues.preferences) === 'Persoana fizica'
                    }
                  />
                  <span>Persoana fizica</span>
                </label>
                <label className="inline-flex cursor-pointer items-center gap-3 text-base text-slate-900">
                  <input
                    type="radio"
                    name="preferences"
                    value="Persoana juridica"
                    onChange={() => setSelectedPreferences('Persoana juridica')}
                    defaultChecked={initialValues.preferences === 'Persoana juridica'}
                  />
                  <span>Persoana juridica</span>
                </label>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="personal-birth-date" className="text-sm font-semibold text-slate-900">
                Data nasterii
              </label>
              <input
                id="personal-birth-date"
                name="birthDate"
                type="date"
                defaultValue={initialValues.birthDate === '--' ? '' : initialValues.birthDate}
                className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
              />
            </div>
          </div>

          {selectedPreferences === 'Persoana juridica' ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="personal-company-name" className="text-sm font-semibold text-slate-900">
                  Nume firma
                </label>
                <input
                  id="personal-company-name"
                  name="companyName"
                  required
                  defaultValue={initialValues.companyName === '--' ? '' : initialValues.companyName}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="personal-cui" className="text-sm font-semibold text-slate-900">
                  CUI
                </label>
                <input
                  id="personal-cui"
                  name="cui"
                  required
                  defaultValue={initialValues.cui === '--' ? '' : initialValues.cui}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="personal-trade-register-number"
                  className="text-sm font-semibold text-slate-900"
                >
                  Registru comert
                </label>
                <input
                  id="personal-trade-register-number"
                  name="tradeRegisterNumber"
                  required
                  defaultValue={
                    initialValues.tradeRegisterNumber === '--'
                      ? ''
                      : initialValues.tradeRegisterNumber
                  }
                  className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
                />
              </div>
            </div>
          ) : null}

          {errorMessage ? (
            <p className="text-sm font-semibold text-red-600">{errorMessage}</p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Anuleaza
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-slate-900 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Se salveaza...' : 'Confirma modificarile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type EditEmailModalProps = {
  open: boolean;
  initialEmail: string;
  onClose: () => void;
  onSave: (email: string) => Promise<void>;
};

function EditEmailModal({
  open,
  initialEmail,
  onClose,
  onSave,
}: EditEmailModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSaving(true);

    const data = new FormData(event.currentTarget);

    try {
      await onSave(String(data.get('email') ?? '').trim());
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nu am putut actualiza emailul.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Modifica email"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-8 py-5">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              Modifica e-mailul
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Introdu noua adresa de email si confirma modificarea.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Inchide"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-8">
          <div className="space-y-2">
            <label htmlFor="personal-email" className="text-sm font-semibold text-slate-900">
              E-mail nou
            </label>
            <input
              id="personal-email"
              name="email"
              type="email"
              required
              defaultValue={initialEmail === '--' ? '' : initialEmail}
              className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
            />
          </div>

          {errorMessage ? (
            <p className="text-sm font-semibold text-red-600">{errorMessage}</p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Anuleaza
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-slate-900 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Se salveaza...' : 'Confirma modificarile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type EditPasswordModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (values: {
    currentPassword: string;
    nextPassword: string;
    confirmPassword: string;
  }) => Promise<void>;
};

function EditPasswordModal({
  open,
  onClose,
  onSave,
}: EditPasswordModalProps) {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNextPassword, setShowNextPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!open) return null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSaving(true);

    const data = new FormData(event.currentTarget);

    try {
      await onSave({
        currentPassword: String(data.get('currentPassword') ?? '').trim(),
        nextPassword: String(data.get('nextPassword') ?? '').trim(),
        confirmPassword: String(data.get('confirmPassword') ?? '').trim(),
      });
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Nu am putut actualiza parola.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Modifica parola"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-8 py-5">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              Modifica parola
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Seteaza o parola noua si confirma actualizarea.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Inchide"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="current-password" className="text-sm font-semibold text-slate-900">
                Parola actuala
              </label>
              <div className="relative">
                <input
                  id="current-password"
                  name="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 pr-12 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((current) => !current)}
                  className="absolute inset-y-0 right-3 inline-flex cursor-pointer items-center justify-center text-slate-500 transition hover:text-slate-900"
                  aria-label={showCurrentPassword ? 'Ascunde parola actuala' : 'Afiseaza parola actuala'}
                >
                  <EyeIcon visible={showCurrentPassword} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="next-password" className="text-sm font-semibold text-slate-900">
                Parola noua
              </label>
              <div className="relative">
                <input
                  id="next-password"
                  name="nextPassword"
                  type={showNextPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 pr-12 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowNextPassword((current) => !current)}
                  className="absolute inset-y-0 right-3 inline-flex cursor-pointer items-center justify-center text-slate-500 transition hover:text-slate-900"
                  aria-label={showNextPassword ? 'Ascunde parola noua' : 'Afiseaza parola noua'}
                >
                  <EyeIcon visible={showNextPassword} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-semibold text-slate-900">
                Confirma parola
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 pr-12 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute inset-y-0 right-3 inline-flex cursor-pointer items-center justify-center text-slate-500 transition hover:text-slate-900"
                  aria-label={showConfirmPassword ? 'Ascunde confirmarea parolei' : 'Afiseaza confirmarea parolei'}
                >
                  <EyeIcon visible={showConfirmPassword} />
                </button>
              </div>
            </div>
          </div>

          {errorMessage ? (
            <p className="text-sm font-semibold text-red-600">{errorMessage}</p>
          ) : (
            <p className="text-sm text-slate-500">
              Dupa salvare, parola ramane afisata mascat pe pagina.
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-50"
            >
              Anuleaza
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-2xl border border-slate-900 bg-white px-6 py-3 text-base font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Se salveaza...' : 'Confirma modificarile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-6 border-b border-slate-200 py-8 lg:grid-cols-[3.5rem_1fr_auto] lg:items-center">
      <div className="flex h-12 w-12 items-start justify-center pt-1 text-slate-900">{icon}</div>
      {children}
    </section>
  );
}

export default function ContDatePersonalePage() {
  const [personalInfo, setPersonalInfo] = useState(emptyPersonalInfo);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [canEditEmail, setCanEditEmail] = useState(true);
  const [canEditPassword, setCanEditPassword] = useState(true);
  const [isPersonalInfoModalOpen, setIsPersonalInfoModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const response = await fetch(`${backendUrl}/auth/profile`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Nu am putut incarca datele contului.');
        }

        const result = (await response.json()) as ProfileResponse;
        setPersonalInfo(normalizeProfile(result));
        setCanEditEmail(Boolean(result.canEditEmail));
        setCanEditPassword(Boolean(result.canEditPassword));
      } catch (error) {
        setLoadError(
          error instanceof Error ? error.message : 'Nu am putut incarca datele contului.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const savePersonalInfo = async (
    values: Pick<
      PersonalInfo,
      'fullName' | 'phone' | 'preferences' | 'birthDate' | 'companyName' | 'cui' | 'tradeRegisterNumber'
    >,
  ) => {
    const response = await fetch(`${backendUrl}/auth/profile`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        fullName: values.fullName,
        phone: values.phone === '--' ? '' : values.phone,
        preferences: values.preferences === '--' ? '' : values.preferences,
        birthDate: values.birthDate === '--' ? null : values.birthDate,
        companyName: values.companyName === '--' ? '' : values.companyName,
        cui: values.cui === '--' ? '' : values.cui,
        tradeRegisterNumber:
          values.tradeRegisterNumber === '--' ? '' : values.tradeRegisterNumber,
      }),
    });

    const result = (await response.json().catch(() => null)) as ProfileResponse | { message?: unknown } | null;
    if (!response.ok) {
      throw new Error(readErrorMessage(result, 'Nu am putut salva modificarile.'));
    }

    setPersonalInfo((current) => ({
      ...current,
      ...normalizeProfile(result as ProfileResponse),
      password: current.password,
    }));
  };

  const saveEmail = async (email: string) => {
    const response = await fetch(`${backendUrl}/auth/profile/email`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });

    const result = (await response.json().catch(() => null)) as ProfileResponse | { message?: unknown } | null;
    if (!response.ok) {
      throw new Error(readErrorMessage(result, 'Nu am putut actualiza emailul.'));
    }

    setPersonalInfo((current) => ({
      ...current,
      ...normalizeProfile(result as ProfileResponse),
      password: current.password,
    }));
  };

  const savePassword = async (values: {
    currentPassword: string;
    nextPassword: string;
    confirmPassword: string;
  }) => {
    const response = await fetch(`${backendUrl}/auth/profile/password`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(values),
    });

    const result = (await response.json().catch(() => null)) as { message?: unknown } | null;
    if (!response.ok) {
      throw new Error(readErrorMessage(result, 'Nu am putut actualiza parola.'));
    }

    setPersonalInfo((current) => ({ ...current, password: '**************' }));
  };

  return (
    <>
      <main className="px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-[18rem_1fr]">
          <AccountSidebar activePath="/cont/date-personale" />

          <section className="space-y-2">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
              Date personale
            </h1>
            <p className="max-w-3xl text-base text-slate-600 sm:text-lg">
              Vizualizeaza si actualizeaza datele tale aici. Administreaza optiunile
              de conectare si parolele aici.
            </p>

            <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white px-6 shadow-sm sm:px-8">
              {isLoading ? (
                <div className="py-12 text-base text-slate-600">Se incarca datele contului...</div>
              ) : loadError ? (
                <div className="py-12 text-base font-semibold text-red-600">{loadError}</div>
              ) : (
                <>
                  <InfoRow icon={<ProfileIcon />}>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <DetailItem label="Nume" value={personalInfo.fullName} />
                      <DetailItem
                        label="Nr. telefon mobil"
                        value={personalInfo.phone}
                        extra={
                          <span className="ml-1 inline-flex align-middle text-slate-400" aria-hidden="true">
                            <svg viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current stroke-2">
                              <circle cx="10" cy="10" r="7.5" />
                              <path d="M10 8v5M10 5.5h.01" />
                            </svg>
                          </span>
                        }
                      />
                      <DetailItem label="Preferinte" value={personalInfo.preferences} />
                      <DetailItem label="Data nasterii" value={personalInfo.birthDate} />
                      {personalInfo.preferences === 'Persoana juridica' ? (
                        <>
                          <DetailItem label="Nume firma" value={personalInfo.companyName} />
                          <DetailItem label="CUI" value={personalInfo.cui} />
                          <DetailItem
                            label="Registru comert"
                            value={personalInfo.tradeRegisterNumber}
                          />
                        </>
                      ) : null}
                    </div>
                    <div className="lg:justify-self-end">
                      <EditButton onClick={() => setIsPersonalInfoModalOpen(true)} />
                    </div>
                  </InfoRow>

                  <InfoRow icon={<MailIcon />}>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">E-mailul tau</p>
                      <p className="break-all text-lg text-slate-900">{personalInfo.email}</p>
                    </div>
                    <div className="lg:justify-self-end">
                      <EditButton
                        disabled={!canEditEmail}
                        onClick={() => setIsEmailModalOpen(true)}
                      />
                    </div>
                  </InfoRow>

                  <InfoRow icon={<LockIcon />}>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-slate-900">Parola ta</p>
                      <p className="text-lg tracking-[0.18em] text-slate-900">{personalInfo.password}</p>
                    </div>
                    <div className="lg:justify-self-end">
                      <EditButton
                        disabled={!canEditPassword}
                        onClick={() => setIsPasswordModalOpen(true)}
                      />
                    </div>
                  </InfoRow>
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      <EditPersonalInfoModal
        open={isPersonalInfoModalOpen}
        initialValues={personalInfo}
        onClose={() => setIsPersonalInfoModalOpen(false)}
        onSave={savePersonalInfo}
      />
      <EditEmailModal
        open={isEmailModalOpen}
        initialEmail={personalInfo.email}
        onClose={() => setIsEmailModalOpen(false)}
        onSave={saveEmail}
      />
      <EditPasswordModal
        open={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSave={savePassword}
      />
    </>
  );
}
