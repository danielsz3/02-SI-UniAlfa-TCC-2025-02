/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/api/imagens/**',
      },
      {
        protocol: 'https',
        hostname: 'github.com',
      },
    ],
  },
  // devIndicators removido
};

export default nextConfig;
