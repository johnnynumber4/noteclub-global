import type { NextConfig } from "next";

// Capacitor build configuration - static export
const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Required for static export
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable trailing slashes to prevent routing issues
  trailingSlash: true,
};

export default nextConfig;
