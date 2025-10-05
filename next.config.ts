import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/RogueCoinGame' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/RogueCoinGame/' : '',
  // Note: CSP headers don't work with static export, we'll handle CSP in the HTML meta tag instead
};

export default nextConfig;
