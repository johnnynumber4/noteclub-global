const mongoose = require('mongoose');
const fs = require('fs');

async function loadEnv() {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const lines = envContent.split('\n');

  for (const line of lines) {
    if (line.includes('=') && !line.startsWith('#')) {
      const equalIndex = line.indexOf('=');
      const key = line.substring(0, equalIndex).trim();
      const value = line.substring(equalIndex + 1).trim().replace(/^["']|["']$/g, '');
      if (key && value) {
        process.env[key] = value;
      }
    }
  }
}

async function main() {
  try {
    await loadEnv();
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Get all albums sorted by creation/posting date
    const albums = await db.collection('albums').find({})
      .sort({ createdAt: -1, postedAt: -1 })
      .limit(20)
      .toArray();

    console.log('📊 RECENT ALBUMS ANALYSIS');
    console.log('=========================\n');

    console.log('🕒 Most recent 20 albums:');
    albums.forEach((album, idx) => {
      const postedDate = album.postedAt ? album.postedAt.toISOString().split('T')[0] : 'No date';
      const createdDate = album.createdAt ? album.createdAt.toISOString().split('T')[0] : 'No date';

      console.log(`${idx + 1}. "${album.title}" by ${album.artist}`);
      console.log(`   Posted: ${postedDate}, Created: ${createdDate}`);
      console.log(`   ID: ${album._id}`);

      // Check for potential migration indicators
      const hasEmbeddedComments = album.comments && album.comments.length > 0;
      const hasOldStructure = !album.group || !album.turnNumber;

      if (hasEmbeddedComments || hasOldStructure) {
        console.log(`   ⚠️  May need migration: ${hasEmbeddedComments ? 'embedded comments' : ''} ${hasOldStructure ? 'missing group/turn' : ''}`);
      }
      console.log('');
    });

    // Check for albums that might need migration
    const albumsWithEmbeddedComments = await db.collection('albums').countDocuments({
      'comments.0': { $exists: true }
    });

    const albumsMissingGroup = await db.collection('albums').countDocuments({
      group: { $exists: false }
    });

    const albumsMissingTurn = await db.collection('albums').countDocuments({
      turnNumber: { $exists: false }
    });

    console.log('🔍 MIGRATION STATUS CHECK:');
    console.log('==========================');
    console.log(`Albums with embedded comments: ${albumsWithEmbeddedComments}`);
    console.log(`Albums missing group field: ${albumsMissingGroup}`);
    console.log(`Albums missing turnNumber field: ${albumsMissingTurn}`);

    // Look for very recent albums (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentAlbums = await db.collection('albums').find({
      $or: [
        { createdAt: { $gte: sevenDaysAgo } },
        { postedAt: { $gte: sevenDaysAgo } }
      ]
    }).sort({ createdAt: -1 }).toArray();

    if (recentAlbums.length > 0) {
      console.log(`\n🆕 Albums from last 7 days (${recentAlbums.length}):`);
      recentAlbums.forEach((album, idx) => {
        const date = (album.createdAt || album.postedAt).toISOString().split('T')[0];
        console.log(`${idx + 1}. "${album.title}" by ${album.artist} (${date})`);

        // Check if needs migration
        const needsMigration = !album.group || !album.turnNumber || (album.comments && album.comments.length > 0);
        if (needsMigration) {
          console.log(`   🚨 NEEDS MIGRATION!`);
        } else {
          console.log(`   ✅ Already migrated`);
        }
      });
    } else {
      console.log('\n✅ No albums found in the last 7 days');
    }

    // Check comment status for recent albums
    console.log('\n💬 COMMENT STATUS:');
    console.log('==================');

    for (const album of recentAlbums.slice(0, 5)) {
      const embeddedCount = album.comments ? album.comments.length : 0;
      const standaloneCount = await db.collection('comments').countDocuments({ album: album._id });

      console.log(`"${album.title}": ${embeddedCount} embedded, ${standaloneCount} standalone comments`);

      if (embeddedCount > 0) {
        console.log(`  ⚠️  Has ${embeddedCount} embedded comments that need migration!`);
      }
    }

    console.log('\n📋 NEXT STEPS:');
    console.log('==============');

    if (albumsWithEmbeddedComments > 0) {
      console.log(`• Migrate ${albumsWithEmbeddedComments} albums with embedded comments`);
    }

    if (albumsMissingGroup > 0 || albumsMissingTurn > 0) {
      console.log(`• Add missing group/turn fields to albums`);
    }

    if (recentAlbums.some(a => !a.group || !a.turnNumber || (a.comments && a.comments.length > 0))) {
      console.log(`• Focus on recent albums that need migration`);
    } else {
      console.log('✅ All recent albums appear to be properly migrated!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);