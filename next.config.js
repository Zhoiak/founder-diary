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
  // Turbopack configuration
  turbopack: {
    // Turbopack configuration
  },
  // Skip static generation for problematic pages
  trailingSlash: false,
  // Output configuration for Docker
  output: 'standalone',
  // Skip static generation for admin pages that require database
  async generateStaticParams() {
    return [];
  },
  // Disable static optimization for pages that use server-side features
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
};

module.exports = nextConfig;
