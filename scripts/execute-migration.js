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

    console.log('🚀 EXECUTING NEW POSTS MIGRATION');
    console.log('=================================');

    // Configuration
    const DEFAULT_GROUP_ID = new mongoose.Types.ObjectId('68b0fa35233b6646089aae89'); // Original Note Club
    const CUTOFF_DATE = new Date('2025-08-28T10:37:06.370Z'); // From previous analysis

    console.log('Default Group ID:', DEFAULT_GROUP_ID);
    console.log('Cutoff Date:', CUTOFF_DATE.toISOString());

    // Connect to both databases
    const legacyUri = 'mongodb://jyoungiv:Duckies1!@cluckbot-shard-00-00.uf3cp.mongodb.net:27017,cluckbot-shard-00-01.uf3cp.mongodb.net:27017,cluckbot-shard-00-02.uf3cp.mongodb.net:27017/<dbname>?ssl=true&replicaSet=atlas-jzzl00-shard-0&authSource=admin&retryWrites=true&w=majority';

    const legacyConnection = mongoose.createConnection(legacyUri);
    const currentConnection = mongoose.createConnection(process.env.MONGODB_URI);

    await Promise.all([
      new Promise((resolve, reject) => {
        legacyConnection.once('open', resolve);
        legacyConnection.once('error', reject);
      }),
      new Promise((resolve, reject) => {
        currentConnection.once('open', resolve);
        currentConnection.once('error', reject);
      })
    ]);

    console.log('✅ Connected to both databases');

    // Get new posts to migrate
    const newPosts = await legacyConnection.db.collection('posts').find({
      createdAt: { $gt: CUTOFF_DATE }
    }).sort({ createdAt: -1 }).toArray();

    console.log('\n🆕 Found', newPosts.length, 'new posts to migrate');

    if (newPosts.length === 0) {
      console.log('No new posts to migrate. Exiting.');
      return;
    }

    // Get the highest turn number for the group to calculate new turn numbers
    const maxTurnAlbum = await currentConnection.db.collection('albums')
      .findOne({ group: DEFAULT_GROUP_ID }, { sort: { turnNumber: -1 } });

    let nextTurnNumber = (maxTurnAlbum?.turnNumber || 0) + 1;
    console.log('Next turn number will start at:', nextTurnNumber);

    console.log('\n🔄 Migrating posts...');

    let successCount = 0;
    let errorCount = 0;

    for (const post of newPosts) {
      try {
        // Map legacy post to modern album schema
        const album = {
          _id: post._id, // Keep original ID
          title: post.albumTitle || 'Unknown Album',
          artist: post.albumArtist || 'Unknown Artist',

          // Group and posting info
          group: DEFAULT_GROUP_ID,
          postedBy: post.author,
          postedAt: post.createdAt,
          turnNumber: nextTurnNumber++,

          // Streaming links
          spotifyUrl: post.spotify || undefined,
          youtubeMusicUrl: post.yt || undefined,

          // Album metadata
          coverImageUrl: post.albumArt || undefined,
          wikipediaDescription: post.wikiDesc || undefined,

          // Engagement (empty initially)
          likes: [],
          comments: [], // Empty array - using standalone comments

          // Moderation
          isApproved: true,
          isHidden: false,

          // Timestamps
          createdAt: post.createdAt,
          updatedAt: post.createdAt
        };

        // Insert into current database
        await currentConnection.db.collection('albums').insertOne(album);

        console.log('✅ Migrated:', album.title, 'by', album.artist);
        successCount++;

      } catch (error) {
        console.log('❌ Failed to migrate post', post._id, ':', error.message);
        errorCount++;
      }
    }

    // Check for any new comments that reference the migrated posts
    console.log('\n💬 Checking for new comments...');

    const postIds = newPosts.map(post => post._id);
    const newComments = await legacyConnection.db.collection('comments').find({
      postId: { $in: postIds }
    }).toArray();

    console.log('Comments referencing new posts:', newComments.length);

    let commentSuccessCount = 0;
    let commentErrorCount = 0;

    for (const comment of newComments) {
      try {
        // Map legacy comment to modern comment schema
        const modernComment = {
          content: comment.content,
          author: comment.author,
          album: comment.postId, // The post ID becomes the album ID

          // Threading support (defaults)
          replies: [],
          depth: 0,

          // Engagement
          likes: [],

          // Moderation
          isHidden: false,
          isEdited: false,

          // Timestamps
          createdAt: comment.createdAt,
          updatedAt: comment.createdAt
        };

        await currentConnection.db.collection('comments').insertOne(modernComment);

        console.log('✅ Migrated comment for album:', comment.postId);
        commentSuccessCount++;

      } catch (error) {
        console.log('❌ Failed to migrate comment', comment._id, ':', error.message);
        commentErrorCount++;
      }
    }

    // Final summary
    console.log('\n🎉 MIGRATION COMPLETE!');
    console.log('======================');
    console.log('Albums:');
    console.log('  ✅ Successfully migrated:', successCount);
    console.log('  ❌ Failed:', errorCount);
    console.log('');
    console.log('Comments:');
    console.log('  ✅ Successfully migrated:', commentSuccessCount);
    console.log('  ❌ Failed:', commentErrorCount);
    console.log('');

    if (successCount > 0) {
      console.log('🎵 New albums added to Note Club:');
      const migratedAlbums = await currentConnection.db.collection('albums')
        .find({
          group: DEFAULT_GROUP_ID,
          turnNumber: { $gte: nextTurnNumber - successCount }
        })
        .sort({ turnNumber: 1 })
        .toArray();

      migratedAlbums.forEach((album, idx) => {
        console.log((idx + 1) + '. "' + album.title + '" by ' + album.artist + ' (Turn #' + album.turnNumber + ')');
      });
    }

    // Verify final counts
    console.log('\n📊 DATABASE VERIFICATION:');
    const finalAlbumCount = await currentConnection.db.collection('albums').countDocuments();
    const finalCommentCount = await currentConnection.db.collection('comments').countDocuments();

    console.log('Total albums now:', finalAlbumCount);
    console.log('Total comments now:', finalCommentCount);

    await legacyConnection.close();
    await currentConnection.close();

    console.log('\n🏁 Migration completed successfully!');
    console.log('New albums from the legacy database have been migrated.');

  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

main().catch(console.error);