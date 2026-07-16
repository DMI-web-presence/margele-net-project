import Image from 'next/image';
import Link from 'next/link';

const campaigns = [
  {
    id: 'easter',
    eyebrow: 'Campanie sezoniera',
    title: 'Paste handmade',
    description: 'Margele pastel, charm-uri delicate si decoratiuni pentru cadouri de primavara.',
    href: '/catalog?category=paste',
    imageUrl: '/campaign-easter.png',
    accentClass: 'bg-[#f6e8f3] text-[#7b4a75]',
    unavailable: true,
  },
  {
    id: 'sale',
    eyebrow: 'Oferta limitata',
    title: 'Reduceri de weekend',
    description: 'Selectii pentru campanii de pret: seturi, mixuri si accesorii esentiale.',
    href: null,
    imageUrl: '/campaign-sale.png',
    accentClass: 'bg-[#e7f0ff] text-[#23527c]',
    unavailable: true,
  },
  {
    id: 'christmas',
    eyebrow: 'Colectie festiva',
    title: 'Craciun creativ',
    description: 'Rosu, auriu si accente stralucitoare pentru ornamente, bratari si ambalaje.',
    href: '/catalog?category=craciun',
    imageUrl: '/campaign-christmas.png',
    accentClass: 'bg-[#e9f7ef] text-[#27724a]',
    unavailable: false,
  },
  {
    id: 'martisor',
    eyebrow: 'Idei de cadou',
    title: 'Martisoare si mici atentii',
    description: 'Materiale potrivite pentru martisoare, comenzi mici si proiecte rapide.',
    href: '/catalog?category=martisor-si-ziua-femeii',
    imageUrl: '/campaign-martisor.png',
    accentClass: 'bg-[#fff1d8] text-[#8a5a1f]',
    unavailable: false,
  },
] as const;

export default function CampaignSection() {
  return (
    <section className="bg-white sm:px-6 lg:mb-14">
      <div className="mx-auto max-w-[1370px] rounded-[1.45rem] border border-slate-200 bg-slate-50 p-5 shadow-[0_10px_35px_rgba(15,23,42,0.05)] sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#7b4a75]">
              Campanii
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Colectii pentru fiecare sezon
            </h2>
            <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-600">
              Zone pregatite pentru Paste, reduceri, Craciun si alte campanii active in magazin.
            </p>
          </div>
          <Link
            href="/catalog"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
          >
            Vezi campaniile
          </Link>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {campaigns.map((campaign) => {
            const isUnavailable = Boolean(campaign.unavailable);
            const cardContent = (
              <>
              <div className="relative h-[178px] overflow-hidden rounded-lg bg-slate-100">
                <Image
                  src={campaign.imageUrl}
                  alt={campaign.title}
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                  className={`object-cover object-center transition duration-500 ${
                    isUnavailable ? 'grayscale-[0.35] saturate-75' : 'group-hover:scale-[1.03]'
                  }`}
                  unoptimized
                />
                {isUnavailable ? (
                  <div className="absolute inset-0 bg-white/35" />
                ) : null}
                <span
                  className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] shadow-sm ${campaign.accentClass}`}
                >
                  {isUnavailable ? 'In curand' : campaign.eyebrow}
                </span>
              </div>
              <div className="px-1 pb-1 pt-4">
                <h3 className="text-xl font-bold tracking-tight text-slate-950">
                  {campaign.title}
                </h3>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-700">
                  {campaign.description}
                </p>
                <span
                  className={`mt-5 inline-flex items-center gap-2 text-sm font-bold transition ${
                    isUnavailable
                      ? 'text-slate-400'
                      : 'text-[#7b4a75] group-hover:translate-x-1'
                  }`}
                >
                  {isUnavailable ? 'Disponibil in curand' : 'Descopera selectia'}
                  {!isUnavailable ? (
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                      <path d="M5 12h14M13 6l6 6-6 6" className="fill-none stroke-current stroke-2" />
                    </svg>
                  ) : null}
                </span>
              </div>
              </>
            );

            if (isUnavailable) {
              return (
                <article
                  key={campaign.id}
                  aria-disabled="true"
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white p-3 opacity-90"
                >
                  {cardContent}
                </article>
              );
            }

            return (
              <Link
                key={campaign.id}
                href={campaign.href ?? '/catalog'}
                className="group overflow-hidden rounded-xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                {cardContent}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
