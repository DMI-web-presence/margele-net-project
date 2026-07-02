import Image from 'next/image';
import Link from 'next/link';

const campaigns = [
  {
    id: 'easter',
    eyebrow: 'Campanie sezoniera',
    title: 'Paste handmade',
    description: 'Margele pastel, charm-uri delicate si decoratiuni pentru cadouri de primavara.',
    href: '/catalog?campaign=easter',
    imageUrl: '/landing-page-image.webp',
    accentClass: 'bg-[#f6e8f3] text-[#7b4a75]',
  },
  {
    id: 'sale',
    eyebrow: 'Oferta limitata',
    title: 'Reduceri de weekend',
    description: 'Selectii demo pentru campanii de pret: seturi, mixuri si accesorii esentiale.',
    href: '/catalog?campaign=sale',
    imageUrl: '/landing-page-image.webp',
    accentClass: 'bg-[#e7f0ff] text-[#23527c]',
  },
  {
    id: 'christmas',
    eyebrow: 'Colectie festiva',
    title: 'Craciun creativ',
    description: 'Rosu, auriu si accente stralucitoare pentru ornamente, bratari si ambalaje.',
    href: '/catalog?campaign=christmas',
    imageUrl: '/landing-page-image.webp',
    accentClass: 'bg-[#e9f7ef] text-[#27724a]',
  },
  {
    id: 'martisor',
    eyebrow: 'Idei de cadou',
    title: 'Martisoare si mici atentii',
    description: 'Materiale potrivite pentru martisoare, comenzi mici si proiecte rapide.',
    href: '/catalog?campaign=martisor',
    imageUrl: '/landing-page-image.webp',
    accentClass: 'bg-[#fff1d8] text-[#8a5a1f]',
  },
] as const;

export default function CampaignSection() {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-12 sm:px-10 lg:px-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7b4a75]">
              Campanii
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Colectii pentru fiecare sezon
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Zone pregatite pentru Paste, reduceri, Craciun si alte campanii active in magazin.
            </p>
          </div>
          <Link
            href="/catalog"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Vezi campaniile
          </Link>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={campaign.href}
              className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-md"
            >
              <div className="relative aspect-[4/3] bg-slate-100">
                <Image
                  src={campaign.imageUrl}
                  alt={campaign.title}
                  fill
                  sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                  unoptimized
                />
                <span
                  className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${campaign.accentClass}`}
                >
                  {campaign.eyebrow}
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold tracking-tight text-slate-950">
                  {campaign.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{campaign.description}</p>
                <span className="mt-5 inline-flex text-sm font-semibold text-[#7b4a75]">
                  Descopera selectia
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
