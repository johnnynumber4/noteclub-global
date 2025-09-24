import type { NextConfig } from "next";
import withPWA from "next-pwa";

const isTurbopack = process.env.TURBOPACK === "1";

// PWA configuration with Turbopack compatibility
const pwaConfig = {
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development" || isTurbopack,
  buildExcludes: [/middleware-manifest\.json$/],
  // Add fallback handling for service worker errors
  fallbacks: {
    image: "/icon-192x192.png",
    document: "/offline",
  },
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "images",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /^https:\/\/api\.spotify\.com\/.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "spotify-api",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /^https:\/\/music\.youtube\.com\/.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "youtube-music-api",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 10,
      },
    },
    {
      urlPattern: /^https:\/\/itunes\.apple\.com\/.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "apple-music-api",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
};

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Allow production builds to complete even if project has ESLint errors
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to complete even if project has type errors
    ignoreBuildErrors: true,
  },
  // Turbopack configuration
  turbopack: {
    // Add any turbopack-specific configurations here if needed
    resolveExtensions: [".mdx", ".tsx", ".ts", ".jsx", ".js", ".mjs", ".json"],
  },
};

export default withPWA(pwaConfig)(nextConfig);
