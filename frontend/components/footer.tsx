import Image from 'next/image';
import Link from 'next/link';

const infoLinks = ['Transport', 'Conditii Retur', 'Cum cumpar', 'Despre noi', 'GDPR'];
const storeLinks = ['Margele.net', 'Degetar.ro', 'Comunitatea Facebook'];
const miscLinks = ['Marci', 'Vouchere', 'Promotii', 'Retururi'];

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90">{title}</h3>
      <ul className="flex flex-col gap-2 text-sm text-white/75">
        {links.map((item) => (
          <li key={item}>
            <Link href="#" className="transition hover:text-white">
              {item}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="mt-14 border-t border-[#a6669f] bg-gradient-to-b from-[#94608d] to-[#7b4a75] text-white">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-12 sm:px-10 lg:px-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1.2fr]">
          <div className="space-y-4">
            <Link href="/" className="inline-flex">
              <Image
                src="/margelenet-logo-webp.webp"
                alt="Margele.net"
                width={160}
                height={120}
                className="h-auto w-[150px]"
                unoptimized
              />
            </Link>
            <p className="max-w-xs text-sm leading-6 text-white/70">
              Accesorii creative si materiale atent selectate pentru proiectele tale handmade.
            </p>
          </div>

          <FooterColumn title="Informatii" links={infoLinks} />
          <FooterColumn title="Magazine" links={storeLinks} />
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90">Diverse</h3>
            <ul className="flex flex-col gap-2 text-sm text-white/75">
              {miscLinks.map((item) => (
                <li key={item}>
                  <Link href="#" className="transition hover:text-white">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
            <a
              href="https://anpc.ro/"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex rounded-xl border border-white/25 bg-white/10 p-2 transition hover:bg-white/20"
              aria-label="Deschide site-ul ANPC"
            >
              <Image
                src="/anpc-logo.webp"
                alt="ANPC"
                width={170}
                height={44}
                className="h-auto w-[300px]"
                unoptimized
              />
            </a>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90">Contactati-ne</h3>
            <div className="space-y-2 text-sm text-white/80">
              <p>Str. Sovata 5, bl PC26, ap2, Oradea, Bihor, Romania</p>
              <p>0259 267 109</p>
              <p>degetarmargele@gmail.com</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="inline-flex rounded-xl border border-white/25 bg-white/10 p-2">
                <Image
                  src="/netopia-white.webp"
                  alt="Netopia Payments"
                  width={170}
                  height={44}
                  className="h-auto w-[140px]"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/20 bg-[#6a3c65]">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-2 px-6 py-4 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16">
          <p>Pamil srl © 2005 - 2026. Toate drepturile rezervate.</p>
          <p>Crafted with ❤️ by MDI - Building your modern web presence</p> 
        </div>
      </div>
    </footer>
  );
}
