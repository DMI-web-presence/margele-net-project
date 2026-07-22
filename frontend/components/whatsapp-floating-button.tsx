'use client';

import { useEffect, useState } from 'react';

const rawWhatsAppNumber =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ||
  process.env.NEXT_PUBLIC_CONTACT_PHONE ||
  '+40259267109';

const defaultMessage = encodeURIComponent('Buna! Am o intrebare despre produsele de pe Margele.net.');

function normalizeWhatsAppNumber(value: string) {
  const digitsOnly = String(value || '').replace(/\D/g, '');

  if (!digitsOnly) {
    return '';
  }

  if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
    return `4${digitsOnly}`;
  }

  return digitsOnly;
}

export default function WhatsAppFloatingButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(20);
  const normalizedNumber = normalizeWhatsAppNumber(rawWhatsAppNumber);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    function handleScroll() {
      if (window.scrollY < 180) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        setIsVisible(false);
        return;
      }

      if (isVisible || timeoutId) {
        return;
      }

      timeoutId = setTimeout(() => {
        setIsVisible(true);
        timeoutId = null;
      }, 650);
    }

    function syncFooterOffset() {
      const footerPresenceBar = document.querySelector('[data-footer-presence-bar]');
      if (!footerPresenceBar) {
        setBottomOffset(20);
        return;
      }

      const footerRect = footerPresenceBar.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const overlap = Math.max(0, viewportHeight - footerRect.top);
      setBottomOffset(overlap > 0 ? overlap + 12 : 20);
    }

    handleScroll();
    syncFooterOffset();
    const handleWindowChange = () => {
      handleScroll();
      syncFooterOffset();
    };

    window.addEventListener('scroll', handleWindowChange, { passive: true });
    window.addEventListener('resize', handleWindowChange);

    return () => {
      window.removeEventListener('scroll', handleWindowChange);
      window.removeEventListener('resize', handleWindowChange);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isVisible]);

  if (!normalizedNumber) {
    return null;
  }

  return (
    <a
      href={`https://wa.me/${normalizedNumber}?text=${defaultMessage}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Deschide conversatia WhatsApp"
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-[0_18px_45px_rgba(37,211,102,0.34)] transition-all duration-300 hover:scale-[1.03] hover:bg-[#20ba59] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2 ${
        isVisible ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
      style={{ bottom: `${bottomOffset}px` }}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/16">
        <svg viewBox="0 0 32 32" className="h-6 w-6 fill-current" aria-hidden="true">
          <path d="M19.11 17.21c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.13-.42-2.16-1.33-.8-.71-1.35-1.58-1.5-1.85-.16-.27-.02-.41.12-.54.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.48-.84-2.02-.22-.53-.45-.45-.61-.46h-.52c-.18 0-.48.07-.73.34-.25.27-.95.93-.95 2.27 0 1.34.97 2.63 1.11 2.82.14.18 1.9 2.9 4.61 4.07.64.28 1.14.45 1.53.58.64.2 1.22.17 1.68.1.51-.08 1.6-.65 1.83-1.27.23-.62.23-1.15.16-1.27-.07-.12-.25-.2-.52-.34Z" />
          <path d="M16.04 3.2c-7.08 0-12.82 5.74-12.82 12.82 0 2.26.59 4.47 1.71 6.41L3 29l6.76-1.77a12.78 12.78 0 0 0 6.28 1.62h.01c7.07 0 12.81-5.75 12.81-12.82 0-3.43-1.34-6.65-3.77-9.08A12.74 12.74 0 0 0 16.04 3.2Zm0 23.48h-.01a10.62 10.62 0 0 1-5.42-1.49l-.39-.23-4.01 1.05 1.07-3.91-.25-.4a10.63 10.63 0 0 1-1.63-5.68c0-5.88 4.78-10.66 10.66-10.66 2.85 0 5.53 1.11 7.54 3.12a10.6 10.6 0 0 1 3.12 7.54c0 5.88-4.78 10.66-10.67 10.66Z" />
        </svg>
      </span>
      <span className="hidden text-sm font-semibold tracking-[0.01em] sm:block">
        Scrie-ne pe WhatsApp
      </span>
    </a>
  );
}
