import type { CatalogPageProduct, CatalogProductGroup } from '@/components/catalog-page-product-groups';
import DigitalCatalogExperience from '@/components/digital-catalog-experience';
import { buildPageMetadata } from '@/lib/seo';

const canvaCatalogUrl =
  'https://www.canva.com/design/DAHNGkJLd_c/29ovifBpLPJ6NKYuMDWApg/view?utm_content=DAHNGkJLd_c&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h11e45fc6d4';
const canvaEmbedUrl =
  'https://www.canva.com/design/DAHNGkJLd_c/29ovifBpLPJ6NKYuMDWApg/view?embed';
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://127.0.0.1:3001';
const catalogPageCount = 28;
const productsPerCatalogPage = 3;

const catalogProductIdsByPage: Record<number, number[]> = {
  3: [147, 17, 1],
  4: [148, 15, 13],
  5: [24, 27, 29],
  6: [28, 25, 22],
  7: [36, 33, 23],
  8: [817, 816, 813],
  9: [799],
  10: [800],
  11: [32, 117, 105],
  12: [753, 750, 752],
  13: [790, 768, 756],
  14: [709, 642, 744],
  15: [5, 7, 8],
  16: [5, 711, 61],
  17: [775, 667, 666],
  18: [649, 606, 46],
  19: [649, 606, 46],
  20: [806, 805, 807],
  21: [805, 806, 807],
  22: [807, 805, 806],
  23: [76, 16, 126],
  24: [60, 59, 712],
  25: [60, 59, 712],
  26: [648, 639, 38],
};

export const dynamic = 'force-dynamic';

export const metadata = buildPageMetadata({
  title: 'Catalog digital',
  description:
    'Răsfoiește catalogul digital Margele.net și descoperă materiale, mărgele și accesorii pentru proiectele tale creative.',
  path: '/catalog-digital',
});

async function getProducts(): Promise<CatalogPageProduct[]> {
  try {
    const response = await fetch(`${backendUrl}/products?view=lite`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) {
      return [];
    }

    const text = await response.text();
    if (!text.trim()) {
      return [];
    }

    return JSON.parse(text) as CatalogPageProduct[];
  } catch (error) {
    console.error('Failed to fetch digital catalog products:', error);
    return [];
  }
}

function buildCatalogProductGroups(products: CatalogPageProduct[]): CatalogProductGroup[] {
  const displayableProducts = products.filter((product) => product.imageUrl);
  const productById = new Map(displayableProducts.map((product) => [product.id, product]));

  return Array.from({ length: catalogPageCount }, (_, index) => {
    const page = index + 1;
    const mappedProductIds = catalogProductIdsByPage[page] ?? [];

    return {
      page,
      products: mappedProductIds
        .map((productId) => productById.get(productId))
        .filter((product): product is CatalogPageProduct => Boolean(product))
        .slice(0, productsPerCatalogPage),
    };
  });
}

export default async function DigitalCatalogPage() {
  const products = await getProducts();
  const productGroups = buildCatalogProductGroups(products);

  return (
    <main className="bg-[linear-gradient(180deg,#ffffff_0%,#fbf9fb_100%)] px-4 py-8 sm:px-8 sm:py-12 lg:px-12 lg:py-14">
      <div className="mx-auto w-full max-w-[1400px]">
        <DigitalCatalogExperience
          title="Răsfoiește. Descoperă. Comandă."
          description="Produsele din catalog sunt la un click distanță."
          embedUrl={canvaEmbedUrl}
          externalUrl={canvaCatalogUrl}
          documentTitle="Catalogul digital Margele.net"
          updatedLabel="Mai 2026"
          pageCount={catalogPageCount}
          productGroups={productGroups}
        />
      </div>
    </main>
  );
}
