import { PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from 'next/constants.js';

/** @type {import('next').NextConfig} */
const baseConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    remotePatterns: [],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '8mb',
    },
  },
};

export default function nextConfig(phase) {
  const isProductionOutput =
    phase === PHASE_PRODUCTION_BUILD || phase === PHASE_PRODUCTION_SERVER;

  return {
    ...baseConfig,
    distDir: isProductionOutput ? '.next-prod' : '.next',
  };
}
