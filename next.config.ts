import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    // Allow build to succeed even with type errors during migration
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
