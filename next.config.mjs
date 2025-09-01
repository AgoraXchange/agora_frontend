/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Silence warnings
  // https://github.com/WalletConnect/walletconnect-monorepo/issues/1908
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
  
  async rewrites() {
    return [
      {
        source: "/mp/:path*",
        destination: "https://api.mixpanel.com/:path*",
      },
    ];
  },
};

export default nextConfig;
