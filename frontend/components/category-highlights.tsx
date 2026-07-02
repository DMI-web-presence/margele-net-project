import Link from 'next/link';

const categoryHighlights = [
  {
    title: 'Margele',
    description: 'Sticla, acril, perle si mixuri pentru bratari, coliere si decoratiuni.',
    href: '/catalog',
    accent: 'bg-[#f6e8f3] text-[#7b4a75]',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-current stroke-[1.7]">
        <circle cx="7" cy="12" r="3" />
        <circle cx="17" cy="8" r="3" />
        <circle cx="16" cy="17" r="2.5" />
        <path d="M10 11 14 9M9.5 14 13.8 16" />
      </svg>
    ),
  },
  {
    title: 'Pandantive',
    description: 'Accente metalice si forme decorative pentru bijuterii personalizate.',
    href: '/catalog?category=2',
    accent: 'bg-[#eef2ff] text-indigo-700',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-current stroke-[1.7]">
        <path d="M12 4 7 10l5 10 5-10-5-6Z" />
        <path d="M7 10h10M10 10l2 10 2-10" />
      </svg>
    ),
  },
  {
    title: 'Evenimente',
    description: 'Materiale potrivite pentru marturii, cadouri si proiecte tematice.',
    href: '/catalog?category=event',
    accent: 'bg-[#fff1f2] text-rose-700',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-current stroke-[1.7]">
        <path d="M4 10h16v10H4V10Z" />
        <path d="M12 10v10M4 14h16" />
        <path d="M8.5 10C6 8.7 6.2 5.5 8.6 5.2c1.6-.2 2.7 1.5 3.4 4.8" />
        <path d="M15.5 10c2.5-1.3 2.3-4.5-.1-4.8-1.6-.2-2.7 1.5-3.4 4.8" />
      </svg>
    ),
  },
  {
    title: 'Craciun',
    description: 'Accesorii, culori festive si decoratiuni pentru creatii de sezon.',
    href: '/catalog?category=1',
    accent: 'bg-[#ecfdf5] text-emerald-700',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-current stroke-[1.7]">
        <path d="M12 3 7 9h3l-4 5h4l-3 5h10l-3-5h4l-4-5h3l-5-6Z" />
        <path d="M12 19v2" />
      </svg>
    ),
  },
] as const;

export default function CategoryHighlights() {
  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-12 sm:px-10 lg:px-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7b4a75]">
              Categorii populare
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Incepe cu materialele potrivite
            </h2>
          </div>
          <Link
            href="/catalog"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Vezi toate categoriile
          </Link>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {categoryHighlights.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              className="group min-h-[220px] rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-1 hover:bg-white hover:shadow-md"
            >
              <span
                className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${category.accent}`}
              >
                {category.icon}
              </span>
              <h3 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
                {category.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{category.description}</p>
              <span className="mt-5 inline-flex text-sm font-semibold text-[#7b4a75] transition group-hover:translate-x-1">
                Exploreaza categoria
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
