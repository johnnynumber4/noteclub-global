import type { NextConfig } from "next";
import withPWA from "next-pwa";

const isTurbopack = process.env.TURBOPACK === "1";

// PWA configuration with Turbopack compatibility
const pwaConfig = {
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: false, // Enable SW even in development for testing notifications
  // disable: process.env.NODE_ENV === "development" || isTurbopack,
  buildExcludes: [/middleware-manifest\.json$/],
  // Suppress the GenerateSW warning in development
  ...(process.env.NODE_ENV === "development" && {
    // Dev mode - reduce warnings
    maximumFileSizeToCacheInBytes: 5000000,
  }),
  // Add fallback handling for service worker errors
  fallbacks: {
    image: "/icon-192x192.png",
    document: "/offline",
  },
  runtimeCaching: [
    // Internal API routes - Network First with fallback to cache
    {
      urlPattern: /^\/api\/albums\/[^/]+$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-albums",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        networkTimeoutSeconds: 10,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /^\/api\/albums$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-albums-list",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 2 * 60, // 2 minutes
        },
        networkTimeoutSeconds: 10,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Images
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
    // External Music APIs
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
