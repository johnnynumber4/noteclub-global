#!/usr/bin/env node

/**
 * Simple wrapper to run comment analysis using Next.js environment
 */

const { exec } = require('child_process');
const path = require('path');

// Run the analysis using Next.js env loading
const scriptPath = path.join(__dirname, 'comment-analysis-core.js');
const command = `cd "${path.dirname(__dirname)}" && node -e "
const mongoose = require('mongoose');

async function loadEnv() {
  // Load Next.js env vars manually
  const fs = require('fs');
  try {
    const envLocal = fs.readFileSync('.env.local', 'utf8');
    envLocal.split('\\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        const value = valueParts.join('=').replace(/^\"|\"$/g, '');
        if (value) process.env[key.trim()] = value.trim();
      }
    });
  } catch (e) {
    console.log('Could not load .env.local');
  }
}

async function run() {
  await loadEnv();

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI not found');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Get collections
    const albums = await db.collection('albums').find({}).toArray();
    const comments = await db.collection('comments').find({}).toArray();

    console.log('\\n📊 ANALYSIS RESULTS:');
    console.log('=====================');
    console.log(\`Albums: \${albums.length}\`);
    console.log(\`Standalone Comments: \${comments.length}\`);

    // Count embedded comments
    let embeddedCount = 0;
    albums.forEach(album => {
      if (album.comments && album.comments.length > 0) {
        embeddedCount += album.comments.length;
      }
    });
    console.log(\`Embedded Comments: \${embeddedCount}\`);

    // Check for orphaned comments
    const albumIds = new Set(albums.map(a => a._id.toString()));
    const orphaned = comments.filter(c => !albumIds.has(c.album.toString()));
    console.log(\`Orphaned Comments: \${orphaned.length}\`);

    if (orphaned.length > 0) {
      console.log('\\n⚠️  Orphaned comments found:');
      orphaned.forEach(c => {
        console.log(\`   - \${c._id} -> album \${c.album}\`);
      });
    }

    // Check for mixed comment systems
    let mixed = 0;
    for (const album of albums) {
      const standalone = comments.filter(c => c.album.toString() === album._id.toString()).length;
      const embedded = album.comments ? album.comments.length : 0;
      if (standalone > 0 && embedded > 0) {
        mixed++;
        console.log(\`\\n📝 Mixed comments in \"\${album.title}\":\`);
        console.log(\`   Standalone: \${standalone}, Embedded: \${embedded}\`);
      }
    }

    console.log(\`\\nAlbums with mixed comment systems: \${mixed}\`);

    if (embeddedCount > 0 || orphaned.length > 0) {
      console.log('\\n🔧 RECOMMENDED ACTIONS:');
      if (embeddedCount > 0) {
        console.log(\`   - Migrate \${embeddedCount} embedded comments to standalone\`);
      }
      if (orphaned.length > 0) {
        console.log(\`   - Remove \${orphaned.length} orphaned comments\`);
      }
    } else {
      console.log('\\n✅ All comments are properly organized!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch(console.error);
"`;

console.log('🔍 Running comment-album analysis...\n');

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error running analysis:', error.message);
    return;
  }

  if (stderr) {
    console.error('⚠️ Warnings:', stderr);
  }

  console.log(stdout);
});