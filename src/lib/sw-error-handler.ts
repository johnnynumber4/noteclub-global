/**
 * Service Worker Error Handler for Development
 * Prevents common PWA/Workbox errors during development
 */

// Only run in browser environment
if (typeof window !== "undefined") {
  // Clear any existing service workers in development
  if (process.env.NODE_ENV === "development") {
    // Unregister any existing service workers
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then(function (registrations) {
        for (const registration of registrations) {
          registration.unregister().then(function (boolean) {
            console.log("🧹 Unregistered service worker:", boolean);
          });
        }
      });
    }

    // Clear all caches in development
    if ("caches" in window) {
      caches.keys().then(function (names) {
        for (const name of names) {
          caches.delete(name).then(function (success) {
            console.log("🧹 Cleared cache:", name, success);
          });
        }
      });
    }
  }

  // Handle global errors related to service workers
  window.addEventListener("error", function (event) {
    // Check if error is from workbox or service worker
    if (
      event.filename &&
      (event.filename.includes("workbox") ||
        event.filename.includes("sw.js") ||
        event.message.includes("workbox"))
    ) {
      console.warn("🚫 Service Worker error handled:", event.message);
      event.preventDefault();
      return false;
    }
  });

  // Handle unhandled promise rejections from service workers
  window.addEventListener("unhandledrejection", function (event) {
    if (
      event.reason &&
      typeof event.reason === "string" &&
      (event.reason.includes("workbox") || event.reason.includes("sw.js"))
    ) {
      console.warn(
        "🚫 Service Worker promise rejection handled:",
        event.reason
      );
      event.preventDefault();
    }
  });
}

export {};
