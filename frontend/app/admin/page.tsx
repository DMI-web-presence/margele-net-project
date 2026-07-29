import AdminPanel from '@/components/admin/admin-panel';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  title: 'Administrare',
  description: 'Panou intern de administrare Margele.net.',
  path: '/admin',
  noindex: true,
});

export default function AdminPage() {
  return <AdminPanel />;
}
