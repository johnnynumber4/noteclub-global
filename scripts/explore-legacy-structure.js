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

    console.log('🔍 LEGACY DATABASE STRUCTURE ANALYSIS');
    console.log('=====================================');

    const legacyUri = 'mongodb://jyoungiv:Duckies1!@cluckbot-shard-00-00.uf3cp.mongodb.net:27017,cluckbot-shard-00-01.uf3cp.mongodb.net:27017,cluckbot-shard-00-02.uf3cp.mongodb.net:27017/<dbname>?ssl=true&replicaSet=atlas-jzzl00-shard-0&authSource=admin&retryWrites=true&w=majority';

    const legacyConnection = mongoose.createConnection(legacyUri);

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout')), 15000);
      legacyConnection.once('open', () => {
        clearTimeout(timeout);
        resolve();
      });
      legacyConnection.once('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    console.log('✅ Connected to legacy database');

    // Analyze posts collection (likely contains albums)
    console.log('\n📊 POSTS COLLECTION ANALYSIS:');
    console.log('==============================');

    const postsCount = await legacyConnection.db.collection('posts').countDocuments();
    console.log('Total posts:', postsCount);

    if (postsCount > 0) {
      // Get recent posts to understand structure
      const recentPosts = await legacyConnection.db.collection('posts')
        .find({})
        .sort({ createdAt: -1, date: -1 })
        .limit(5)
        .toArray();

      console.log('\n🕒 Recent posts structure:');
      recentPosts.forEach((post, idx) => {
        console.log('\nPost ' + (idx + 1) + ':');
        console.log('  ID:', post._id);
        console.log('  Fields:', Object.keys(post).join(', '));

        // Show key fields that might map to album fields
        if (post.title) console.log('  Title:', post.title);
        if (post.artist) console.log('  Artist:', post.artist);
        if (post.album) console.log('  Album:', post.album);
        if (post.user) console.log('  User:', post.user);
        if (post.noteclub) console.log('  Note Club:', post.noteclub);
        if (post.date) console.log('  Date:', post.date);
        if (post.createdAt) console.log('  Created:', post.createdAt);
        if (post.comments) console.log('  Comments:', Array.isArray(post.comments) ? post.comments.length + ' embedded' : 'N/A');

        // Check for streaming links
        const streamingFields = ['spotifyUrl', 'youtubeMusicUrl', 'appleMusicUrl', 'tidalUrl', 'deezerUrl'];
        streamingFields.forEach(field => {
          if (post[field]) console.log('  ' + field + ':', post[field]);
        });
      });

      // Check for posts that might be new since migration
      const currentConnection = mongoose.createConnection(process.env.MONGODB_URI);
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
        currentConnection.once('open', () => {
          clearTimeout(timeout);
          resolve();
        });
        currentConnection.once('error', (err) => {
          clearTimeout(timeout);
          reject(err);
        });
      });

      console.log('\n🔄 Comparing with current albums...');

      // Get current album IDs (these might have been migrated from posts)
      const currentAlbums = await currentConnection.db.collection('albums').find({}, { _id: 1 }).toArray();
      const currentAlbumIds = new Set(currentAlbums.map(a => a._id.toString()));

      // Check which posts are NOT in current albums
      const allPosts = await legacyConnection.db.collection('posts').find({}).toArray();
      const newPosts = allPosts.filter(post => !currentAlbumIds.has(post._id.toString()));

      console.log('Posts in legacy:', allPosts.length);
      console.log('Albums in current:', currentAlbums.length);
      console.log('Posts not yet migrated:', newPosts.length);

      if (newPosts.length > 0) {
        console.log('\n🆕 POSTS THAT NEED MIGRATION:');
        console.log('==============================');

        newPosts.slice(0, 10).forEach((post, idx) => {
          const date = (post.createdAt || post.date)?.toISOString().split('T')[0] || 'No date';
          console.log((idx + 1) + '. "' + (post.title || post.album) + '" by ' + (post.artist || 'Unknown') + ' (' + date + ')');
        });

        if (newPosts.length > 10) {
          console.log('... and ' + (newPosts.length - 10) + ' more');
        }
      }

      await currentConnection.close();
    }

    // Analyze noteclubs collection
    console.log('\n📊 NOTECLUBS COLLECTION ANALYSIS:');
    console.log('==================================');

    const noteclubsCount = await legacyConnection.db.collection('noteclubs').countDocuments();
    console.log('Total noteclubs:', noteclubsCount);

    if (noteclubsCount > 0) {
      const sampleNoteclubs = await legacyConnection.db.collection('noteclubs')
        .find({})
        .limit(3)
        .toArray();

      console.log('\n📝 Sample noteclubs:');
      sampleNoteclubs.forEach((noteclub, idx) => {
        console.log('\nNoteclub ' + (idx + 1) + ':');
        console.log('  ID:', noteclub._id);
        console.log('  Fields:', Object.keys(noteclub).join(', '));

        if (noteclub.name) console.log('  Name:', noteclub.name);
        if (noteclub.description) console.log('  Description:', noteclub.description);
        if (noteclub.members) console.log('  Members:', Array.isArray(noteclub.members) ? noteclub.members.length : 'N/A');
        if (noteclub.createdAt) console.log('  Created:', noteclub.createdAt);
      });
    }

    // Analyze comments
    console.log('\n📊 COMMENTS COLLECTION ANALYSIS:');
    console.log('=================================');

    const commentsCount = await legacyConnection.db.collection('comments').countDocuments();
    console.log('Total comments:', commentsCount);

    if (commentsCount > 0) {
      const sampleComments = await legacyConnection.db.collection('comments')
        .find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray();

      console.log('\n💬 Sample comments structure:');
      sampleComments.forEach((comment, idx) => {
        console.log('\nComment ' + (idx + 1) + ':');
        console.log('  ID:', comment._id);
        console.log('  Fields:', Object.keys(comment).join(', '));

        if (comment.content) console.log('  Content:', comment.content.substring(0, 50) + '...');
        if (comment.user) console.log('  User:', comment.user);
        if (comment.post) console.log('  Post:', comment.post);
        if (comment.album) console.log('  Album:', comment.album);
        if (comment.createdAt) console.log('  Created:', comment.createdAt);
      });
    }

    await legacyConnection.close();

    console.log('\n📋 SUMMARY:');
    console.log('============');
    console.log('Legacy database uses different schema:');
    console.log('• posts collection (instead of albums)');
    console.log('• noteclubs collection (instead of groups)');
    console.log('• comments collection (similar structure)');
    console.log('');
    console.log('Migration strategy:');
    console.log('• Map posts -> albums');
    console.log('• Map noteclubs -> groups');
    console.log('• Migrate new comments');
    console.log('• Handle embedded comments in posts');

    console.log('\n✅ Structure analysis complete');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main().catch(console.error);