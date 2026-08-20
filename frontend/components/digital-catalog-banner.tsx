import Image from 'next/image';
import Link from 'next/link';

const catalogCoverEmbedUrl =
  'https://www.canva.com/design/DAHNGkJLd_c/29ovifBpLPJ6NKYuMDWApg/view?embed#1';

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current stroke-[1.8] transition-transform duration-200 group-hover:translate-x-1"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function CatalogCover() {
  return (
    <div className="relative h-[84%] w-[18rem] -rotate-[3deg] overflow-hidden rounded-[0.2rem] bg-[#fbf8f6] shadow-[0_22px_35px_rgba(15,23,42,0.28)] xl:w-[20rem]">
      <iframe
        src={catalogCoverEmbedUrl}
        title="Prima pagină a catalogului mărgele 2026"
        loading="lazy"
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full scale-[1.015] border-0 bg-[#fbf8f6]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-3 bg-gradient-to-r from-slate-400/45 via-white/15 to-transparent"
      />
    </div>
  );
}

export default function DigitalCatalogBanner() {
  return (
    <section className="mb-14 bg-white px-4 sm:px-6">
      <div className="relative mx-auto min-h-[30rem] max-w-[1370px] overflow-hidden rounded-[1.45rem] bg-[#f3eef1] shadow-[0_14px_40px_rgba(15,23,42,0.10)] lg:min-h-[29rem]">
        <div className="absolute inset-0 lg:left-[39%]">
          <Image
            src="/hero-craft-workspace-products.avif"
            alt="Mărgele, accesorii și materiale creative din catalogul 2026"
            fill
            sizes="(min-width: 1024px) 61vw, 100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent lg:hidden" />
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 hidden w-[47%] bg-[radial-gradient(circle_at_18%_0%,#71315f_0%,#4f2048_44%,#35102f_100%)] lg:block"
          style={{ clipPath: 'polygon(0 0, 100% 0, 73% 100%, 0 100%)' }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(52,16,47,0.98)_0%,rgba(79,32,72,0.94)_48%,rgba(79,32,72,0.50)_76%,rgba(79,32,72,0.18)_100%)] lg:hidden" />

        <div className="absolute inset-y-0 left-[43%] z-10 hidden items-center lg:flex">
          <CatalogCover />
        </div>

        <div className="relative z-20 flex min-h-[30rem] max-w-[38rem] flex-col justify-center px-7 py-12 text-white sm:px-12 lg:min-h-[29rem] lg:max-w-[34rem] lg:px-14 xl:max-w-[39rem]">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/85">
            Nou&nbsp;&nbsp;•&nbsp;&nbsp;Catalog 2026
          </p>
          <h2 className="mt-7 max-w-[31rem] font-serif text-[2.4rem] font-semibold leading-[1.08] tracking-[-0.02em] sm:text-[3.15rem] lg:text-[3.35rem]">
            Ideile tale merită materialele potrivite
          </h2>
          <span aria-hidden="true" className="mt-7 h-0.5 w-11 bg-white" />
          <p className="mt-6 max-w-[27rem] text-[0.98rem] font-medium leading-7 text-white/90">
            Descoperă noul catalog mărgele 2026 cu inspirație, materiale și noutăți alese
            pentru creațiile tale. Peste 500 de produse, proiecte și idei care te pun în centru.
          </p>
          <Link
            href="/catalog-digital"
            className="group mt-8 inline-flex h-14 w-fit items-center justify-center gap-7 rounded-lg bg-white px-7 text-sm font-bold text-[#4f2048] shadow-[0_10px_24px_rgba(15,23,42,0.18)] transition hover:-translate-y-0.5 hover:bg-[#fbf4f9] hover:shadow-[0_14px_30px_rgba(15,23,42,0.24)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            Vezi catalogul
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}
