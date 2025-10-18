#!/usr/bin/env node

/**
 * Build script for Capacitor
 *
 * Since the app has API routes, we can't do a static export.
 * Instead, we'll:
 * 1. Copy the .next standalone build
 * 2. Create a simple index.html that redirects to your hosted web app
 * OR
 * 3. Use the actual web app URL in Capacitor config
 */

const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '..', 'out');

// Create out directory
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// For development: Create a simple HTML file that loads the hosted app
// REPLACE 'your-app-url.com' with your actual hosted URL
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Note Club</title>
  <style>
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    #loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: #0f0f0f;
      color: #fff;
      font-family: system-ui, -apple-system, sans-serif;
    }
    iframe {
      border: none;
      width: 100%;
      height: 100vh;
    }
  </style>
</head>
<body>
  <div id="loading">Loading Note Club...</div>
  <script>
    // OPTION 1: Load from hosted URL (recommended)
    const HOSTED_URL = 'https://clarayoung.com';

    // OPTION 2: For local development, use your local server
    // const HOSTED_URL = 'http://localhost:3000';

    // Create iframe to load the app
    const iframe = document.createElement('iframe');
    iframe.src = HOSTED_URL;
    iframe.style.display = 'none';

    iframe.onload = () => {
      document.getElementById('loading').style.display = 'none';
      iframe.style.display = 'block';
    };

    document.body.appendChild(iframe);
  </script>
</body>
</html>`;

fs.writeFileSync(path.join(outDir, 'index.html'), html);

console.log('✓ Created Capacitor build in /out');
console.log('✓ Configured to use: https://clarayoung.com');
console.log('\n   For local testing, update HOSTED_URL in out/index.html to:');
console.log('   - Android emulator: http://10.0.2.2:3000');
console.log('   - Physical device: http://YOUR_LOCAL_IP:3000\n');
