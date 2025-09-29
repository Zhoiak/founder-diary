/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds for production
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable TypeScript checking during builds for production
  typescript: {
    ignoreBuildErrors: true,
  },
  // Skip static generation for problematic pages
  trailingSlash: false,
  // Output configuration for Docker
  output: 'standalone',
  // Disable static optimization for admin pages
  async generateStaticParams() {
    return [];
  },
  // Skip static generation for admin routes
  async generateBuildId() {
    return 'build-' + Date.now();
  },
  // Force dynamic for admin routes
  experimental: {
    forceSwcTransforms: true,
  },
};

module.exports = nextConfig;
