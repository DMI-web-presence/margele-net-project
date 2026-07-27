import Image from 'next/image';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import ProductRangeSection from '@/components/product-range-section';
import ValuesSection from '@/components/values-section';

const HomepageReviewStrip = dynamic(() => import('@/components/homepage-review-strip'));
const CampaignSection = dynamic(() => import('@/components/campaign-section'));
const LandingProductCarousel = dynamic(() => import('@/components/landing-product-carousel'));

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
};

type LandingPageProps = {
  products: Product[];
};

const heroBenefits = [
  {
    title: 'Selectie variata',
    description: 'Peste 750 de produse pentru bijuterii, accesorii si decoratiuni.',
    icon: 'gem',
  },
  {
    title: 'Calitate verificata',
    description: 'Materiale atent selectate, potrivite pentru proiecte handmade.',
    icon: 'badge',
  },
  {
    title: 'Suport dedicat',
    description: 'Te ajutam sa alegi produsele potrivite pentru ideile tale.',
    icon: 'headset',
  },
  {
    title: 'Livrare rapida',
    description: 'Comenzi pregatite rapid si livrate in toata Romania.',
    icon: 'truck',
  },
] as const;

function HeroBenefitIcon({ name }: { name: (typeof heroBenefits)[number]['icon'] }) {
  const iconClassName = 'h-8 w-8 fill-none stroke-current stroke-[1.65]';
  const sparkleClassName = 'fill-current stroke-none';

  return (
    <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#f3e9fb] text-[#6f2172]">
      {name === 'gem' ? (
        <svg aria-hidden="true" viewBox="0 0 32 32" className={iconClassName}>
          <path d="m16 6 8.5 6.4L16 27 7.5 12.4 16 6Z" />
          <path d="M7.5 12.4h17M11.5 12.4 16 27l4.5-14.6M11.5 12.4 16 6l4.5 6.4" />
          <path d="M3.8 11h2.4M5 9.8v2.4M25.8 7.8h2.4M27 6.6V9M24.7 23.2h2.2M25.8 22.1v2.2" />
          <circle cx="8.2" cy="6.7" r="0.8" className={sparkleClassName} />
          <circle cx="28" cy="16.7" r="0.8" className={sparkleClassName} />
        </svg>
      ) : null}
      {name === 'badge' ? (
        <svg aria-hidden="true" viewBox="0 0 32 32" className={iconClassName}>
          <path d="m16 4 2.2 2.2 3.1-.5 1.3 2.9 2.9 1.3-.5 3.1 2.2 2.2-2.2 2.2.5 3.1-2.9 1.3-1.3 2.9-3.1-.5L16 28l-2.2-2.2-3.1.5-1.3-2.9-2.9-1.3.5-3.1-2.2-2.2L7 14.6l-.5-3.1 2.9-1.3 1.3-2.9 3.1.5L16 4Z" />
          <path d="m12.2 16 2.4 2.4 5.2-5.4" />
        </svg>
      ) : null}
      {name === 'headset' ? (
        <svg aria-hidden="true" viewBox="0 0 32 32" className={iconClassName}>
          <path d="M7.5 17.5v-3.2a8.5 8.5 0 0 1 17 0v3.2" />
          <path d="M7.5 17.3h3.1v6H7.5a2.6 2.6 0 0 1-2.6-2.6v-.8a2.6 2.6 0 0 1 2.6-2.6ZM24.5 17.3h-3.1v6h3.1a2.6 2.6 0 0 0 2.6-2.6v-.8a2.6 2.6 0 0 0-2.6-2.6Z" />
          <path d="M21.4 23.3c-.8 2.2-2.7 3.3-5.4 3.3h-2" />
        </svg>
      ) : null}
      {name === 'truck' ? (
        <svg aria-hidden="true" viewBox="0 0 32 32" className={iconClassName}>
          <path d="M10 10h11v11H10V10ZM21 14h4.1l3.4 3.4V21H21v-7Z" />
          <path d="M3.5 13h4M2.5 16.5H8M4 20h4" />
          <circle cx="13" cy="23" r="2.2" />
          <circle cx="25" cy="23" r="2.2" />
        </svg>
      ) : null}
    </span>
  );
}

