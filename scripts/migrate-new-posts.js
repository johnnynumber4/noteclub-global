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

    console.log('🔄 NEW POSTS MIGRATION (READ-ONLY ANALYSIS FIRST)');
    console.log('==================================================');

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

    // Find the most recent album in current database to determine migration cutoff
    const mostRecentCurrentAlbum = await currentConnection.db.collection('albums')
      .findOne({}, { sort: { createdAt: -1, postedAt: -1 } });

    let cutoffDate = new Date('2025-08-01'); // Default cutoff
    if (mostRecentCurrentAlbum && mostRecentCurrentAlbum.createdAt) {
      cutoffDate = new Date(mostRecentCurrentAlbum.createdAt);
      console.log('Most recent album in current DB:', mostRecentCurrentAlbum.createdAt);
    } else if (mostRecentCurrentAlbum && mostRecentCurrentAlbum.postedAt) {
      cutoffDate = new Date(mostRecentCurrentAlbum.postedAt);
      console.log('Most recent album in current DB:', mostRecentCurrentAlbum.postedAt);
    }

    console.log('Using cutoff date for new posts:', cutoffDate.toISOString());

    // Find posts in legacy that are newer than cutoff
    const newPosts = await legacyConnection.db.collection('posts').find({
      createdAt: { $gt: cutoffDate }
    }).sort({ createdAt: -1 }).toArray();

    console.log('\n🆕 POSTS NEWER THAN CUTOFF:', newPosts.length);

    if (newPosts.length === 0) {
      console.log('No new posts found to migrate.');
    } else {
      console.log('\n📋 Posts to migrate:');
      newPosts.forEach((post, idx) => {
        const date = post.createdAt?.toISOString().split('T')[0] || 'No date';
        console.log((idx + 1) + '. "' + (post.albumTitle || 'No title') + '" by ' + (post.albumArtist || 'No artist') + ' (' + date + ')');
        console.log('   ID:', post._id);
        console.log('   Author:', post.author);
        if (post.spotify) console.log('   Spotify:', post.spotify);
        if (post.yt) console.log('   YouTube:', post.yt);
        console.log('');
      });

      // Show what the migration would do
      console.log('🔄 MIGRATION PLAN:');
      console.log('==================');
      console.log('For each new post, will:');
      console.log('1. Map post fields to album schema:');
      console.log('   • albumTitle → title');
      console.log('   • albumArtist → artist');
      console.log('   • author → postedBy');
      console.log('   • createdAt → postedAt');
      console.log('   • spotify → spotifyUrl');
      console.log('   • yt → youtubeMusicUrl');
      console.log('   • wikiDesc → wikipediaDescription');
      console.log('   • albumArt → coverImageUrl');
      console.log('');
      console.log('2. Add required modern fields:');
      console.log('   • group: [DEFAULT_GROUP_ID]');
      console.log('   • turnNumber: [CALCULATED]');
      console.log('   • comments: [] (empty array)');
      console.log('   • likes: []');
      console.log('   • isApproved: true');
      console.log('   • isHidden: false');

      // Check for new comments
      console.log('\n💬 CHECKING FOR NEW COMMENTS:');
      console.log('==============================');

      const newComments = await legacyConnection.db.collection('comments').find({
        createdAt: { $gt: cutoffDate }
      }).sort({ createdAt: -1 }).toArray();

      console.log('New comments found:', newComments.length);

      if (newComments.length > 0) {
        newComments.forEach((comment, idx) => {
          const date = comment.createdAt?.toISOString().split('T')[0] || 'No date';
          console.log((idx + 1) + '. "' + (comment.content?.substring(0, 50) || 'No content') + '..." (' + date + ')');
          console.log('   Post ID:', comment.postId);
          console.log('   Author:', comment.author);
          console.log('');
        });
      }

      console.log('\n❓ PROCEED WITH MIGRATION?');
      console.log('==========================');
      console.log('This will add ' + newPosts.length + ' new albums and ' + newComments.length + ' new comments.');
      console.log('');
      console.log('⚠️  Before proceeding, we need:');
      console.log('1. Default group ID for new albums');
      console.log('2. Confirmation that these are indeed new posts');
      console.log('');
      console.log('To proceed, modify this script to:');
      console.log('• Set a default group ID');
      console.log('• Enable the migration code (currently read-only)');
    }

    // Check if we have all the latest posts by looking at very recent ones
    const veryRecentPosts = await legacyConnection.db.collection('posts').find({
      createdAt: { $gte: new Date('2025-09-01') }
    }).sort({ createdAt: -1 }).toArray();

    console.log('\n📅 POSTS FROM SEPTEMBER 2025:', veryRecentPosts.length);

    if (veryRecentPosts.length > 0) {
      console.log('Most recent posts in legacy:');
      veryRecentPosts.slice(0, 5).forEach((post, idx) => {
        const date = post.createdAt?.toISOString() || 'No date';
        console.log((idx + 1) + '. "' + (post.albumTitle || 'No title') + '" (' + date + ')');
      });

      console.log('\n🎯 These recent posts definitely need migration!');
    }

    await legacyConnection.close();
    await currentConnection.close();

    console.log('\n✅ Analysis complete - no changes made');
    console.log('Ready to proceed with actual migration when you confirm.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main().catch(console.error);