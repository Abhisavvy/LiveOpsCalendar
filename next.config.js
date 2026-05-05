/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['@fullcalendar/react', 'lucide-react'],
  },
  eslint: {
    dirs: ['app', 'features', 'components', 'lib'],
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