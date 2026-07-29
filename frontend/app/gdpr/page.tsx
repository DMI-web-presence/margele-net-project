import GdprPageContent from '@/components/gdpr-page-content';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'GDPR si cookie-uri',
  description: 'Setari cookie-uri si informatii GDPR pentru Margele.net.',
  path: '/gdpr',
});

export default function GdprPage() {
  return <GdprPageContent />;
}
