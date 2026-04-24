'use client';

import { useEffect, useState } from 'react';
import AccountSidebar from '@/components/account-sidebar';
import AddAddressModal, { AddressFormValues } from '@/components/add-address-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:3001';

type UserAddress = AddressFormValues & {
  id: number;
};

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
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadAddresses = async () => {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const response = await fetch(`${backendUrl}/auth/addresses`, {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Nu am putut incarca adresele.');
        }

        const result = (await response.json()) as UserAddress[];
        setAddresses(result);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Nu am putut incarca adresele.',
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadAddresses();
  }, []);

  const openCreateModal = () => {
    setEditingAddressId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (addressId: number) => {
    setEditingAddressId(addressId);
    setIsModalOpen(true);
  };

  const handleSaveAddress = async (values: AddressFormValues) => {
    const response = await fetch(
      editingAddressId === null
        ? `${backendUrl}/auth/addresses`
        : `${backendUrl}/auth/addresses/${editingAddressId}`,
      {
        method: editingAddressId === null ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      },
    );

    if (!response.ok) {
      throw new Error('Nu am putut salva adresa.');
    }

    const savedAddress = (await response.json()) as UserAddress;

    if (editingAddressId === null) {
      setAddresses((current) => [savedAddress, ...current]);
      return;
    }

    setAddresses((current) =>
      current.map((item) => (item.id === editingAddressId ? savedAddress : item)),
    );
  };

  const handleDeleteAddress = async (addressId: number) => {
    const response = await fetch(`${backendUrl}/auth/addresses/${addressId}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    if (!response.ok) {
      setErrorMessage('Nu am putut sterge adresa.');
      return;
    }

    setAddresses((current) => current.filter((item) => item.id !== addressId));
  };

  return (
    <>
      <main className="px-6 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-[18rem_1fr]">
          <AccountSidebar activePath="/cont/adrese" />

          <div className="space-y-2">
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
                Adrese
              </h1>
              <p className="mt-2 max-w-3xl text-base text-slate-600 sm:text-lg">
                Adauga sau gestioneaza adresele tale aici.
              </p>
            </div>

            <div className="mt-8 rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8 sm:py-8">
              {isLoading ? (
                <div className="py-12 text-base text-slate-600">Se incarca adresele...</div>
              ) : errorMessage ? (
                <div className="py-12 text-base font-semibold text-red-600">{errorMessage}</div>
              ) : addresses.length === 0 ? (
                <Card className="min-h-[460px] rounded-[1.75rem] border-slate-200 bg-slate-50 p-8 shadow-none sm:p-10">
                  <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white">
                      <AddressIcon />
                    </div>
                    <p className="max-w-2xl text-base leading-7 text-slate-700">
                      Nu ai nicio adresa salvata momentan. Adauga o adresa acum ca sa
                      finalizezi comanda mai rapid.
                    </p>
                    <Button
                      onClick={openCreateModal}
                      variant="secondary"
                      className="min-h-12 min-w-[220px] cursor-pointer rounded-2xl border border-slate-900 bg-white px-6 py-3 text-base font-semibold text-slate-900 hover:bg-slate-50"
                    >
                      Adauga adresa
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  <Card
                    className="min-h-[420px] cursor-pointer rounded-[1.75rem] border-slate-200 bg-slate-50 p-8 transition hover:bg-slate-100"
                    onClick={openCreateModal}
                  >
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                      <span className="text-4xl font-light text-slate-700">+</span>
                      <p className="text-2xl font-semibold tracking-tight text-slate-900">
                        Adauga adresa
                      </p>
                    </div>
                  </Card>

                  {addresses.map((address) => (
                    <Card
                      key={address.id}
                      className="min-h-[420px] rounded-[1.75rem] border-slate-200 bg-white p-8 shadow-sm"
                    >
                      <div className="space-y-6">
                        <p className="text-sm font-semibold text-slate-900">
                          Adresa salvata
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
                            onClick={() => void handleDeleteAddress(address.id)}
                            className="inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-2xl border border-slate-300 text-slate-700 transition hover:bg-slate-100"
                            aria-label="Sterge adresa"
                          >
                            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2">
                              <path d="M4 7h16M9 7V5h6v2M8 7l1 12h6l1-12M10 11v6M14 11v6" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(address.id)}
                            className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
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
          </div>
        </div>
      </main>
      <AddAddressModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAddress}
        initialValues={editingAddressId !== null ? addresses.find((item) => item.id === editingAddressId) ?? null : null}
      />
    </>
  );
}
