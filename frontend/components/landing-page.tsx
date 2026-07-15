import Image from 'next/image';
import Link from 'next/link';
import CampaignSection from '@/components/campaign-section';
import LandingProductCarousel from '@/components/landing-product-carousel';
import ProductRangeSection from '@/components/product-range-section';
import ValuesSection from '@/components/values-section';

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
    description: 'Mii de produse pentru bijuterii si decoratiuni.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7">
        <path d="M12 3 3.8 9.2 12 21l8.2-11.8L12 3Z" className="fill-none stroke-current stroke-[1.8]" />
        <path d="M3.8 9.2h16.4M8.5 9.2 12 21l3.5-11.8M8.5 9.2 12 3l3.5 6.2" className="fill-none stroke-current stroke-[1.8]" />
      </svg>
    ),
  },
  {
    title: 'Calitate garantata',
    description: 'Produse atent selectate de la branduri de incredere.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7">
        <circle cx="12" cy="8.5" r="4.5" className="fill-none stroke-current stroke-[1.8]" />
        <path d="m8.7 13.1-1.1 7 4.4-2.6 4.4 2.6-1.1-7" className="fill-none stroke-current stroke-[1.8]" />
        <path d="m10.2 8.5 1.2 1.2 2.4-2.6" className="fill-none stroke-current stroke-[1.8]" />
      </svg>
    ),
  },
  {
    title: 'Suport dedicat',
    description: 'Iti oferim ajutor si consultanta pentru proiectele tale.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7">
        <path d="M5 13v-2a7 7 0 0 1 14 0v2" className="fill-none stroke-current stroke-[1.8]" />
        <path d="M5 13h2.2v4H5a2 2 0 0 1-2-2 2 2 0 0 1 2-2ZM19 13h-2.2v4H19a2 2 0 0 0 2-2 2 2 0 0 0-2-2Z" className="fill-none stroke-current stroke-[1.8]" />
        <path d="M16.8 17.2c-.7 2-2.4 3-4.8 3" className="fill-none stroke-current stroke-[1.8]" />
      </svg>
    ),
  },
  {
    title: 'Livrare rapida',
    description: 'Comenzi livrate rapid in toata Romania.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7">
        <path d="M3 6h11v9H3V6ZM14 9h3.8l3.2 3.2V15h-7V9Z" className="fill-none stroke-current stroke-[1.8]" />
        <circle cx="7" cy="17" r="1.8" className="fill-none stroke-current stroke-[1.8]" />
        <circle cx="18" cy="17" r="1.8" className="fill-none stroke-current stroke-[1.8]" />
      </svg>
    ),
  },
];

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
                src="/hero-craft-workspace-products.png"
                alt="Materiale creative, margele si accesorii pentru proiecte handmade"
                fill
                priority
                className="object-cover object-center"
                sizes="51vw"
                unoptimized
              />
            </div>

            <div className="grid min-h-[430px] lg:grid-cols-[49%_51%]">
              <div className="flex flex-col justify-between p-7 sm:p-10 lg:p-11">
                <div className="max-w-[470px]">
                  <p className="text-xs font-bold uppercase tracking-[0.34em] text-slate-700">
                    Despre noi
                  </p>
                  <h1 className="mt-7 text-[2.35rem] font-bold leading-[1.08] text-slate-950 sm:text-[3.1rem] lg:text-[3.45rem]">
                    Materiale pentru idei care prind forma.
                  </h1>
                  <p className="mt-5 max-w-[430px] text-[0.95rem] font-medium leading-7 text-slate-700">
                    Aici gasesti o gama variata de margele, accesorii, materiale creative si
                    produse pentru proiecte handmade.
                  </p>
                  <p className="mt-2 max-w-[430px] text-[0.95rem] font-medium leading-7 text-slate-700">
                    Suntem aici sa inspiram creativitatea si sa fim alaturi de tine in fiecare
                    proiect.
                  </p>

                  <Link
                    href="/catalog"
                    className="group mt-6 inline-flex h-12 items-center gap-3 rounded-full bg-[#6437f3] px-6 text-sm font-bold text-white shadow-[0_12px_25px_rgba(100,55,243,0.25)] transition hover:bg-[#542ce1]"
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

                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {heroBenefits.map((benefit) => (
                    <div key={benefit.title} className="min-w-0">
                      <div className="text-[#6437f3]">{benefit.icon}</div>
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

              <div className="relative min-h-[320px] overflow-hidden lg:hidden">
                <Image
                  src="/hero-craft-workspace-products.png"
                  alt="Materiale creative, margele si accesorii pentru proiecte handmade"
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="100vw"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProductRangeSection />
      <ValuesSection />
      <LandingProductCarousel
        title="Recomandari pentru creatii handmade"
        eyebrow="Produse recomandate"
        description="O selectie curata de materiale si accesorii potrivite pentru proiecte rapide, cadouri si piese lucrate manual."
        products={recommendedProducts}
        variant="recommended"
        ctaLabel="Vezi toate produsele"
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
      />
      <LandingProductCarousel
        title="Cele mai bine vandute"
        eyebrow="Top clienti"
        description="Produse cautate frecvent, bune pentru stocul de baza si pentru proiecte unde vrei alegeri deja validate."
        products={bestSellingProducts}
        variant="popular"
        ctaLabel="Vezi top produse"
        showRanking
      />
    </>
  );
}
