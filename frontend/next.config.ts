import type { NextConfig } from 'next';

const cloudflareImageBaseUrl = process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGE_BASE_URL || '';
const cloudflareImageRemotePattern = buildRemotePattern(cloudflareImageBaseUrl);

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  images: {
    remotePatterns: cloudflareImageRemotePattern ? [cloudflareImageRemotePattern] : [],
  },
};

export default nextConfig;

function buildRemotePattern(rawUrl: string) {
  const trimmedUrl = rawUrl.trim();
  if (!trimmedUrl) {
    return null;
  }

  try {
    const url = new URL(trimmedUrl);
    return {
      protocol: url.protocol.replace(':', '') as 'http' | 'https',
      hostname: url.hostname,
      port: url.port,
      pathname: `${url.pathname.replace(/\/$/, '') || ''}/**`,
    };
  } catch {
    return null;
  }
}
