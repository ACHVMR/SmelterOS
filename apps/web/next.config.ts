import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone output for server deployment (Cloud Run, etc.)
  // This supports API routes unlike static export
  output: "standalone",
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  
  // Environment variables available at build time
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "https://smelteros.web.app",
  },
  
  // Ignore TypeScript errors during build (for CI)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Ignore ESLint errors during build (for CI)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
