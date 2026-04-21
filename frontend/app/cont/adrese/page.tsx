'use client';

import { useState } from 'react';
import AddAddressModal, { AddressFormValues } from '@/components/add-address-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

function AddressIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-12 w-12 fill-none stroke-current stroke-2 text-slate-700"
    >
      <path d="M3 10h10v7H3z" />
      <path d="M13 12h4l3 3v2h-7z" />
      <circle cx="8" cy="19" r="1.8" />
      <circle cx="17" cy="19" r="1.8" />
    </svg>
  );
}

export default function ContAdresePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [addresses, setAddresses] = useState<AddressFormValues[]>([]);

  const openCreateModal = () => {
    setEditingIndex(null);
    setIsModalOpen(true);
  };

  const openEditModal = (index: number) => {
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const handleSaveAddress = (values: AddressFormValues) => {
    if (editingIndex === null) {
      setAddresses((current) => [...current, values]);
      return;
    }
    setAddresses((current) =>
      current.map((item, index) => (index === editingIndex ? values : item)),
    );
  };

  const handleDeleteAddress = (index: number) => {
    setAddresses((current) => current.filter((_, i) => i !== index));
  };

  return (
    <>
      <main className="px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-[1000px] space-y-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Adrese</h1>
            <p className="mt-2 text-base text-slate-600">
              Adauga sau gestioneaza adresele tale aici.
            </p>
          </div>

          {addresses.length === 0 ? (
            <Card className="min-h-[460px] border-slate-200 bg-slate-50 p-8 sm:p-10">
              <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
                <AddressIcon />
                <p className="max-w-2xl text-base leading-7 text-slate-700">
                  Nu ai nicio adresa salvata momentan. Adauga o adresa acum ca sa
                  finalizezi comanda mai rapid.
                </p>
                <Button
                  onClick={openCreateModal}
                  className="rounded-xl bg-slate-900 px-8 py-3 text-base hover:bg-black"
                >
                  Adauga adresa
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <Card
                className="min-h-[420px] cursor-pointer border-slate-200 bg-slate-50 p-8 transition hover:bg-slate-100"
                onClick={openCreateModal}
              >
                <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                  <span className="text-4xl font-light text-slate-700">+</span>
                  <p className="text-2xl font-semibold tracking-tight text-slate-900">
                    Adauga adresa
                  </p>
                </div>
              </Card>

              {addresses.map((address, index) => (
                <Card
                  key={`${address.prenume}-${address.nume}-${index}`}
                  className="min-h-[420px] border-slate-200 bg-white p-8"
                >
                  <div className="space-y-6">
                    <p className="text-sm font-semibold text-slate-900">
                      {address.tipAdresa === 'acasa' ? 'Adresa de domiciliu' : 'Punct de livrare'}
                    </p>
                    <div>
                      <p className="text-4xl font-semibold tracking-tight text-slate-900">
                        {address.prenume} {address.nume}
                      </p>
                      <p className="mt-4 text-base leading-8 text-slate-900">
                        {address.adresa1}
                        {address.adresa2 ? <>, {address.adresa2}</> : null}
                        <br />
                        {address.codPostal}
                        <br />
                        {address.oras}
                        <br />
                        {address.tara}
                      </p>
                    </div>

                    <div className="space-y-2 text-sm text-slate-500">
                      {address.implicitFacturare ? <p>✓ Adresa de facturare prestabilita</p> : null}
                      {address.implicitLivrare ? <p>✓ Adresa de livrare prestabilita</p> : null}
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(index)}
                        className="inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-100"
                        aria-label="Sterge adresa"
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2">
                          <path d="M4 7h16M9 7V5h6v2M8 7l1 12h6l1-12M10 11v6M14 11v6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(index)}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2">
                          <path d="M4 20h4l10-10-4-4L4 16v4Z" />
                          <path d="m12 6 4 4" />
                        </svg>
                        Modifica
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <AddAddressModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAddress}
        initialValues={editingIndex !== null ? addresses[editingIndex] : null}
      />
    </>
  );
}
