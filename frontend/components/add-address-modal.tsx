'use client';

import { FormEvent } from 'react';

export type AddressFormValues = {
  apelativ: string;
  prenume: string;
  nume: string;
  tipAdresa: 'acasa' | 'punct';
  tara: string;
  adresa1: string;
  adresa2: string;
  codPostal: string;
  oras: string;
  implicitFacturare: boolean;
  implicitLivrare: boolean;
};

type AddAddressModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (values: AddressFormValues) => void;
  initialValues?: AddressFormValues | null;
};

export default function AddAddressModal({
  open,
  onClose,
  onSave,
  initialValues,
}: AddAddressModalProps) {
  if (!open) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const values: AddressFormValues = {
      apelativ: String(data.get('apelativ') ?? 'Dl.'),
      prenume: String(data.get('prenume') ?? ''),
      nume: String(data.get('nume') ?? ''),
      tipAdresa: data.get('tipAdresa') === 'punct' ? 'punct' : 'acasa',
      tara: String(data.get('tara') ?? 'Romania'),
      adresa1: String(data.get('adresa1') ?? ''),
      adresa2: String(data.get('adresa2') ?? ''),
      codPostal: String(data.get('codPostal') ?? ''),
      oras: String(data.get('oras') ?? ''),
      implicitFacturare: data.get('implicitFacturare') === 'on',
      implicitLivrare: data.get('implicitLivrare') === 'on',
    };
    onSave(values);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="Adauga adresa"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-8 py-5">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Adauga adresa</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Inchide"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900" htmlFor="apelativ">
                Apelativ
              </label>
              <select
                id="apelativ"
                name="apelativ"
                defaultValue={initialValues?.apelativ ?? 'Dl.'}
                className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
              >
                <option>Dl.</option>
                <option>Dna.</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900" htmlFor="prenume-adresa">
                Prenume
              </label>
              <input
                id="prenume-adresa"
                name="prenume"
                required
                defaultValue={initialValues?.prenume ?? ''}
                className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900" htmlFor="nume-adresa">
                Nume
              </label>
              <input
                id="nume-adresa"
                name="nume"
                required
                defaultValue={initialValues?.nume ?? ''}
                className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-200 pt-5">
            <p className="text-sm font-semibold text-slate-900">Tip adresa</p>
            <div className="flex flex-wrap items-center gap-5 text-base text-slate-900">
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="tipAdresa"
                  value="acasa"
                  defaultChecked={(initialValues?.tipAdresa ?? 'acasa') === 'acasa'}
                />
                <span>Adresa de acasa</span>
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="tipAdresa"
                  value="punct"
                  defaultChecked={initialValues?.tipAdresa === 'punct'}
                />
                <span>Punct de livrare</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900" htmlFor="tara">
              Tara
            </label>
            <input
              id="tara"
              name="tara"
              defaultValue={initialValues?.tara ?? 'Romania'}
              className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900" htmlFor="adresa1">
                Adresa linia 1
              </label>
              <input
                id="adresa1"
                name="adresa1"
                required
                defaultValue={initialValues?.adresa1 ?? ''}
                className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900" htmlFor="adresa2">
                Adresa linia 2 (optional)
              </label>
              <input
                id="adresa2"
                name="adresa2"
                defaultValue={initialValues?.adresa2 ?? ''}
                className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900" htmlFor="cod-postal">
                Cod postal
              </label>
              <input
                id="cod-postal"
                name="codPostal"
                required
                defaultValue={initialValues?.codPostal ?? ''}
                className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-900" htmlFor="oras">
                Oras
              </label>
              <input
                id="oras"
                name="oras"
                required
                defaultValue={initialValues?.oras ?? ''}
                className="w-full rounded-2xl border border-slate-300 bg-slate-100 px-4 py-3 text-base text-slate-900 outline-none transition focus:border-slate-500 focus:bg-white"
              />
            </div>
          </div>

          <div className="space-y-3 text-sm text-slate-900">
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                name="implicitFacturare"
                defaultChecked={initialValues?.implicitFacturare ?? false}
              />
              <span>Adresa implicita pentru facturare</span>
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                name="implicitLivrare"
                defaultChecked={initialValues?.implicitLivrare ?? false}
              />
              <span>Adresa implicita pentru livrare</span>
            </label>
          </div>

          <button
            type="submit"
            className="inline-flex w-full cursor-pointer items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-base font-semibold text-white transition hover:bg-black"
          >
            Salveaza
          </button>
        </form>
      </div>
    </div>
  );
}
