import FavoritesPageContent from '@/components/favorites-page-content';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Favorite',
  description: 'Produsele tale favorite de pe Margele.net.',
  path: '/favorites',
  noindex: true,
});

export default function FavoritesPage() {
  return <FavoritesPageContent />;
}
