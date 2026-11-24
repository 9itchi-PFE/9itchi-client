import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  env: {
    NEXT_PUBLIC_ABLY_KEY: process.env.NEXT_PUBLIC_ABLY_KEY,
  },
  // Standalone output for a minimal Docker image
  output: 'standalone',
};

export default withNextIntl(nextConfig);
