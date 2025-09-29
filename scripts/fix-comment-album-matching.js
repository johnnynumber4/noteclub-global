/**
 * Script to analyze and fix comment-album matching issues
 *
 * This script handles the dual comment system:
 * 1. Standalone Comment documents that reference albums
 * 2. Embedded comments stored directly in Album documents
 */

const mongoose = require('mongoose');

// Load environment variables
try {
  require('dotenv').config();
} catch (error) {
  // dotenv not available, continue without it
  console.log('Note: dotenv not available, using environment variables directly');
}

// Import models - handle both CommonJS and ES module exports
let Album, Comment;

async function loadModels() {
  try {
    // Try dynamic import for ES modules
    const albumModule = await import('../src/models/Album.ts');
    const commentModule = await import('../src/models/Comment.ts');

    Album = albumModule.default;
    Comment = commentModule.default;
  } catch (error) {
    // Fallback to require
    try {
      Album = require('../src/models/Album.ts').default || require('../src/models/Album.ts');
      Comment = require('../src/models/Comment.ts').default || require('../src/models/Comment.ts');
    } catch (requireError) {
      console.error('Failed to load models:', requireError);
      throw requireError;
    }
  }
}

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function analyzeCommentAlbumMatching() {
  console.log('\n🔍 Analyzing comment-album relationships...\n');

  // Get all albums with their embedded comments
  const albums = await Album.find({}).lean();
  console.log(`📚 Found ${albums.length} albums`);

  // Get all standalone comments
  const standaloneComments = await Comment.find({}).lean();
  console.log(`💬 Found ${standaloneComments.length} standalone comments`);

  // Count embedded comments
  let totalEmbeddedComments = 0;
  albums.forEach(album => {
    if (album.comments && album.comments.length > 0) {
      totalEmbeddedComments += album.comments.length;
    }
  });
  console.log(`📝 Found ${totalEmbeddedComments} embedded comments`);

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
    });
  } else {
    console.log('✅ No orphaned standalone comments found');
  }

  // Check albums with both embedded and standalone comments
  console.log('\n🔍 Checking for albums with mixed comment systems...');
  let albumsWithMixedComments = 0;

  for (const album of albums) {
    const albumId = album._id.toString();
    const standaloneCount = standaloneComments.filter(c => c.album.toString() === albumId).length;
    const embeddedCount = album.comments ? album.comments.length : 0;

    if (standaloneCount > 0 && embeddedCount > 0) {
      albumsWithMixedComments++;
      console.log(`   - Album "${album.title}" has ${standaloneCount} standalone + ${embeddedCount} embedded comments`);
    }
  }

  if (albumsWithMixedComments === 0) {
    console.log('✅ No albums with mixed comment systems found');
  }

  // Summary report
  console.log('\n📊 SUMMARY REPORT:');
  console.log(`Albums: ${albums.length}`);
  console.log(`Standalone Comments: ${standaloneComments.length}`);
  console.log(`Embedded Comments: ${totalEmbeddedComments}`);
  console.log(`Orphaned Comments: ${orphanedComments.length}`);
  console.log(`Albums with Mixed Comments: ${albumsWithMixedComments}`);

  return {
    albums,
    standaloneComments,
    orphanedComments,
    totalEmbeddedComments,
    albumsWithMixedComments
  };
}

async function migrateCommentsToStandalone() {
  console.log('\n🔄 Migrating embedded comments to standalone Comment documents...\n');

  const albums = await Album.find({ 'comments.0': { $exists: true } });
  console.log(`Found ${albums.length} albums with embedded comments`);

  let totalMigrated = 0;

  for (const album of albums) {
    if (!album.comments || album.comments.length === 0) continue;

    console.log(`\nMigrating ${album.comments.length} comments from album "${album.title}"`);

    for (const embeddedComment of album.comments) {
      try {
        // Create new standalone comment
        const newComment = new Comment({
          content: embeddedComment.content,
          author: embeddedComment.postedBy,
          album: album._id,
          createdAt: embeddedComment.postedAt || embeddedComment.createdAt || new Date(),
          updatedAt: embeddedComment.postedAt || embeddedComment.createdAt || new Date()
        });

        await newComment.save();
        totalMigrated++;
        console.log(`   ✅ Migrated comment: "${embeddedComment.content.substring(0, 50)}..."`);
      } catch (error) {
        console.error(`   ❌ Failed to migrate comment: ${error.message}`);
      }
    }

    // Clear embedded comments from album
    album.comments = [];
    await album.save();
    console.log(`   🧹 Cleared embedded comments from album`);
  }

  console.log(`\n✅ Migration complete! Migrated ${totalMigrated} comments to standalone documents`);
}

async function fixOrphanedComments() {
  console.log('\n🔧 Fixing orphaned comments...\n');

  const orphanedComments = await Comment.find({});
  const albumIds = new Set((await Album.find({}, '_id')).map(a => a._id.toString()));

  let removedCount = 0;

  for (const comment of orphanedComments) {
    if (!albumIds.has(comment.album.toString())) {
      console.log(`Removing orphaned comment: ${comment._id} (references deleted album ${comment.album})`);
      await Comment.findByIdAndDelete(comment._id);
      removedCount++;
    }
  }

  console.log(`✅ Removed ${removedCount} orphaned comments`);
}

async function main() {
  await loadModels();
  await connectDB();

  try {
    console.log('🎯 COMMENT-ALBUM MATCHING ANALYSIS & FIX');
    console.log('==========================================');

    // First, analyze the current state
    const analysis = await analyzeCommentAlbumMatching();

    // Ask for confirmation before making changes
    if (analysis.totalEmbeddedComments > 0 || analysis.orphanedComments.length > 0) {
      console.log('\n⚠️  Issues found that need fixing:');

      if (analysis.totalEmbeddedComments > 0) {
        console.log(`   - ${analysis.totalEmbeddedComments} embedded comments need migration to standalone`);
      }

      if (analysis.orphanedComments.length > 0) {
        console.log(`   - ${analysis.orphanedComments.length} orphaned comments need cleanup`);
      }

      console.log('\n🔧 Proceeding with fixes...');

      // Migrate embedded comments to standalone
      if (analysis.totalEmbeddedComments > 0) {
        await migrateCommentsToStandalone();
      }

      // Clean up orphaned comments
      if (analysis.orphanedComments.length > 0) {
        await fixOrphanedComments();
      }

      // Run analysis again to confirm fixes
      console.log('\n✅ Re-analyzing after fixes...');
      await analyzeCommentAlbumMatching();
    } else {
      console.log('\n✅ No issues found! All comments are properly matched with albums.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { analyzeCommentAlbumMatching, migrateCommentsToStandalone, fixOrphanedComments };