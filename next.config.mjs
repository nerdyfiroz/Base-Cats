/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Stub out optional native modules not needed in the browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      'pino-pretty': false,
      lokijs: false,
    };
    // Ignore optional peer deps that may be missing
    config.externals = config.externals || [];
    return config;
  },
};

export default nextConfig;
