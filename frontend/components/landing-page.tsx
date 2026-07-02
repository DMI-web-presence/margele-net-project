import Image from 'next/image';
import Link from 'next/link';
import BenefitsStrip from '@/components/benefits-strip';
import CampaignSection from '@/components/campaign-section';
import CategoryHighlights from '@/components/category-highlights';
import FeaturedProductsSection from '@/components/featured-products-section';
import NewArrivalsSection from '@/components/new-arrivals-section';
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

export default function LandingPage({ products }: LandingPageProps) {
  const newestProducts = [...products].sort((a, b) => b.id - a.id);
  const promotionProducts = products;
  const recommendedProducts = [...products].sort((a, b) => a.id - b.id);
  const bestSellingProducts = [...products].sort((a, b) => Number(b.price) - Number(a.price));
  const featuredProducts = [...products].sort((a, b) => Number(b.price) - Number(a.price));

  return (
    <>
      <section className="relative min-h-[72svh] overflow-hidden">
        <Image
          src="/landing-page-image.webp"
          alt="Margele si accesorii pentru proiecte handmade"
          fill
          priority
          className="animate-hero-image object-cover"
          unoptimized
        />
        <div
          className="animate-hero-item absolute inset-0 bg-gradient-to-r from-white/95 via-white/70 to-white/10"
          style={{ animationDelay: '180ms' }}
        />
        <div className="relative mx-auto flex min-h-[72svh] w-full max-w-[1400px] items-center px-6 py-16 sm:px-10 lg:px-16">
          <div className="max-w-xl">
            <p
              className="animate-hero-item text-sm font-semibold uppercase tracking-[0.34em] text-[#7b4a75]"
              style={{ animationDelay: '260ms' }}
            >
              Margele.net
            </p>
            <h1
              className="animate-hero-item mt-5 text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl"
              style={{ animationDelay: '420ms' }}
            >
              Materiale pentru creatii handmade
            </h1>
            <p
              className="animate-hero-item mt-5 max-w-lg text-base leading-7 text-slate-700 sm:text-lg"
              style={{ animationDelay: '580ms' }}
            >
              Alege margele, accesorii si decoratiuni atent selectate pentru proiecte mici, cadouri si comenzi en-gross.
            </p>
            <div
              className="animate-hero-item mt-8 flex flex-wrap gap-3"
              style={{ animationDelay: '740ms' }}
            >
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

      <BenefitsStrip />
      <CategoryHighlights />
      <CampaignSection />
      <FeaturedProductsSection products={featuredProducts} />
      <NewArrivalsSection />

      <section className="mx-auto flex w-full max-w-[1400px] flex-col gap-12 px-6 py-12 sm:px-10 lg:px-16">
        <FeaturedProductsOrbit title="Promotie de Paste" products={promotionProducts} />
        <LandingProductCarousel title="Ultimele produse adaugate" products={newestProducts} />
        <LandingProductCarousel title="Recomandari" products={recommendedProducts} />
        <LandingProductCarousel title="Cele mai bine vandute" products={bestSellingProducts} />
      </section>
    </>
  );
}
