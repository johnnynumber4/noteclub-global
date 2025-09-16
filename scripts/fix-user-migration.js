#!/usr/bin/env node

/**
 * User Migration Fix Script
 * Fixes user data for those showing as "Unknown" in the UI
 * Ensures proper username generation and data structure
 */

const mongoose = require('mongoose');

async function fixUserMigration() {
  try {
    console.log('🔄 Starting user migration fix...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/note-club-modern');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Find users with missing or invalid data
    const usersToFix = await db.collection('users').find({
      $or: [
        { username: { $exists: false } },
        { username: { $eq: null } },
        { username: { $eq: "" } },
        { name: { $exists: false } },
        { name: { $eq: null } },
        { name: { $eq: "" } },
        { turnOrder: { $exists: false } }
      ]
    }).toArray();
    
    console.log(`📋 Found ${usersToFix.length} users to fix`);
    
    for (const user of usersToFix) {
      const updates = {};
      
      // Generate username from name or email if missing
      if (!user.username || user.username === "") {
        let baseUsername = '';
        
        if (user.name && user.name.trim() !== "") {
          // Generate username from name
          baseUsername = user.name.toLowerCase()
            .replace(/\s+/g, '') // Remove spaces
            .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
            .substring(0, 20); // Max length
        } else if (user.email) {
          // Generate username from email local part
          baseUsername = user.email.split('@')[0]
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
            .substring(0, 20); // Max length
        } else {
          baseUsername = 'user';
        }
        
        // Ensure uniqueness
        let username = baseUsername;
        let counter = 1;
        
        while (await db.collection('users').findOne({ username, _id: { $ne: user._id } })) {
          username = `${baseUsername}${counter}`;
          counter++;
        }
        
        updates.username = username;
        console.log(`  📝 Generated username: ${username} for ${user.name || user.email}`);
      }
      
      // Fix missing name
      if (!user.name || user.name.trim() === "") {
        if (user.email) {
          // Generate name from email if missing
          const emailLocal = user.email.split('@')[0];
          const capitalizedName = emailLocal
            .split(/[._-]/)
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
          updates.name = capitalizedName;
          console.log(`  📝 Generated name: ${capitalizedName} from email`);
        } else {
          updates.name = 'User';
        }
      }
      
      // Fix missing turnOrder
      if (!user.turnOrder) {
        const maxTurnOrder = await db.collection('users').findOne(
          {},
          { sort: { turnOrder: -1 } }
        );
        updates.turnOrder = (maxTurnOrder?.turnOrder || 0) + 1;
      }
      
      // Ensure other required fields exist
      if (typeof user.favoriteGenres === 'undefined') {
        updates.favoriteGenres = [];
      }
      
      if (typeof user.musicPlatforms === 'undefined') {
        updates.musicPlatforms = {};
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
        updates.isVerified = true; // Migrated users are considered verified
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
      
      // Apply updates
      if (Object.keys(updates).length > 0) {
        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: updates }
        );
        console.log(`  ✅ Fixed user: ${updates.name || user.name} (${updates.username || user.username})`);
      }
    }
    
    // Now update turn order based on alphabetical username order
    console.log('🔄 Updating turn order based on alphabetical username order...');
    const allUsers = await db.collection('users').find({}, { sort: { username: 1 } }).toArray();
    
    for (let i = 0; i < allUsers.length; i++) {
      const user = allUsers[i];
      const newTurnOrder = i + 1;
      
      if (user.turnOrder !== newTurnOrder) {
        await db.collection('users').updateOne(
          { _id: user._id },
          { $set: { turnOrder: newTurnOrder } }
        );
        console.log(`  📊 Updated turn order: ${user.username} -> ${newTurnOrder}`);
      }
    }
    
    // Update album counts for all users
    console.log('📊 Updating album counts for all users...');
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
    
    console.log('✅ User migration fix completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   - Fixed ${usersToFix.length} user(s)`);
    console.log(`   - Updated turn order for ${allUsers.length} user(s)`);
    console.log(`   - Updated album counts for users with posts`);
    console.log('');
    console.log('🎉 Users should no longer show as "Unknown" in the UI!');
    
  } catch (error) {
    console.error('❌ User migration fix failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run fix if called directly
if (require.main === module) {
  fixUserMigration();
}

module.exports = { fixUserMigration };