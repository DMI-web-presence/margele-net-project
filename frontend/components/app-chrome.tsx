'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { CartProvider } from '@/components/cart-provider';
import Footer from '@/components/footer';
import NavBar from '@/components/nav-bar';

const CookieConsent = dynamic(() => import('@/components/cookie-consent'), {
  ssr: false,
});
const NavigationHistory = dynamic(() => import('@/components/navigation-history'), {
  ssr: false,
});
const WhatsAppFloatingButton = dynamic(() => import('@/components/whatsapp-floating-button'), {
  ssr: false,
});

export default function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');

  return (
    <CartProvider>
      {isAdminRoute ? (
        <div className="min-h-full">{children}</div>
      ) : (
        <>
          <NavBar />
          <div className="flex-1">{children}</div>
          <WhatsAppFloatingButton />
          <NavigationHistory />
          <Footer />
          <CookieConsent />
        </>
      )}
    </CartProvider>
  );
}
