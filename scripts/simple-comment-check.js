const mongoose = require('mongoose');
const fs = require('fs');

async function main() {
  try {
    // Load environment manually
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

    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in .env.local');
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Get data
    const albums = await db.collection('albums').countDocuments();
    const comments = await db.collection('comments').countDocuments();

    console.log('\n📊 DATABASE SUMMARY:');
    console.log('===================');
    console.log('Albums:', albums);
    console.log('Standalone Comments:', comments);

    // Get sample data to check structure
    const sampleAlbum = await db.collection('albums').findOne({});
    const sampleComment = await db.collection('comments').findOne({});

    if (sampleAlbum) {
      const hasEmbeddedComments = sampleAlbum.comments && Array.isArray(sampleAlbum.comments);
      console.log('Sample album has embedded comments array:', hasEmbeddedComments);
      if (hasEmbeddedComments) {
        console.log('Sample album embedded comments count:', sampleAlbum.comments.length);
      }
    }

    if (sampleComment) {
      console.log('Sample comment references album:', !!sampleComment.album);
      console.log('Sample comment album ID:', sampleComment.album);
    }

    // Count albums with embedded comments
    const albumsWithEmbedded = await db.collection('albums').countDocuments({
      'comments.0': { $exists: true }
    });

    console.log('Albums with embedded comments:', albumsWithEmbedded);

    if (albumsWithEmbedded > 0) {
      // Get total embedded comment count
      const pipeline = [
        { $match: { 'comments.0': { $exists: true } } },
        { $project: { commentCount: { $size: '$comments' } } },
        { $group: { _id: null, totalEmbedded: { $sum: '$commentCount' } } }
      ];

      const embeddedResult = await db.collection('albums').aggregate(pipeline).toArray();
      const totalEmbedded = embeddedResult[0]?.totalEmbedded || 0;

      console.log('Total embedded comments:', totalEmbedded);

      console.log('\n🔧 ISSUE DETECTED:');
      console.log('You have', totalEmbedded, 'embedded comments that should be migrated to standalone Comment documents');
    }

    // Check for orphaned standalone comments
    const albumIds = await db.collection('albums').distinct('_id');
    const albumIdStrings = albumIds.map(id => id.toString());

    const orphanedComments = await db.collection('comments').find({
      album: { $nin: albumIds }
    }).toArray();

    if (orphanedComments.length > 0) {
      console.log('\n⚠️ ORPHANED COMMENTS FOUND:');
      console.log(orphanedComments.length, 'comments reference non-existent albums');
      orphanedComments.forEach(comment => {
        console.log(`Comment ${comment._id} -> Album ${comment.album}`);
      });
    }

    console.log('\n✅ Analysis complete');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);