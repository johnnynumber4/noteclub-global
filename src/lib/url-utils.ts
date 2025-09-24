/**
 * Utility functions for handling dynamic URLs in different environments
 */

/**
 * Get the base URL for the application based on the environment
 * Handles localhost, Vercel previews, and production deployments
 */
export function getBaseUrl(): string {
  // Browser environment - use current location
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Vercel environment variables (available in all Vercel deployments)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Custom NEXTAUTH_URL (for production or custom domains)
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // Fallback to localhost for development
  return "http://localhost:3000";
}

/**
 * Get the NextAuth URL specifically
 * This is used by NextAuth.js for redirects and callbacks
 */
export function getNextAuthUrl(): string {
  // In production/Vercel, use VERCEL_URL if available
  if (process.env.NODE_ENV === "production" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Otherwise use the configured NEXTAUTH_URL or fall back to localhost
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

/**
 * Get the app URL for internal API calls
 */
export function getAppUrl(): string {
  return process.env.APP_URL || getBaseUrl();
}
