#!/usr/bin/env node

/**
 * Migration Script: Posts to Albums
 * Migrates existing posts from the old Note Club schema to the new unified Album schema
 */

const mongoose = require('mongoose');

// Old Post Schema (from your repo)
const oldPostSchema = new mongoose.Schema({
  albumTitle: String,
  albumArtist: String,
  wikiDesc: String,
  yt: String,
  spotify: String,
  albumArt: String,
  theme: String,
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: Date
});

// New Album Schema (matching the current codebase)
const newAlbumSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  year: Number,
  genre: String,
  description: String,
  
  // Group and posting info
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  theme: { type: mongoose.Schema.Types.ObjectId, ref: 'Theme' },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  postedAt: { type: Date, default: Date.now },
  
  // Streaming links
  spotifyUrl: String,
  youtubeMusicUrl: String,
  appleMusicUrl: String,
  tidalUrl: String,
  deezerUrl: String,
  
  // Album artwork and info
  coverImageUrl: String,
  wikipediaUrl: String,
  wikipediaDescription: String,
  
  // Album metadata
  trackCount: Number,
  duration: Number,
  label: String,
  
  // Engagement
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [],
  
  // Moderation
  isApproved: { type: Boolean, default: true },
  isHidden: { type: Boolean, default: false },
  
  // Turn tracking
  turnNumber: { type: Number, required: true, min: 1 }
}, {
  timestamps: true
});

const OldPost = mongoose.model('Post', oldPostSchema);
const NewAlbum = mongoose.model('Album', newAlbumSchema);

async function migratePostsToAlbums() {
  try {
    console.log('🚀 Starting migration from Posts to Albums...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/note-club-modern');
    console.log('✅ Connected to MongoDB');
    
    // Find or create default group
    const Group = mongoose.model('Group');
    let defaultGroup = await Group.findOne({ name: 'Note Club' });
    
    if (!defaultGroup) {
      console.log('📝 Creating default group...');
      const User = mongoose.model('User');
      const firstUser = await User.findOne({});
      
      defaultGroup = new Group({
        name: 'Note Club',
        description: 'Migrated from original Note Club posts',
        isPrivate: false,
        inviteCode: 'MIGRATED',
        maxMembers: 1000,
        members: firstUser ? [firstUser._id] : [],
        admins: firstUser ? [firstUser._id] : [],
        createdBy: firstUser ? firstUser._id : null,
        turnOrder: [],
        currentTurnIndex: 0
      });
      
      await defaultGroup.save();
      console.log('✅ Default group created');
    }
    
    // Find or create default theme
    const Theme = mongoose.model('Theme');
    let defaultTheme = await Theme.findOne({ title: 'Random' });
    
    if (!defaultTheme) {
      console.log('📝 Creating default theme...');
      const User = mongoose.model('User');
      const firstUser = await User.findOne({});
      
      defaultTheme = new Theme({
        title: 'Random',
        description: 'Migrated posts from original Note Club',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2030-12-31'),
        createdBy: firstUser ? firstUser._id : new mongoose.Types.ObjectId(),
        isActive: true,
        albumCount: 0,
        participantCount: 0,
        currentTurn: 1
      });
      
      await defaultTheme.save();
      console.log('✅ Default theme created');
    }
    
    // Get all existing posts
    const posts = await OldPost.find({}).populate('author');
    console.log(`📊 Found ${posts.length} posts to migrate`);
    
    if (posts.length === 0) {
      console.log('ℹ️ No posts found to migrate');
      return;
    }
    
    // Track migration stats
    let migrated = 0;
    let errors = 0;
    
    // Migrate each post
    for (const post of posts) {
      try {
        console.log(`📀 Migrating: "${post.albumTitle}" by ${post.albumArtist}`);
        
        // Transform post to album format
        const albumData = {
          title: post.albumTitle || 'Unknown Album',
          artist: post.albumArtist || 'Unknown Artist',
          description: post.wikiDesc || '',
          
          // Links
          youtubeMusicUrl: post.yt || '',
          spotifyUrl: post.spotify || '',
          appleMusicUrl: '', // To be filled later
          
          // Images
          coverImageUrl: post.albumArt || '',
          
          // Wikipedia info
          wikipediaDescription: post.wikiDesc || '',
          
          // Group and user info
          group: defaultGroup._id,
          theme: defaultTheme._id,
          postedBy: post.author || new mongoose.Types.ObjectId(),
          postedAt: post.createdAt || new Date(),
          
          // Default values
          turnNumber: 1,
          isApproved: true,
          isHidden: false,
          likes: [],
          comments: []
        };
        
        // Create new album
        const album = new NewAlbum(albumData);
        await album.save();
        
        migrated++;
        console.log(`   ✅ Migrated successfully`);
        
      } catch (error) {
        errors++;
        console.error(`   ❌ Error migrating post "${post.albumTitle}":`, error.message);
      }
    }
    
    // Update theme stats
    await Theme.updateOne(
      { _id: defaultTheme._id },
      { $set: { albumCount: migrated } }
    );
    
    console.log('\n🎉 Migration completed!');
    console.log(`   ✅ Successfully migrated: ${migrated} albums`);
    console.log(`   ❌ Errors: ${errors} albums`);
    console.log(`   📊 Success rate: ${((migrated / posts.length) * 100).toFixed(1)}%`);
    
    if (migrated > 0) {
      console.log('\n📋 Next steps:');
      console.log('   1. Run the enhancement script to fill missing Apple Music links');
      console.log('   2. Update any existing API endpoints to use the new Album model');
      console.log('   3. Test the unified search with your migrated data');
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migratePostsToAlbums();
}

module.exports = { migratePostsToAlbums };