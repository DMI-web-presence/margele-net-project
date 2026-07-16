import { Suspense } from 'react';
import CheckoutStatusContent from '@/components/checkout-status-content';

export default function CheckoutStatusPage() {
  return (
    <Suspense fallback={<div className="px-6 py-16 text-slate-600">Se verifica plata...</div>}>
      <CheckoutStatusContent />
    </Suspense>
  );
}
