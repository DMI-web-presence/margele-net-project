import Image from 'next/image';
import Link from 'next/link';

const newArrivals = [
  {
    id: 'demo-arrival-1',
    name: 'Margele fatetate lavanda 6 mm',
    description: 'Stralucire discreta pentru bratari fine si accesorii de primavara.',
    price: '14.90',
    imageUrl: '/landing-page-image.webp',
    href: '/catalog',
  },
  {
    id: 'demo-arrival-2',
    name: 'Capacele decorative bronz antic',
    description: 'Detalii metalice pentru coliere, cercei si pandantive handmade.',
    price: '9.50',
    imageUrl: '/landing-page-image.webp',
    href: '/catalog',
  },
  {
    id: 'demo-arrival-3',
    name: 'Mix charm-uri inimioare colorate',
    description: 'Accente vesele pentru cadouri, martisoare si proiecte rapide.',
    price: '21.00',
    imageUrl: '/landing-page-image.webp',
    href: '/catalog',
  },
  {
    id: 'demo-arrival-4',
    name: 'Margele acrilice sidefate roz',
    description: 'Textura usoara si luciu discret pentru bratari de zi cu zi.',
    price: '11.90',
    imageUrl: '/landing-page-image.webp',
    href: '/catalog',
  },
  {
    id: 'demo-arrival-5',
    name: 'Conectori florali aurii',
    description: 'Piese fine pentru coliere, cercei si accesorii elegante.',
    price: '8.70',
    imageUrl: '/landing-page-image.webp',
    href: '/catalog',
  },
] as const;

const priceFormatter = new Intl.NumberFormat('ro-RO', {
  style: 'currency',
  currency: 'RON',
  currencyDisplay: 'narrowSymbol',
});

export default function NewArrivalsSection() {
  return (
    <section className="bg-white p-6">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-12 sm:px-10 lg:px-16">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#7b4a75]">
              Noutati demo
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Ultimele produse adaugate
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Mock data pentru a previzualiza cum arata zona de produse noi pe homepage.
            </p>
          </div>
          <Link
            href="/catalog"
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Vezi catalogul
          </Link>
        </div>

        <div className="mt-7 grid gap-3 lg:grid-cols-[1.35fr_0.85fr_0.85fr]">
          {newArrivals.map((product, index) => (
            <Link
              key={product.id}
              href={product.href}
              className={`group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50 transition hover:-translate-y-1 hover:bg-white hover:shadow-md ${
                index === 0 ? 'lg:row-span-2' : ''
              }`}
            >
              <div className={`relative bg-slate-100 ${index === 0 ? 'aspect-[4/3]' : 'aspect-[2/1]'}`}>
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                  unoptimized
                />
                <span
                  className={`absolute rounded-full bg-white/90 font-semibold uppercase tracking-[0.16em] text-[#7b4a75] ${
                    index === 0 ? 'left-4 top-4 px-3 py-1 text-xs' : 'left-2.5 top-2.5 px-2 py-0.5 text-[0.6rem]'
                  }`}
                >
                  Nou
                </span>
              </div>
              <div className={index === 0 ? 'p-5' : 'p-3'}>
                <h3
                  className={`font-semibold tracking-tight text-slate-950 ${
                    index === 0 ? 'text-xl' : 'text-sm'
                  }`}
                >
                  {product.name}
                </h3>
                <p
                  className={`mt-2 text-slate-600 ${
                    index === 0 ? 'text-sm leading-6' : 'line-clamp-2 text-[0.7rem] leading-4'
                  }`}
                >
                  {product.description}
                </p>
                <p
                  className={`font-semibold text-slate-950 ${
                    index === 0 ? 'mt-4 text-2xl' : 'mt-2 text-base'
                  }`}
                >
                  {priceFormatter.format(Number(product.price))}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
