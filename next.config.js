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
};

module.exports = nextConfig;
