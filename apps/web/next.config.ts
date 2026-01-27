import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone output for server deployment (Cloud Run, etc.)
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
  
  // Turbopack root configuration for monorepo
  turbopack: {
    root: ".",
  },
};

export default nextConfig;
