export type ProductImageVariant = 'thumb' | 'card' | 'product' | 'zoom';

type ProductImageVariantConfig = {
  width: number;
  height: number;
  sizes: string;
  quality: number;
};

const productImageVariants: Record<ProductImageVariant, ProductImageVariantConfig> = {
  thumb: {
    width: 96,
    height: 96,
    sizes: '96px',
    quality: 70,
  },
  card: {
    width: 360,
    height: 360,
    sizes: '(min-width: 1024px) 360px, (min-width: 640px) 50vw, 92vw',
    quality: 78,
  },
  product: {
    width: 900,
    height: 900,
    sizes: '(min-width: 1280px) 42vw, (min-width: 768px) 50vw, 92vw',
    quality: 84,
  },
  zoom: {
    width: 1600,
    height: 1600,
    sizes: '(min-width: 1280px) 42vw, (min-width: 768px) 50vw, 92vw',
    quality: 90,
  },
};

const cloudflareImageBaseUrl = normalizeCloudflareBaseUrl(
  process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGE_BASE_URL || '',
);
const imageSourceBaseUrl = normalizeCloudflareBaseUrl(
  process.env.NEXT_PUBLIC_IMAGE_SOURCE_BASE_URL || '',
);

export function getProductImageVariantConfig(variant: ProductImageVariant) {
  return productImageVariants[variant];
}

export function getProductImageProps(src: string, variant: ProductImageVariant) {
  const config = getProductImageVariantConfig(variant);

  return {
    src: getProductImageUrl(src, variant),
    width: config.width,
    height: config.height,
    sizes: config.sizes,
  };
}

export function getProductImageUrl(src: string, variant: ProductImageVariant) {
  const normalizedSrc = String(src || '').trim();
  if (!normalizedSrc) {
    return normalizedSrc;
  }

  const sourceUrl = resolveTransformSourceUrl(normalizedSrc);
  if (!cloudflareImageBaseUrl || !sourceUrl) {
    return normalizedSrc;
  }

  const config = getProductImageVariantConfig(variant);
  const transformParams = [
    `width=${config.width}`,
    `height=${config.height}`,
    'fit=contain',
    `quality=${config.quality}`,
    'format=auto',
    'metadata=none',
  ].join(',');

  return `${cloudflareImageBaseUrl}/cdn-cgi/image/${transformParams}/${sourceUrl}`;
}

function normalizeCloudflareBaseUrl(value: string) {
  return String(value || '').trim().replace(/\/+$/, '');
}

function isAbsoluteHttpUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function resolveTransformSourceUrl(src: string) {
  if (isAbsoluteHttpUrl(src)) {
    return src;
  }

  if (src.startsWith('/') && imageSourceBaseUrl) {
    return `${imageSourceBaseUrl}${src}`;
  }

  return null;
}
