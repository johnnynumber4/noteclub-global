#!/usr/bin/env node

/**
 * Data Normalization Script
 * Normalizes migrated data to match the current app's expected schema structure
 */

const mongoose = require('mongoose');

async function normalizeMigratedData() {
  try {
    console.log('🔄 Starting data normalization...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/note-club-modern');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // 1. Normalize Theme structure (name -> title)
    console.log('📝 Normalizing theme structure...');
    const themes = await db.collection('themes').find({ name: { $exists: true }, title: { $exists: false } }).toArray();
    
    for (const theme of themes) {
      await db.collection('themes').updateOne(
        { _id: theme._id },
        { 
          $set: { title: theme.name },
          $unset: { name: 1 }
        }
      );
      console.log(`  ✅ Updated theme: ${theme.name} -> title`);
    }
    
    // 2. Normalize Album structure
    console.log('💿 Normalizing album structure...');
    
    // Find albums with old structure
    const albumsToUpdate = await db.collection('albums').find({
      $or: [
        { links: { $exists: true } },           // Old links structure
        { artwork: { $exists: true } },         // Old artwork structure  
        { author: { $exists: true } },          // Old author field
        { postedBy: { $exists: false } }        // Missing postedBy field
      ]
    }).toArray();
    
    console.log(`  Found ${albumsToUpdate.length} albums to normalize`);
    
    for (const album of albumsToUpdate) {
      const updates = {};
      const unsets = {};
      
      // Normalize streaming links
      if (album.links) {
        if (album.links.spotify) updates.spotifyUrl = album.links.spotify;
        if (album.links.youtubeMusic) updates.youtubeMusicUrl = album.links.youtubeMusic;
        if (album.links.appleMusic) updates.appleMusicUrl = album.links.appleMusic;
        unsets.links = 1;
      }
      
      // Normalize artwork
      if (album.artwork) {
        // Use the largest available image
        const coverImageUrl = album.artwork.large || album.artwork.medium || album.artwork.small;
        if (coverImageUrl) updates.coverImageUrl = coverImageUrl;
        unsets.artwork = 1;
      }
      
      // Normalize user reference (author -> postedBy)
      if (album.author && !album.postedBy) {
        updates.postedBy = album.author;
        unsets.author = 1;
      }
      
      // Ensure required fields exist
      if (!album.postedAt && album.createdAt) {
        updates.postedAt = album.createdAt;
      }
      
      if (!album.turnNumber) {
        updates.turnNumber = 1; // Default turn number
      }
      
      if (!album.isApproved) {
        updates.isApproved = true; // Migrated albums are approved
      }
      
      if (!album.isHidden) {
        updates.isHidden = false;
      }
      
      // Apply updates
      const updateDoc = {};
      if (Object.keys(updates).length > 0) updateDoc.$set = updates;
      if (Object.keys(unsets).length > 0) updateDoc.$unset = unsets;
      
      if (Object.keys(updateDoc).length > 0) {
        await db.collection('albums').updateOne({ _id: album._id }, updateDoc);
        console.log(`  ✅ Updated album: "${album.title}" by ${album.artist}`);
      }
    }
    
    // 3. Ensure Group structure is compatible
    console.log('👥 Normalizing group structure...');
    const groups = await db.collection('groups').find({}).toArray();
    
    for (const group of groups) {
      const updates = {};
      
      // Ensure required fields exist
      if (!group.inviteCode) {
        updates.inviteCode = 'MIGRATED';
      }
      
      if (!group.maxMembers) {
        updates.maxMembers = 1000;
      }
      
      if (!group.allowMemberInvites) {
        updates.allowMemberInvites = true;
      }
      
      if (!group.requireApprovalForAlbums) {
        updates.requireApprovalForAlbums = false;
      }
      
      if (!group.notifyOnNewAlbums) {
        updates.notifyOnNewAlbums = true;
      }
      
      if (!group.totalAlbumsShared) {
        updates.totalAlbumsShared = 0;
      }
      
      if (!group.totalThemes) {
        updates.totalThemes = 0;
      }
      
      if (!group.turnDurationDays) {
        updates.turnDurationDays = 7;
      }
      
      // Normalize member structure if needed
      if (group.members && group.members.length > 0 && typeof group.members[0] === 'object') {
        // Convert complex member objects to simple ObjectId array
        updates.members = group.members.map(m => m.user || m._id || m);
      }
      
      if (Object.keys(updates).length > 0) {
        await db.collection('groups').updateOne({ _id: group._id }, { $set: updates });
        console.log(`  ✅ Updated group: "${group.name}"`);
      }
    }
    
    // 4. Normalize User structure
    console.log('👤 Normalizing user structure...');
    const users = await db.collection('users').find({}).toArray();
    
    for (const user of users) {
      const updates = {};
      
      // Ensure required fields exist with defaults
      if (typeof user.favoriteGenres === 'undefined') {
        updates.favoriteGenres = [];
      }
      
      if (typeof user.musicPlatforms === 'undefined') {
        updates.musicPlatforms = {};
      }
      
      if (typeof user.turnOrder === 'undefined') {
        updates.turnOrder = 1;
      }
      
      if (typeof user.isActive === 'undefined') {
        updates.isActive = true;
      }
      
      if (typeof user.albumsPosted === 'undefined') {
        updates.albumsPosted = 0;
      }
      
      if (typeof user.totalAlbumsPosted === 'undefined') {
        updates.totalAlbumsPosted = 0;
      }
      
      if (typeof user.commentsPosted === 'undefined') {
        updates.commentsPosted = 0;
      }
      
      if (typeof user.likesGiven === 'undefined') {
        updates.likesGiven = 0;
      }
      
      if (typeof user.likesReceived === 'undefined') {
        updates.likesReceived = 0;
      }
      
      if (typeof user.notificationSettings === 'undefined') {
        updates.notificationSettings = {
          newThemes: true,
          turnReminders: true,
          comments: true,
          likes: true,
          emails: true,
        };
      }
      
      if (typeof user.role === 'undefined') {
        updates.role = 'member';
      }
      
      if (typeof user.isVerified === 'undefined') {
        updates.isVerified = true; // Migrated users are verified
      }
      
      if (typeof user.isBanned === 'undefined') {
        updates.isBanned = false;
      }
      
      if (typeof user.joinedAt === 'undefined') {
        updates.joinedAt = user.createdAt || new Date();
      }
      
      if (typeof user.lastActive === 'undefined') {
        updates.lastActive = user.updatedAt || new Date();
      }
      
      // Normalize profile picture -> image
      if (user.profilePicture && !user.image) {
        updates.image = user.profilePicture;
      }
      
      if (Object.keys(updates).length > 0) {
        await db.collection('users').updateOne({ _id: user._id }, { $set: updates });
        console.log(`  ✅ Updated user: "${user.name}"`);
      }
    }
    
    // 5. Update album counts and statistics
    console.log('📊 Updating statistics...');
    
    // Count albums per user and update user stats
    const albumCounts = await db.collection('albums').aggregate([
      { $group: { _id: '$postedBy', count: { $sum: 1 } } }
    ]).toArray();
    
    for (const { _id: userId, count } of albumCounts) {
      if (userId) {
        await db.collection('users').updateOne(
          { _id: userId },
          { 
            $set: { 
              albumsPosted: count,
              totalAlbumsPosted: count 
            } 
          }
        );
      }
    }
    
    console.log('✅ Data normalization completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   - Normalized ${themes.length} theme(s)`);
    console.log(`   - Normalized ${albumsToUpdate.length} album(s)`);  
    console.log(`   - Normalized ${groups.length} group(s)`);
    console.log(`   - Normalized ${users.length} user(s)`);
    console.log('');
    console.log('🎉 Your app should now handle the migrated data properly!');
    
  } catch (error) {
    console.error('❌ Normalization failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run normalization if called directly
if (require.main === module) {
  normalizeMigratedData();
}

module.exports = { normalizeMigratedData };