export default function LandingPage({ products }: LandingPageProps) {
  const newestProducts = [...products].sort((a, b) => b.id - a.id);
  const recommendedProducts = [...products].sort((a, b) => a.id - b.id);
  const bestSellingProducts = [...products].sort((a, b) => Number(b.price) - Number(a.price));

  return (
    <>
      <section className="bg-white mb-14 mt-6">
        <div className="mx-auto max-w-[1370px]">
          <div className="relative overflow-hidden rounded-[1.45rem] border border-slate-200 bg-white shadow-[0_14px_45px_rgba(15,23,42,0.08)]">
            <div
              className="absolute inset-y-0 right-0 hidden w-[51%] overflow-hidden rounded-r-[1.45rem] lg:block"
              style={{ clipPath: 'ellipse(84% 118% at 84% 50%)' }}
            >
              <Image
                src="/hero-craft-workspace-products.avif"
                alt="Materiale creative, margele si accesorii pentru proiecte handmade"
                fill
                priority
                className="object-cover object-center"
                sizes="51vw"
              />
            </div>

            <div className="grid min-h-[430px] lg:grid-cols-[49%_51%]">
              <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-11">
                <div className="max-w-[470px]">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-700">
                    Despre noi
                  </p>
                  <h1 className="mt-7 text-[2.35rem] font-bold leading-[1.08] text-slate-950 sm:text-[3.1rem] lg:text-[3.45rem]">
                    Materiale pentru idei care prind forma.
                  </h1>
                  <p className="mt-5 max-w-[430px] text-[0.95rem] font-medium leading-7 text-slate-700">
                    Descopera peste 750 de produse unice si mii de variante de culori, dimensiuni
                    si finisaje pentru proiectele tale creative.
                  </p>
                  <p className="mt-2 max-w-[430px] text-[0.95rem] font-medium leading-7 text-slate-700">
                    Suntem aici sa inspiram creativitatea si sa fim alaturi de tine in fiecare
                    proiect.
                  </p>

                  <Link
                    href="/catalog"
                    className="group mt-6 inline-flex h-12 items-center gap-3 rounded-full bg-[#4f2048] px-6 text-sm font-bold text-white shadow-[0_12px_25px_rgba(79,32,72,0.25)] transition hover:bg-[#401839]"
                  >
                    Descopera produsele
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-1"
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" className="fill-none stroke-current stroke-2" />
                    </svg>
                  </Link>
                </div>

                <div className="relative mt-8 min-h-[220px] overflow-hidden rounded-[1rem] border border-slate-100 shadow-[0_14px_32px_rgba(15,23,42,0.08)] sm:min-h-[300px] lg:hidden">
                  <Image
                    src="/hero-craft-workspace-products.avif"
                    alt="Materiale creative, margele si accesorii pentru proiecte handmade"
                    fill
                    priority
                    className="object-cover object-center"
                    sizes="100vw"
                  />
                </div>

                <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-7 lg:grid-cols-4">
                  {heroBenefits.map((benefit) => (
                    <div key={benefit.title} className="min-w-0">
                      <HeroBenefitIcon name={benefit.icon} />
                      <h2 className="mt-4 text-sm font-bold leading-5 text-slate-950">
                        {benefit.title}
                      </h2>
                      <p className="mt-1 text-xs font-medium leading-5 text-slate-600">
                        {benefit.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProductRangeSection />
      <ValuesSection />
      <HomepageReviewStrip />
      <LandingProductCarousel
        title="Recomandari pentru creatii handmade"
        eyebrow="Produse recomandate"
        description="O selectie curata de materiale si accesorii potrivite pentru proiecte rapide, cadouri si piese lucrate manual."
        products={recommendedProducts}
        variant="recommended"
        ctaLabel="Vezi toate produsele"
        autoPlay
      />
      <CampaignSection />
      <LandingProductCarousel
        title="Ultimele produse adaugate"
        eyebrow="Noutati"
        description="Produse proaspat intrate in catalog, utile cand vrei sa descoperi rapid ce a aparut nou in magazin."
        sectionId="noutati"
        products={newestProducts}
        variant="fresh"
        ctaLabel="Vezi noutatile"
        ctaHref="/noutati"
      />
      <LandingProductCarousel
        title="Cele mai bine vandute"
        eyebrow="Top clienti"
        description="Produse cautate frecvent, bune pentru stocul de baza si pentru proiecte unde vrei alegeri deja validate."
        products={bestSellingProducts}
        variant="popular"
        ctaLabel="Vezi top produse"
      />
    </>
  );
}
