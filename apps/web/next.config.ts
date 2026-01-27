import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for deployment to any static host
  output: "export",
  
  // Trailing slashes for better static hosting compatibility
  trailingSlash: true,
  
  // Image optimization settings for static export
  images: {
    unoptimized: true,
  },
  
  // Base path (uncomment if deploying to a subdirectory)
  // basePath: '/smelteros',
  
  // Asset prefix for CDN (uncomment if using a CDN)
  // assetPrefix: 'https://cdn.smelteros.com',
};

export default nextConfig;
