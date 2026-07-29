'use client';

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';

type RevealProps = {
  children: ReactNode;
  className?: string;
  delayMs?: number;
  threshold?: number;
};

export default function Reveal({
  children,
  className = '',
  delayMs = 0,
  threshold = 0.16,
}: RevealProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let frame = 0;
    let observer: IntersectionObserver | null = null;
    const timeouts: number[] = [];
    const removeFallbackListeners = () => {
      window.removeEventListener('scroll', checkReached);
      window.removeEventListener('resize', checkReached);
    };
    const reveal = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => setIsVisible(true));
      observer?.disconnect();
      removeFallbackListeners();
      for (const timeout of timeouts) {
        window.clearTimeout(timeout);
      }
    };
    const checkReached = () => {
      const rect = element.getBoundingClientRect();
      const triggerY = window.innerHeight * 0.92;
      if (rect.top <= triggerY) {
        reveal();
      }
    };

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      reveal();
      return () => window.cancelAnimationFrame(frame);
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        reveal();
      },
      {
        root: null,
        rootMargin: '0px 0px -8% 0px',
        threshold: Math.min(threshold, 0.08),
      },
    );

    observer.observe(element);
    checkReached();
    window.addEventListener('scroll', checkReached, { passive: true });
    window.addEventListener('resize', checkReached);
    timeouts.push(
      window.setTimeout(checkReached, 120),
      window.setTimeout(checkReached, 420),
      window.setTimeout(checkReached, 900),
    );

    return () => {
      window.cancelAnimationFrame(frame);
      observer?.disconnect();
      removeFallbackListeners();
      for (const timeout of timeouts) {
        window.clearTimeout(timeout);
      }
    };
  }, [threshold]);

  return (
    <div
      ref={elementRef}
      className={`scroll-reveal ${isVisible ? 'is-visible' : ''} ${className}`}
      style={{ '--reveal-delay': `${delayMs}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
