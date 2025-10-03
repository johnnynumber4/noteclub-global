const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE_IMAGE = path.join(__dirname, '../public/daft-punk-source.jpg');
const PUBLIC_DIR = path.join(__dirname, '../public');

async function generateIcons() {
  console.log('Generating icons from Daft Punk image...');

  try {
    // Generate PWA icons
    await sharp(SOURCE_IMAGE)
      .resize(192, 192, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(PUBLIC_DIR, 'icon-192x192.png'));
    console.log('✓ Generated icon-192x192.png');

    await sharp(SOURCE_IMAGE)
      .resize(512, 512, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(PUBLIC_DIR, 'icon-512x512.png'));
    console.log('✓ Generated icon-512x512.png');

    // Generate Apple Touch Icon
    await sharp(SOURCE_IMAGE)
      .resize(180, 180, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));
    console.log('✓ Generated apple-touch-icon.png');

    // Generate favicon (32x32 PNG, browsers will handle it)
    await sharp(SOURCE_IMAGE)
      .resize(32, 32, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(PUBLIC_DIR, 'favicon.png'));
    console.log('✓ Generated favicon.png');

    // Generate 16x16 favicon
    await sharp(SOURCE_IMAGE)
      .resize(16, 16, { fit: 'cover', position: 'center' })
      .png()
      .toFile(path.join(PUBLIC_DIR, 'favicon-16x16.png'));
    console.log('✓ Generated favicon-16x16.png');

    console.log('\n✅ All icons generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Delete the old favicon.ico from src/app/');
    console.log('2. The new icons will be automatically used by Next.js');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
