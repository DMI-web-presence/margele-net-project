import ContactPageContent from '@/components/contact-page-content';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Contact',
  description: 'Trimite un mesaj catre echipa Margele.net pentru intrebari despre produse, stoc sau comenzi.',
  path: '/contact',
});

export default function ContactPage() {
  return <ContactPageContent />;
}
