import AboutUsPageContent from '@/components/about-us-page-content';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Despre noi',
  description: 'Informatii despre S.C. PAMIL S.R.L., magazinul online de margele si accesorii.',
  path: '/despre-noi',
});

export default function AboutUsPage() {
  return <AboutUsPageContent />;
}
