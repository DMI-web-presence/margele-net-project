import HowToBuyPageContent from '@/components/how-to-buy-page-content';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Cum cumpar',
  description: 'Ghid de comanda si informatii importante despre cumparaturile de pe Margele.net.',
  path: '/cum-cumpar',
});

export default function HowToBuyPage() {
  return <HowToBuyPageContent />;
}
