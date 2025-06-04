
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  experimental: {
    allowedDevOrigins: [
      'https://web.telegram.org',
      'https://3000-firebase-studio-1748828329251.cluster-3gc7bglotjgwuxlqpiut7yyqt4.cloudworkstations.dev',
      // You can also add your ngrok or custom domain here if needed
    ],
    serverComponentsExternalPackages: ['handlebars'],
  },
};

export default nextConfig;
