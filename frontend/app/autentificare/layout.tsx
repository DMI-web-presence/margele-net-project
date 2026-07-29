import { ReactNode } from 'react';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Autentificare',
  description: 'Autentificare si administrare cont Margele.net.',
  path: '/autentificare',
  noindex: true,
});

export default function AuthLayout({ children }: { children: ReactNode }) {
  return children;
}
