#!/usr/bin/env node

/**
 * Script to restore original loosey-goosey themes for migrated albums
 *
 * This script:
 * 1. Reads the original posts.json export to get the theme data
 * 2. Creates Theme documents for each unique theme title
 * 3. Updates Album documents to reference the correct themes instead of "migrated album"
 */

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

async function connectToMongoDB() {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/note-club-modern';
  await mongoose.connect(mongoUri);
  console.log('✅ Connected to MongoDB');
}

async function loadOriginalPosts() {
  const postsPath = path.join(__dirname, '..', 'exports', 'posts.json');
  const postsData = await fs.readFile(postsPath, 'utf8');
  return JSON.parse(postsData);
}

async function restoreOriginalThemes() {
  try {
    console.log('🎨 Starting restoration of original themes...');

    await connectToMongoDB();

    // Define schemas inline (since we can't import ES modules in CommonJS)
    const albumSchema = new mongoose.Schema({
      title: { type: String, required: true },
      artist: { type: String, required: true },
      year: Number,
      genre: String,
      description: String,
      group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
      theme: { type: mongoose.Schema.Types.ObjectId, ref: 'Theme' },
      postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      postedAt: { type: Date, default: Date.now },
      spotifyUrl: String,
      youtubeMusicUrl: String,
      appleMusicUrl: String,
      tidalUrl: String,
      deezerUrl: String,
      coverImageUrl: String,
      wikipediaUrl: String,
      wikipediaDescription: String,
      trackCount: Number,
      duration: Number,
      label: String,
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      comments: [],
      isApproved: { type: Boolean, default: true },
      isHidden: { type: Boolean, default: false },
      moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      moderatedAt: Date,
      turnNumber: { type: Number, required: true, min: 1 }
    }, { timestamps: true });

    const themeSchema = new mongoose.Schema({
      title: { type: String, required: true, trim: true, maxlength: 100 },
      description: { type: String, required: true, trim: true, maxlength: 1000 },
      startDate: Date,
      endDate: Date,
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      isActive: { type: Boolean, default: false },
      guidelines: { type: String, trim: true, maxlength: 2000 },
      examples: [{ type: String, trim: true, maxlength: 200 }],
      imageUrl: String,
      albumCount: { type: Number, default: 0, min: 0 },
      participantCount: { type: Number, default: 0, min: 0 },
      currentTurn: { type: Number, default: 1, min: 1 },
      maxTurns: { type: Number, min: 1 }
    }, { timestamps: true });

    const userSchema = new mongoose.Schema({
      name: String,
      email: String,
      username: String
    });

    // Get or create models
    const Album = mongoose.models.Album || mongoose.model('Album', albumSchema);
    const Theme = mongoose.models.Theme || mongoose.model('Theme', themeSchema);
    const User = mongoose.models.User || mongoose.model('User', userSchema);

    // Load original posts data
    console.log('📚 Loading original posts data...');
    const originalPosts = await loadOriginalPosts();
    console.log(`   Found ${originalPosts.length} original posts`);

    // Get a user to assign as theme creator (we'll use the first user)
    const defaultUser = await User.findOne({});
    if (!defaultUser) {
      throw new Error('No users found in database. Please create a user first.');
    }

    // Extract unique themes from original posts
    const themeMap = new Map();
    const postsWithThemes = originalPosts.filter(post => post.theme && post.theme !== null);

    console.log(`📊 Found ${postsWithThemes.length} posts with themes`);

    for (const post of postsWithThemes) {
      const themeTitle = post.theme.trim();
      if (!themeMap.has(themeTitle)) {
        themeMap.set(themeTitle, {
          title: themeTitle,
          posts: []
        });
      }
      themeMap.get(themeTitle).posts.push(post);
    }

    console.log(`🎯 Found ${themeMap.size} unique themes to create`);

    // Create Theme documents for each unique theme
    const createdThemes = new Map(); // title -> Theme document
    let themesCreated = 0;
    let themesSkipped = 0;

    for (const [themeTitle, themeData] of themeMap) {
      try {
        // Check if theme already exists
        const existingTheme = await Theme.findOne({ title: themeTitle });

        if (existingTheme) {
          console.log(`   ⏭️  Theme "${themeTitle}" already exists, skipping`);
          createdThemes.set(themeTitle, existingTheme);
          themesSkipped++;
          continue;
        }

        // Create new theme
        const newTheme = new Theme({
          title: themeTitle,
          description: `Original loosey-goosey theme: "${themeTitle}" (${themeData.posts.length} albums)`,
          createdBy: defaultUser._id,
          isActive: false, // These are historical themes
          guidelines: `This was an original theme from the previous version of Note Club where users could write anything they wanted.`,
          albumCount: themeData.posts.length,
          participantCount: new Set(themeData.posts.map(p => p.author)).size,
          currentTurn: 1
        });

        await newTheme.save();
        createdThemes.set(themeTitle, newTheme);
        themesCreated++;

        console.log(`   ✅ Created theme "${themeTitle}" (${themeData.posts.length} albums)`);

      } catch (error) {
        console.error(`   ❌ Error creating theme "${themeTitle}":`, error.message);
      }
    }

    console.log(`\n📈 Theme creation summary:`);
    console.log(`   ✅ Created: ${themesCreated} themes`);
    console.log(`   ⏭️  Skipped: ${themesSkipped} themes (already existed)`);

    // Now update Album documents to reference the correct themes
    console.log(`\n🔄 Updating albums to reference correct themes...`);

    let albumsUpdated = 0;
    let albumsNotFound = 0;
    let albumsWithoutTheme = 0;

    for (const post of postsWithThemes) {
      try {
        const themeTitle = post.theme.trim();
        const theme = createdThemes.get(themeTitle);

        if (!theme) {
          console.log(`   ⚠️  No theme found for "${themeTitle}"`);
          continue;
        }

        // Find the corresponding album by matching title and artist
        const album = await Album.findOne({
          title: post.albumTitle,
          artist: post.albumArtist,
          // Also match the creation date to be more precise
          postedAt: {
            $gte: new Date(new Date(post.createdAt).getTime() - 60000), // 1 minute before
            $lte: new Date(new Date(post.createdAt).getTime() + 60000)  // 1 minute after
          }
        });

        if (!album) {
          console.log(`   🔍 Album not found: "${post.albumTitle}" by ${post.albumArtist}`);
          albumsNotFound++;
          continue;
        }

        // Update the album's theme reference
        album.theme = theme._id;
        await album.save();

        albumsUpdated++;
        console.log(`   ✅ Updated "${album.title}" by ${album.artist} -> theme: "${themeTitle}"`);

      } catch (error) {
        console.error(`   ❌ Error updating album "${post.albumTitle}":`, error.message);
      }
    }

    // Count albums without themes (should be the null theme ones)
    const albumsWithoutThemes = await Album.countDocuments({
      $or: [
        { theme: null },
        { theme: { $exists: false } }
      ]
    });

    console.log(`\n📊 Album update summary:`);
    console.log(`   ✅ Updated: ${albumsUpdated} albums`);
    console.log(`   🔍 Not found: ${albumsNotFound} albums`);
    console.log(`   ⚪ Still without theme: ${albumsWithoutThemes} albums`);

    // Update theme statistics
    console.log(`\n📊 Updating theme statistics...`);
    for (const [themeTitle, theme] of createdThemes) {
      const albumCount = await Album.countDocuments({ theme: theme._id });
      const albumsWithTheme = await Album.find({ theme: theme._id }).populate('postedBy');
      const participantCount = new Set(albumsWithTheme.map(a => a.postedBy?._id?.toString()).filter(Boolean)).size;

      await Theme.updateOne(
        { _id: theme._id },
        {
          $set: {
            albumCount: albumCount,
            participantCount: participantCount
          }
        }
      );
    }

    console.log('\n🎉 Theme restoration completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   🎨 ${themesCreated} new themes created`);
    console.log(`   🔄 ${albumsUpdated} albums updated with correct themes`);
    console.log(`   ⚪ ${albumsWithoutThemes} albums still without themes (originally had null theme)`);

    if (albumsNotFound > 0) {
      console.log(`\n⚠️  Note: ${albumsNotFound} albums couldn't be matched and updated.`);
      console.log(`   This might be due to slight differences in titles/artists or timing.`);
      console.log(`   You may want to manually review these cases.`);
    }

  } catch (error) {
    console.error('💥 Theme restoration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Helper function to show what themes would be created (dry run)
async function showThemePreview() {
  try {
    console.log('🔍 Preview of themes that would be created...');

    const originalPosts = await loadOriginalPosts();
    const themeMap = new Map();
    const postsWithThemes = originalPosts.filter(post => post.theme && post.theme !== null);

    for (const post of postsWithThemes) {
      const themeTitle = post.theme.trim();
      if (!themeMap.has(themeTitle)) {
        themeMap.set(themeTitle, {
          title: themeTitle,
          posts: []
        });
      }
      themeMap.get(themeTitle).posts.push(post);
    }

    console.log(`\nFound ${themeMap.size} unique themes:`);
    console.log('='.repeat(50));

    // Sort by post count descending
    const sortedThemes = Array.from(themeMap.entries()).sort((a, b) => b[1].posts.length - a[1].posts.length);

    for (const [themeTitle, themeData] of sortedThemes) {
      console.log(`📌 "${themeTitle}" (${themeData.posts.length} albums)`);
    }

  } catch (error) {
    console.error('❌ Preview failed:', error);
  }
}

// Run the script
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--preview')) {
    showThemePreview();
  } else {
    restoreOriginalThemes().catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
  }
}

module.exports = { restoreOriginalThemes, showThemePreview };