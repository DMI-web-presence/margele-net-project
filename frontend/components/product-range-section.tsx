import Image from 'next/image';
import Link from 'next/link';

const productRanges = [
  {
    title: 'Margele si accesorii',
    description: 'Margele din sticla, plastic, acril, pietre semipretioase si o varietate de accesorii pentru bijuterii.',
    href: '/catalog?category=margele',
    imageUrl: '/range-margele-accesorii.png',
  },
  {
    title: 'Fimo si materiale creative',
    description: 'Plastilina FIMO, unelte, culori si materiale pentru proiecte creative si hobby.',
    href: '/catalog?category=materiale-handmade',
    imageUrl: '/range-fimo-materiale.png',
  },
  {
    title: 'Polistiren si proiecte personalizate',
    description: 'Elemente din polistiren pentru decoratiuni, proiecte DIY si arhitecturale la comanda.',
    href: '/catalog?search=polistiren',
    imageUrl: '/range-polistiren.png',
  },
];

export default function ProductRangeSection() {
  return (
    <section className="bg-white mb-14">
      <div className="mx-auto max-w-[1370px] rounded-[1.45rem] border border-slate-200 bg-white p-5 shadow-[0_10px_35px_rgba(15,23,42,0.06)]">
        <p className="px-1 text-xs font-bold uppercase tracking-[0.34em] text-[#7b4a75]">
          Oferim o gama larga de produse
        </p>

        <div className="mt-4 grid gap-5 lg:grid-cols-3">
          {productRanges.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="relative h-[154px] overflow-hidden rounded-lg bg-slate-100">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                  sizes="(min-width: 1024px) 31vw, 100vw"
                  unoptimized
                />
              </div>
              <div className="px-1 pb-1 pt-4">
                <h2 className="text-lg font-bold leading-6 text-slate-950">{item.title}</h2>
                <p className="mt-3 text-sm font-medium leading-6 text-slate-700">
                  {item.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#6437f3] transition group-hover:translate-x-1">
                  Descopera gama
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                    <path d="M5 12h14M13 6l6 6-6 6" className="fill-none stroke-current stroke-2" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
