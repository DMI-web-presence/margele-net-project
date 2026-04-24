'use client';

import Link from 'next/link';

const accountSections = [
  {
    label: 'Contul tau',
    items: [
      { label: 'Adresele mele', href: '/cont/adrese' },
      { label: 'Comenzi', href: '/cont/comenzi' },
      { label: 'Date personale', href: '/cont/date-personale' },
    ],
  },
  { label: 'Ajutor & FAQ', href: '#' },
] as const;

type AccountSidebarProps = {
  activePath?: string;
};

export default function AccountSidebar({ activePath }: AccountSidebarProps) {
  return (
    <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
      <div className="space-y-3">
        {accountSections.map((section) => {
          if ('items' in section) {
            return (
              <div key={section.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{section.label}</p>
                <div className="mt-3 space-y-1">
                  {section.items.map((item) => {
                    const isActive = item.href === activePath;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`block rounded-xl px-3 py-2 text-sm transition ${
                          isActive
                            ? 'bg-white font-semibold text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:bg-white hover:text-slate-900'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }

          const isActive = section.href === activePath;

          return (
            <Link
              key={section.label}
              href={section.href}
              className={`block rounded-2xl px-3 py-3 text-sm transition ${
                isActive
                  ? 'bg-slate-100 font-semibold text-slate-900'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {section.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
