/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['@fullcalendar/react', 'lucide-react'],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true, // Required for static export
  },
  trailingSlash: true,
}

module.exports = nextConfig