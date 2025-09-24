#!/usr/bin/env node

/**
 * Clean PWA files during development to prevent service worker errors
 */

const fs = require("fs");
const path = require("path");

const publicDir = path.join(__dirname, "..", "public");
const filesToRemove = ["sw.js", "workbox-*.js"];

console.log("🧹 Cleaning PWA files for development...");

// Remove specific files
filesToRemove.forEach((pattern) => {
  if (pattern.includes("*")) {
    // Handle wildcard patterns
    const files = fs
      .readdirSync(publicDir)
      .filter((file) => file.match(pattern.replace("*", ".*")));
    files.forEach((file) => {
      const filePath = path.join(publicDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`   ✓ Removed ${file}`);
      }
    });
  } else {
    // Handle exact file names
    const filePath = path.join(publicDir, pattern);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`   ✓ Removed ${pattern}`);
    }
  }
});

console.log("✅ PWA cleanup complete!");
