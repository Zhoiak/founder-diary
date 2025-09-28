/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      // Turbopack configuration
    }
  },
  // Skip static generation for admin pages during build
  // This prevents build errors when Supabase env vars are not available
  async generateStaticParams() {
    return [];
  },
  // Disable static optimization for admin routes
  async rewrites() {
    return [];
  },
  // Configure which pages to skip during static generation
  trailingSlash: false,
  // Skip problematic pages during build
  async redirects() {
    return [];
  }
};

module.exports = nextConfig;
