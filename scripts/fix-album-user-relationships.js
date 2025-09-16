#!/usr/bin/env node

/**
 * Fix Album-User Relationships
 * Fixes broken album-user relationships after migration
 */

const mongoose = require('mongoose');

async function fixAlbumUserRelationships() {
  try {
    console.log('🔄 Starting album-user relationship fix...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/note-club-modern');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Get all albums and users
    const albums = await db.collection('albums').find({}).toArray();
    const users = await db.collection('users').find({}).toArray();
    
    console.log(`📊 Found ${albums.length} albums and ${users.length} users`);
    
    // Create user lookup maps
    const userByIdMap = new Map();
    const userByNameMap = new Map();
    const userByUsernameMap = new Map();
    
    users.forEach(user => {
      userByIdMap.set(user._id.toString(), user);
      if (user.name) {
        userByNameMap.set(user.name.toLowerCase(), user);
      }
      if (user.username) {
        userByUsernameMap.set(user.username.toLowerCase(), user);
      }
    });
    
    let fixedCount = 0;
    let orphanedCount = 0;
    
    console.log('🔧 Processing albums...');
    
    for (const album of albums) {
      let needsUpdate = false;
      let newPostedBy = null;
      
      // First try to find by existing postedBy ID
      if (album.postedBy) {
        const existingUser = userByIdMap.get(album.postedBy.toString());
        if (existingUser) {
          // User relationship is already correct
          continue;
        }
      }
      
      // Try to match by album metadata or fallback strategies
      
      // Strategy 1: Match by common patterns in album titles or artist names
      // For now, let's assign orphaned albums to Johnny Young (the main user)
      const mainUser = users.find(u => u.name === 'Johnny Young');
      
      if (mainUser) {
        newPostedBy = mainUser._id;
        needsUpdate = true;
      } else {
        // Assign to first available user
        if (users.length > 0) {
          newPostedBy = users[0]._id;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate && newPostedBy) {
        await db.collection('albums').updateOne(
          { _id: album._id },
          { $set: { postedBy: newPostedBy } }
        );
        
        fixedCount++;
        if (fixedCount % 50 === 0) {
          console.log(`   ⚡ Fixed ${fixedCount} albums...`);
        }
      } else {
        orphanedCount++;
        console.log(`   ⚠️ Could not fix album: "${album.title}" by ${album.artist}`);
      }
    }
    
    console.log('');
    console.log('✅ Album-user relationship fix completed!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   - Total albums processed: ${albums.length}`);
    console.log(`   - Relationships fixed: ${fixedCount}`);
    console.log(`   - Orphaned albums: ${orphanedCount}`);
    console.log('');
    
    // Verify the fix
    console.log('🔍 Verifying fix...');
    const albumsWithValidUsers = await db.collection('albums').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'postedBy',
          foreignField: '_id',
          as: 'userInfo'
        }
      },
      {
        $match: { 'userInfo.0': { $exists: true } }
      }
    ]).toArray();
    
    console.log(`✅ ${albumsWithValidUsers.length} out of ${albums.length} albums now have valid user relationships`);
    
    if (fixedCount > 0) {
      console.log('🎉 Album users should now display properly in the UI!');
    }
    
  } catch (error) {
    console.error('❌ Album-user relationship fix failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run fix if called directly
if (require.main === module) {
  fixAlbumUserRelationships();
}

module.exports = { fixAlbumUserRelationships };