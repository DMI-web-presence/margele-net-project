'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

type ProductImageMagnifierProps = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  zoom?: number;
};

export default function ProductImageMagnifier({
  src,
  alt,
  width = 800,
  height = 800,
  zoom = 3.8,
}: ProductImageMagnifierProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });

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
        src={src}
        alt={alt}
        width={width}
        height={height}
        className="max-h-full w-auto max-w-full object-contain"
        unoptimized
      />

      {isActive ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/90 shadow-xl ring-1 ring-slate-300"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
            backgroundImage: `url(${src})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${zoom * 100}%`,
            backgroundPosition: `${position.x}% ${position.y}%`,
          }}
        />
      ) : null}
    </div>
  );
}
