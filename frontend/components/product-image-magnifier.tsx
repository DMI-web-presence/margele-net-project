'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { getProductImageProps } from '@/lib/product-image-variants';

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
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const zoom = 2.4;
  const lensSize = 144;

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

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateContainerSize = () => {
      setContainerSize({
        width: node.clientWidth,
        height: node.clientHeight,
      });
    };

    updateContainerSize();

    const resizeObserver = new ResizeObserver(updateContainerSize);
    resizeObserver.observe(node);

    return () => resizeObserver.disconnect();
  }, []);

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

  const imageRatio = width / height;
  const containerRatio =
    containerSize.width > 0 && containerSize.height > 0
      ? containerSize.width / containerSize.height
      : imageRatio;
  const renderedImage =
    containerRatio > imageRatio
      ? {
          width: containerSize.height * imageRatio,
          height: containerSize.height,
        }
      : {
          width: containerSize.width,
          height: containerSize.width / imageRatio,
        };
  const imageOffset = {
    x: (containerSize.width - renderedImage.width) / 2,
    y: containerSize.height - renderedImage.height,
  };
  const focusPoint = {
    x: imageOffset.x + (position.x / 100) * renderedImage.width,
    y: imageOffset.y + (position.y / 100) * renderedImage.height,
  };
  const zoomedImage = {
    width: renderedImage.width * zoom,
    height: renderedImage.height * zoom,
  };
  const zoomedOffset = {
    x: lensSize / 2 - (focusPoint.x - imageOffset.x) * zoom,
    y: lensSize / 2 - (focusPoint.y - imageOffset.y) * zoom,
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
        {...getProductImageProps(activeSrc, 'product')}
        alt={alt}
        className="h-full w-full object-contain object-bottom"
        unoptimized
      />

      {isActive ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute h-36 w-36 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-2 border-white/90 shadow-xl ring-1 ring-slate-300"
          style={{
            left: `${position.x}%`,
            top: `${position.y}%`,
          }}
        >
          <div className="relative h-full w-full bg-white">
            <Image
              {...getProductImageProps(activeSrc, 'zoom')}
              alt=""
              className="absolute max-w-none object-contain object-bottom"
              style={{
                left: `${zoomedOffset.x}px`,
                top: `${zoomedOffset.y}px`,
                width: `${zoomedImage.width}px`,
                height: `${zoomedImage.height}px`,
              }}
              unoptimized
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
