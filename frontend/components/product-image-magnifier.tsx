'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

type ProductImageMagnifierProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

export default function ProductImageMagnifier({
  src,
  alt,
  width = 800,
  height = 800,
}: ProductImageMagnifierProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeSrc, setActiveSrc] = useState(src);
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    setActiveSrc(src);
  }, [src]);

  useEffect(() => {
    const handleOptionImageChange = (event: Event) => {
      const nextSrc = (event as CustomEvent<{ src?: string | null }>).detail?.src;
      setActiveSrc(nextSrc || src);
    };

    window.addEventListener('product-option-image-change', handleOptionImageChange);
    return () => window.removeEventListener('product-option-image-change', handleOptionImageChange);
  }, [src]);

  const handleMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setPosition({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    });
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsActive(true)}
      onMouseLeave={() => setIsActive(false)}
      onMouseMove={handleMove}
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
    >
      <Image
        src={activeSrc}
        alt={alt}
        width={width}
        height={height}
        className="h-full w-full object-contain object-bottom"
        unoptimized
      />

      {isActive ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 shadow-xl ring-1 ring-slate-300"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
            backgroundImage: `url(${activeSrc})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `cover`,
            backgroundPosition: `${position.x}% ${position.y}%`,
          }}
        />
      ) : null}
    </div>
  );
}
