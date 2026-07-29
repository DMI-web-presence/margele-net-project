import { ReactNode } from 'react';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Contul meu',
  description: 'Zona privata pentru contul tau Margele.net.',
  path: '/cont',
  noindex: true,
});

export default function AccountLayout({ children }: { children: ReactNode }) {
  return children;
}
