import ReturnPageContent from '@/components/return-page-content';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Formular de retragere',
  description: 'Formular de retragere si solicitari de asistenta pentru comenzi.',
  path: '/retur-produse',
});

export default function ReturnProductsPage() {
  return <ReturnPageContent />;
}
