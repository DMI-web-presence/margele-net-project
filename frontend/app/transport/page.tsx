import TransportPageContent from '@/components/transport-page-content';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Transport',
  description: 'Informatii despre costurile de transport si termenele de livrare Margele.net.',
  path: '/transport',
});

export default function TransportPage() {
  return <TransportPageContent />;
}
