#!/usr/bin/env node

/**
 * Fix ObjectId Type Mismatches
 * Standardizes all _id fields to proper ObjectId types
 */

const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');

async function fixObjectIdTypes() {
  try {
    console.log('🔄 Starting ObjectId type standardization...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/note-club-modern');
    console.log('✅ Connected to MongoDB');
    
    const db = mongoose.connection.db;
    
    // Fix users collection - convert string _id to ObjectId
    console.log('👥 Fixing user ID types...');
    const users = await db.collection('users').find({}).toArray();
    
    let userUpdates = 0;
    for (const user of users) {
      if (typeof user._id === 'string') {
        try {
          // Create new document with ObjectId
          const objectId = new ObjectId(user._id);
          
          // Insert with ObjectId
          await db.collection('users').insertOne({
            ...user,
            _id: objectId
          });
          
          // Delete old string ID version
          await db.collection('users').deleteOne({ _id: user._id });
          
          userUpdates++;
          console.log(`   ✅ Fixed user: ${user.name} (${user._id} -> ObjectId)`);
        } catch (error) {
          console.log(`   ⚠️ Could not fix user: ${user.name} - ${error.message}`);
        }
      }
    }
    
    // Fix album postedBy references - make sure they're ObjectIds
    console.log('📀 Fixing album postedBy references...');
    const albums = await db.collection('albums').find({}).toArray();
    
    let albumUpdates = 0;
    for (const album of albums) {
      if (album.postedBy && typeof album.postedBy === 'string') {
        try {
          const objectId = new ObjectId(album.postedBy);
          await db.collection('albums').updateOne(
            { _id: album._id },
            { $set: { postedBy: objectId } }
          );
          albumUpdates++;
        } catch (error) {
          console.log(`   ⚠️ Could not fix album: ${album.title} - ${error.message}`);
        }
      }
    }
    
    // Fix theme references in albums
    console.log('🎨 Fixing album theme references...');
    let themeUpdates = 0;
    for (const album of albums) {
      if (album.theme && typeof album.theme === 'string') {
        try {
          const objectId = new ObjectId(album.theme);
          await db.collection('albums').updateOne(
            { _id: album._id },
            { $set: { theme: objectId } }
          );
          themeUpdates++;
        } catch (error) {
          console.log(`   ⚠️ Could not fix theme for album: ${album.title} - ${error.message}`);
        }
      }
    }
    
    console.log('');
    console.log('✅ ObjectId type standardization completed!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   - User ID fixes: ${userUpdates}`);
    console.log(`   - Album postedBy fixes: ${albumUpdates}`);
    console.log(`   - Album theme fixes: ${themeUpdates}`);
    console.log('');
    
    // Verify the fix with a test lookup
    console.log('🔍 Testing user-album relationships...');
    const testResults = await db.collection('albums').aggregate([
      { $limit: 5 },
      { 
        $lookup: {
          from: 'users',
          localField: 'postedBy',
          foreignField: '_id',
          as: 'userInfo'
        }
      }
    ]).toArray();
    
    let successCount = 0;
    testResults.forEach(result => {
      if (result.userInfo.length > 0) {
        successCount++;
        console.log(`   ✅ ${result.title} -> ${result.userInfo[0].name}`);
      } else {
        console.log(`   ❌ ${result.title} -> No user found`);
      }
    });
    
    console.log(`\n🎉 ${successCount} out of ${testResults.length} test albums now have proper user relationships!`);
    
  } catch (error) {
    console.error('❌ ObjectId type fix failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run fix if called directly
if (require.main === module) {
  fixObjectIdTypes();
}

module.exports = { fixObjectIdTypes };