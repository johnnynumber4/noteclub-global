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

    console.log('🔍 LEGACY DATABASE EXPLORATION (READ-ONLY)');
    console.log('==========================================');

    // Legacy database connection
    const legacyUri = 'mongodb://jyoungiv:Duckies1!@cluckbot-shard-00-00.uf3cp.mongodb.net:27017,cluckbot-shard-00-01.uf3cp.mongodb.net:27017,cluckbot-shard-00-02.uf3cp.mongodb.net:27017/<dbname>?ssl=true&replicaSet=atlas-jzzl00-shard-0&authSource=admin&retryWrites=true&w=majority';

    console.log('\n🔄 Connecting to legacy database...');
    console.log('Database name: <dbname>');

    const legacyConnection = mongoose.createConnection(legacyUri);

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection timeout after 15s')), 15000);
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

    // List collections
    const collections = await legacyConnection.db.listCollections().toArray();
    console.log('\n📂 Collections found:', collections.length);

    const collectionNames = collections.map(c => c.name);
    console.log('Collection names:', collectionNames.join(', '));

    // Check for note-club collections
    const hasAlbums = collections.some(c => c.name === 'albums');
    const hasComments = collections.some(c => c.name === 'comments');
    const hasUsers = collections.some(c => c.name === 'users');
    const hasGroups = collections.some(c => c.name === 'groups');

    console.log('\n🎯 Note Club collections:');
    console.log('Albums:', hasAlbums ? '✅' : '❌');
    console.log('Comments:', hasComments ? '✅' : '❌');
    console.log('Users:', hasUsers ? '✅' : '❌');
    console.log('Groups:', hasGroups ? '✅' : '❌');

    if (hasAlbums) {
      const albumCount = await legacyConnection.db.collection('albums').countDocuments();
      console.log('\n📊 Albums in legacy database:', albumCount);

      // Get recent albums
      const recentAlbums = await legacyConnection.db.collection('albums')
        .find({})
        .sort({ createdAt: -1, postedAt: -1 })
        .limit(10)
        .toArray();

      console.log('\n🕒 Most recent albums:');
      recentAlbums.forEach((album, idx) => {
        const date = (album.createdAt || album.postedAt)?.toISOString().split('T')[0] || 'No date';
        console.log((idx + 1) + '. "' + album.title + '" by ' + album.artist + ' (' + date + ')');
      });

      // Check structure
      const albumsWithEmbedded = await legacyConnection.db.collection('albums').countDocuments({
        'comments.0': { $exists: true }
      });

      const albumsMissingGroup = await legacyConnection.db.collection('albums').countDocuments({
        group: { $exists: false }
      });

      const albumsMissingTurn = await legacyConnection.db.collection('albums').countDocuments({
        turnNumber: { $exists: false }
      });

      console.log('\n🔧 Structure analysis:');
      console.log('Albums with embedded comments:', albumsWithEmbedded);
      console.log('Albums missing group field:', albumsMissingGroup);
      console.log('Albums missing turnNumber field:', albumsMissingTurn);
    }

    if (hasComments) {
      const commentCount = await legacyConnection.db.collection('comments').countDocuments();
      console.log('\n💬 Standalone comments in legacy:', commentCount);
    }

    // Now connect to current database for comparison
    console.log('\n🔄 Connecting to current database for comparison...');
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

    console.log('✅ Connected to current database');

    const currentAlbumCount = await currentConnection.db.collection('albums').countDocuments();
    const currentCommentCount = await currentConnection.db.collection('comments').countDocuments();

    console.log('\n📊 Current database:');
    console.log('Albums:', currentAlbumCount);
    console.log('Comments:', currentCommentCount);

    if (hasAlbums) {
      console.log('\n🔍 Finding differences...');

      // Get album IDs from both databases
      const legacyAlbumIds = new Set();
      const legacyAlbums = await legacyConnection.db.collection('albums').find({}, { _id: 1 }).toArray();
      legacyAlbums.forEach(album => legacyAlbumIds.add(album._id.toString()));

      const currentAlbumIds = new Set();
      const currentAlbums = await currentConnection.db.collection('albums').find({}, { _id: 1 }).toArray();
      currentAlbums.forEach(album => currentAlbumIds.add(album._id.toString()));

      // Find albums in legacy but not in current
      const newAlbumIds = [];
      legacyAlbumIds.forEach(id => {
        if (!currentAlbumIds.has(id)) {
          newAlbumIds.push(id);
        }
      });

      console.log('Albums in legacy but not in current:', newAlbumIds.length);

      if (newAlbumIds.length > 0) {
        console.log('\n🆕 New albums to migrate:');

        for (let i = 0; i < Math.min(10, newAlbumIds.length); i++) {
          const albumId = newAlbumIds[i];
          const album = await legacyConnection.db.collection('albums').findOne({
            _id: new mongoose.Types.ObjectId(albumId)
          });

          if (album) {
            const date = (album.createdAt || album.postedAt)?.toISOString().split('T')[0] || 'No date';
            console.log((i + 1) + '. "' + album.title + '" by ' + album.artist + ' (' + date + ')');
          }
        }

        if (newAlbumIds.length > 10) {
          console.log('... and ' + (newAlbumIds.length - 10) + ' more');
        }
      }
    }

    await legacyConnection.close();
    await currentConnection.close();

    console.log('\n✅ Exploration complete - no changes made');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main().catch(console.error);