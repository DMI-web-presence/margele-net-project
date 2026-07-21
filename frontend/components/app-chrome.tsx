'use client';

import { usePathname } from 'next/navigation';
import { CartProvider } from '@/components/cart-provider';
import CookieConsent from '@/components/cookie-consent';
import Footer from '@/components/footer';
import NavigationHistory from '@/components/navigation-history';
import NavBar from '@/components/nav-bar';
import WhatsAppFloatingButton from '@/components/whatsapp-floating-button';

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
