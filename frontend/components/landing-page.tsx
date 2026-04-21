import Image from 'next/image';
import Link from 'next/link';
import FeaturedProductsOrbit from '@/components/featured-products-orbit';
import LandingProductCarousel from '@/components/landing-product-carousel';

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

const benefits = [
  {
    title: 'Calitate',
    description: 'Pe Margele.net vei gasi doar produse de calitate.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-9 w-9 fill-none stroke-current stroke-[1.7]">
        <path d="M7 11.5 11 3a2.2 2.2 0 0 1 2.2 2.7l-.8 3.1h5.1a2 2 0 0 1 1.9 2.6l-1.9 6.2A3 3 0 0 1 14.7 20H7V11.5Z" />
        <path d="M3.5 11.5H7V20H3.5V11.5Z" />
      </svg>
    ),
  },
  {
    title: 'Suport',
    description: 'Va ajutam telefonic sau pe Facebook.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-9 w-9 fill-none stroke-current stroke-[1.7]">
        <path d="M8 5.5 6.4 3.9a1.8 1.8 0 0 0-2.8.4 5.4 5.4 0 0 0-.5 3.3c.8 5.4 5.9 10.5 11.3 11.3a5.4 5.4 0 0 0 3.3-.5 1.8 1.8 0 0 0 .4-2.8L16.5 14a1.9 1.9 0 0 0-2.2-.3l-1.4.8a10.4 10.4 0 0 1-3.4-3.4l.8-1.4A1.9 1.9 0 0 0 10 7.5Z" />
        <path d="M15.5 3.5a5 5 0 0 1 5 5" />
        <path d="M15.5 7a1.5 1.5 0 0 1 1.5 1.5" />
      </svg>
    ),
  },
  {
    title: 'Transport Gratuit*',
    description: '* Prin Posta, la comenzile peste 150 de lei. Prin curier, la comenzile peste 300 de lei.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-9 w-9 fill-none stroke-current stroke-[1.7]">
        <path d="M3 6h11v10H3V6Z" />
        <path d="M14 10h3.5l3 3v3H14v-6Z" />
        <path d="M6.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        <path d="M17.5 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      </svg>
    ),
  },
  {
    title: 'Retur 14 zile',
    description: 'Poti returna produsele comandate timp de 14 zile.',
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-9 w-9 fill-none stroke-current stroke-[1.7]">
        <path d="M4 9a8 8 0 1 1 2.4 5.7" />
        <path d="M4 4v5h5" />
      </svg>
    ),
  },
];

export default function LandingPage({ products }: LandingPageProps) {
  const newestProducts = [...products].sort((a, b) => b.id - a.id);
  const promotionProducts = products;
  const recommendedProducts = [...products].sort((a, b) => a.id - b.id);
  const bestSellingProducts = [...products].sort((a, b) => Number(b.price) - Number(a.price));

  return (
    <>
      <section className="relative min-h-[72svh] overflow-hidden">
        <Image
          src="/landing-page-image.webp"
          alt="Margele si accesorii pentru proiecte handmade"
          fill
          priority
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-white/10" />
        <div className="relative mx-auto flex min-h-[72svh] w-full max-w-[1400px] items-center px-6 py-16 sm:px-10 lg:px-16">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-[#7b4a75]">Margele.net</p>
            <h1 className="mt-5 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
              Materiale pentru creatii handmade
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-700 sm:text-lg">
              Alege margele, accesorii si decoratiuni atent selectate pentru proiecte mici, cadouri si comenzi en-gross.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/catalog"
                className="inline-flex items-center rounded-full bg-[#7b4a75] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#663b61]"
              >
                Vezi produsele
              </Link>
              <Link
                href="/catalog?category=event"
                className="inline-flex items-center rounded-full border border-slate-300 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white"
              >
                Articole evenimente
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f7f1f5]">
        <div className="mx-auto grid w-full max-w-[1400px] gap-6 px-6 py-7 sm:grid-cols-2 sm:px-10 lg:grid-cols-4 lg:px-16">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex flex-col items-center text-center text-[#70416b]">
              <div className="mb-2">{benefit.icon}</div>
              <h2 className="text-xl font-semibold tracking-wide text-slate-950">{benefit.title}</h2>
              <p className="mt-2 max-w-xs text-xs leading-5 text-slate-700">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-[1400px] flex-col gap-12 px-6 py-12 sm:px-10 lg:px-16">
        <FeaturedProductsOrbit title="Promotie de Paste" products={promotionProducts} />
        <LandingProductCarousel title="Ultimele produse adaugate" products={newestProducts} />
        <LandingProductCarousel title="Recomandari" products={recommendedProducts} />
        <LandingProductCarousel title="Cele mai bine vandute" products={bestSellingProducts} />
      </section>
    </>
  );
}
