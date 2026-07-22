'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const infoLinks = [
  { label: 'Transport', href: '/transport' },
  { label: 'Conditii Retur', href: '/retur-produse' },
  { label: 'Cum cumpar', href: '/cum-cumpar' },
  { label: 'Despre noi', href: '/despre-noi' },
  { label: 'GDPR', href: '/gdpr' },
  { label: 'Retururi', href: '/retur-produse' },
];

const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/margelenet/', icon: 'instagram' },
  { label: 'Facebook', href: 'https://www.facebook.com/margeleoradea', icon: 'facebook' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@margelenet', icon: 'tiktok' },
  { label: 'YouTube', href: 'https://www.youtube.com/@margeledegetar9525', icon: 'youtube' },
] as const;

function SocialIcon({ icon }: { icon: (typeof socialLinks)[number]['icon'] }) {
  if (icon === 'instagram') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" rx="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
        <circle cx="16.8" cy="7.2" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (icon === 'facebook') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14.2 8.4h2.3V4.7A15 15 0 0 0 13.1 4c-3.3 0-5.5 2-5.5 5.6v3.1H4v4.1h3.6V24h4.4v-7.2h3.5l.6-4.1H12V10c0-1.2.3-1.6 2.2-1.6Z" />
      </svg>
    );
  }

  if (icon === 'youtube') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.6 8.2a3 3 0 0 0-2.1-2.1C17.7 5.6 12 5.6 12 5.6s-5.7 0-7.5.5A3 3 0 0 0 2.4 8.2 31.8 31.8 0 0 0 2 12a31.8 31.8 0 0 0 .4 3.8 3 3 0 0 0 2.1 2.1c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.1A31.8 31.8 0 0 0 22 12a31.8 31.8 0 0 0-.4-3.8ZM10 15.4V8.6l5.2 3.4L10 15.4Z" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15.9 4c.5 2.4 1.9 3.8 4.1 4v3.8a7 7 0 0 1-4-1.2v6.3c0 4.3-3 7.1-7 7.1-3.7 0-6.6-2.8-6.6-6.3 0-4.1 3.7-7.1 8-6.3v4a3.2 3.2 0 0 0-1.3-.2 2.4 2.4 0 0 0-2.5 2.4c0 1.4 1.1 2.5 2.6 2.5 1.6 0 2.7-1 2.7-3.1V4h4Z" />
    </svg>
  );
}

function ContactIcon({ icon }: { icon: 'location' | 'phone' | 'email' }) {
  if (icon === 'location') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  if (icon === 'phone') {
    return (
      <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <path
          d="M6.6 4.8 8.8 4c.7-.2 1.4.1 1.7.7l1 2.3c.3.6.1 1.2-.4 1.6l-1.3 1.1a11 11 0 0 0 4.5 4.5l1.1-1.3c.4-.5 1.1-.7 1.6-.4l2.3 1c.6.3.9 1 .7 1.7l-.8 2.2c-.2.6-.8 1-1.5 1A13.7 13.7 0 0 1 5.6 6.3c0-.7.4-1.3 1-1.5Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M4.5 6.5h15v11h-15v-11Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="m5 7 7 6 7-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
      <path
        d="M5 6.5h14A1.5 1.5 0 0 1 20.5 8v8A1.5 1.5 0 0 1 19 17.5H9l-4.5 3v-12A1.5 1.5 0 0 1 5 6.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
      <path
        d="M8 10.5h8M8 13.5h5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90">{title}</h3>
      <ul className="flex flex-col gap-2 text-sm text-white/75">
        {links.map((item) => (
          <li key={item.label}>
            <Link href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on authentication pages
  if (pathname?.startsWith('/autentificare')) {
    return null;
  }
  return (
    <footer className="border-t border-white/10 bg-[linear-gradient(105deg,#02081f_0%,#11103a_48%,#3a1470_100%)] text-white">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-12 sm:px-10 lg:px-16">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr_1.2fr]">
          <div className="space-y-4">
            <Link href="/" className="inline-flex">
              <Image
                src="/margelenet-logo-nav-bar-cropped.png"
                alt="Margele.net"
                width={1045}
                height={290}
                className="h-auto w-[220px]"
                unoptimized
              />
            </Link>
            <p className="max-w-xs text-sm leading-6 text-white/70">
              Accesorii creative si materiale atent selectate pentru proiectele tale handmade.
            </p>
            <div className="flex items-center gap-2 pt-1">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={item.label}
                  title={item.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/20 bg-white/[0.08] text-white/80 transition hover:border-white/35 hover:bg-white/15 hover:text-white"
                >
                  <SocialIcon icon={item.icon} />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Informatii" links={infoLinks} />

          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white/90">Date contact</h3>
            <div className="space-y-2.5 text-sm text-white/80">
              <p className="flex items-start gap-2">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center text-white/75">
                  <ContactIcon icon="location" />
                </span>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Str.%20Sovata%205%2C%20bl%20PC26%2C%20ap2%2C%20Oradea%2C%20Bihor%2C%20Romania"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="transition hover:text-white"
                >
                  Str. Sovata 5, bl PC26, ap2, Oradea, Bihor, Romania
                </a>
              </p>
              <p className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-white/75">
                  <ContactIcon icon="phone" />
                </span>
                <a href="tel:+40259267109" className="transition hover:text-white">
                  0259 267 109
                </a>
              </p>
              <p className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-white/75">
                  <ContactIcon icon="email" />
                </span>
                <a href="mailto:degetarmargele@gmail.com" className="transition hover:text-white">
                  degetarmargele@gmail.com
                </a>
              </p>
              <p className="flex items-center gap-2">
                <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-white/75">
                  <MessageIcon />
                </span>
                <Link href="/contact" className="transition hover:text-white">
                  Trimite mesaj
                </Link>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
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
                  className="h-auto w-[170px]"
                  unoptimized
                />
              </a>
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

      <div data-footer-presence-bar className="border-t border-white/15 bg-black/20">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-2 px-6 py-4 text-xs text-white/70 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-16">
          <p>Pamil srl © 2005 - 2026. Toate drepturile rezervate.</p>
          <p>
            Crafted with ❤️ by{' '}
            <a
              href="https://www.linkedin.com/in/marius-dorobantu-07986a129/"
              target="_blank"
              rel="noreferrer noopener"
              className="font-medium text-white transition hover:text-white/80"
            >
              MDI
            </a>{' '}
            - Building your modern web presence
          </p>
        </div>
      </div>
    </footer>
  );
}
