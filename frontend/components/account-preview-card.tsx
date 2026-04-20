'use client';

import Link from 'next/link';

const accountLinks = [
  { href: '/autentificare', label: 'Contul meu' },
  { href: '/autentificare', label: 'Comenzi' },
  { href: '/autentificare', label: 'Retur produs' },
  { href: '/autentificare', label: 'Ajutor & FAQ' },
];

export default function AccountPreviewCard() {
  return (
    <div className="w-[320px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <Link
        href="/autentificare"
        className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
      >
        Autentificare
      </Link>

      <div className="mt-3 border-b border-slate-200 pb-3 text-sm text-slate-900">
        <span className="font-semibold">Inregistrare</span>
        <span className="mx-2 text-slate-400">-</span>
        <span>rapid</span>
      </div>

      <div className="mt-2">
        {accountLinks.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="block rounded-lg px-2 py-2 text-sm text-slate-900 transition hover:bg-slate-100"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
