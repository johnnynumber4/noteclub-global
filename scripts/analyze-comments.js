/**
 * Simple script to analyze comment-album relationships
 * Uses direct MongoDB queries to avoid TypeScript import issues
 */

const mongoose = require('mongoose');

// Try to load environment variables
try {
  require('dotenv').config({ path: '.env.local' });
} catch (error) {
  // If dotenv is not available, manually load from .env.local
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');

    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
      }
    });
  } catch (envError) {
    console.log('Note: Could not load .env.local file');
  }
}

async function connectDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // Clean up the URI to handle parsing issues
    const mongoUri = process.env.MONGODB_URI.trim();
    console.log('Connecting to MongoDB...');

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.log('URI length:', process.env.MONGODB_URI?.length || 0);
    process.exit(1);
  }
}

async function analyzeComments() {
  console.log('\n🔍 ANALYZING COMMENT-ALBUM RELATIONSHIPS\n');

  // Get collections directly
  const albumsCollection = mongoose.connection.db.collection('albums');
  const commentsCollection = mongoose.connection.db.collection('comments');

  // Get all albums
  const albums = await albumsCollection.find({}).toArray();
  console.log(`📚 Found ${albums.length} albums`);

  // Get all standalone comments
  const standaloneComments = await commentsCollection.find({}).toArray();
  console.log(`💬 Found ${standaloneComments.length} standalone comments`);

  // Count embedded comments
  let totalEmbeddedComments = 0;
  let albumsWithEmbeddedComments = 0;

  albums.forEach(album => {
    if (album.comments && album.comments.length > 0) {
      totalEmbeddedComments += album.comments.length;
      albumsWithEmbeddedComments++;
    }
  });

  console.log(`📝 Found ${totalEmbeddedComments} embedded comments in ${albumsWithEmbeddedComments} albums`);

  // Check for orphaned standalone comments
  console.log('\n🔍 Checking for orphaned standalone comments...');
  const albumIds = new Set(albums.map(album => album._id.toString()));
  const orphanedComments = standaloneComments.filter(comment =>
    !albumIds.has(comment.album.toString())
  );

  if (orphanedComments.length > 0) {
    console.log(`⚠️  Found ${orphanedComments.length} orphaned standalone comments:`);
    orphanedComments.forEach(comment => {
      console.log(`   - Comment ${comment._id} references non-existent album ${comment.album}`);
      console.log(`     Content: "${comment.content.substring(0, 100)}..."`);
    });
  } else {
    console.log('✅ No orphaned standalone comments found');
  }

  // Check for albums with both comment types
  console.log('\n🔍 Checking for albums with both embedded and standalone comments...');
  let albumsWithMixedComments = 0;
  const mixedAlbums = [];

  for (const album of albums) {
    const albumId = album._id.toString();
    const standaloneCount = standaloneComments.filter(c => c.album.toString() === albumId).length;
    const embeddedCount = album.comments ? album.comments.length : 0;

    if (standaloneCount > 0 && embeddedCount > 0) {
      albumsWithMixedComments++;
      mixedAlbums.push({
        id: albumId,
        title: album.title,
        artist: album.artist,
        standalone: standaloneCount,
        embedded: embeddedCount
      });
    }
  }

  if (mixedAlbums.length > 0) {
    console.log(`⚠️  Found ${mixedAlbums.length} albums with mixed comment systems:`);
    mixedAlbums.forEach(album => {
      console.log(`   - "${album.title}" by ${album.artist}:`);
      console.log(`     ${album.standalone} standalone + ${album.embedded} embedded comments`);
    });
  } else {
    console.log('✅ No albums with mixed comment systems found');
  }

  // Check comment distribution by album
  console.log('\n📊 Comment distribution analysis:');
  const albumCommentCounts = albums.map(album => {
    const albumId = album._id.toString();
    const standaloneCount = standaloneComments.filter(c => c.album.toString() === albumId).length;
    const embeddedCount = album.comments ? album.comments.length : 0;
    const totalCount = standaloneCount + embeddedCount;

    return {
      title: album.title,
      artist: album.artist,
      standalone: standaloneCount,
      embedded: embeddedCount,
      total: totalCount
    };
  }).filter(album => album.total > 0).sort((a, b) => b.total - a.total);

  console.log(`Albums with comments (showing top 10):`);
  albumCommentCounts.slice(0, 10).forEach(album => {
    console.log(`   - "${album.title}" by ${album.artist}: ${album.total} total (${album.standalone} standalone, ${album.embedded} embedded)`);
  });

  // Summary report
  console.log('\n📊 SUMMARY REPORT:');
  console.log('=====================================');
  console.log(`Albums: ${albums.length}`);
  console.log(`Albums with comments: ${albumCommentCounts.length}`);
  console.log(`Standalone Comments: ${standaloneComments.length}`);
  console.log(`Embedded Comments: ${totalEmbeddedComments}`);
  console.log(`Total Comments: ${standaloneComments.length + totalEmbeddedComments}`);
  console.log(`Orphaned Comments: ${orphanedComments.length}`);
  console.log(`Albums with Mixed Comment Systems: ${albumsWithMixedComments}`);

  if (orphanedComments.length > 0 || totalEmbeddedComments > 0) {
    console.log('\n🔧 RECOMMENDATIONS:');
    if (totalEmbeddedComments > 0) {
      console.log(`   - Migrate ${totalEmbeddedComments} embedded comments to standalone Comment documents`);
    }
    if (orphanedComments.length > 0) {
      console.log(`   - Clean up ${orphanedComments.length} orphaned comments`);
    }
  } else {
    console.log('\n✅ All comments are properly organized!');
  }

  return {
    albums: albums.length,
    standaloneComments: standaloneComments.length,
    embeddedComments: totalEmbeddedComments,
    orphanedComments: orphanedComments.length,
    mixedCommentAlbums: albumsWithMixedComments
  };
}

async function main() {
  await connectDB();

  try {
    const results = await analyzeComments();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { analyzeComments };