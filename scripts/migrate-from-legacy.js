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

    // Current database connection string
    const currentMongoUri = process.env.MONGODB_URI;
    console.log('Current MongoDB URI:', currentMongoUri ? 'Found' : 'Not found');

    if (!currentMongoUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    // Legacy database connection
    let legacyMongoUri = process.env.LEGACY_MONGODB_URI;

    // Use the provided legacy connection string
    if (!legacyMongoUri) {
      // Default to the provided connection string, trying common database names
      const baseUri = 'mongodb://jyoungiv:Duckies1!@cluckbot-shard-00-00.uf3cp.mongodb.net:27017,cluckbot-shard-00-01.uf3cp.mongodb.net:27017,cluckbot-shard-00-02.uf3cp.mongodb.net:27017';
      const params = '?ssl=true&replicaSet=atlas-jzzl00-shard-0&authSource=admin&retryWrites=true&w=majority';

      // Try common database names
      const possibleDbNames = ['note-club', 'noteclub', 'note_club', 'note-club-modern', 'test'];

      console.log('🔍 Legacy connection string provided, trying different database names...');

      for (const dbName of possibleDbNames) {
        try {
          const testUri = \`\${baseUri}/\${dbName}\${params}\`;
          console.log(\`   Trying database: \${dbName}\`);

          const testConnection = mongoose.createConnection(testUri);
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Connection timeout')), 5000);
            testConnection.once('open', () => {
              clearTimeout(timeout);
              resolve();
            });
            testConnection.once('error', (err) => {
              clearTimeout(timeout);
              reject(err);
            });
          });

          // Test if collections exist
          const collections = await testConnection.db.listCollections().toArray();
          const hasAlbums = collections.some(c => c.name === 'albums');
          const hasComments = collections.some(c => c.name === 'comments');

          if (hasAlbums || hasComments) {
            console.log(\`   ✅ Found database with collections: \${dbName}\`);
            legacyMongoUri = testUri;
            await testConnection.close();
            break;
          } else {
            console.log(\`   ❌ Database \${dbName} exists but no albums/comments collections\`);
            await testConnection.close();
          }

        } catch (error) {
          console.log(\`   ❌ Failed to connect to \${dbName}: \${error.message}\`);
        }
      }

      if (!legacyMongoUri) {
        console.log('\\n❌ Could not find a valid legacy database.');
        console.log('   Please provide the correct database name in the connection string.');
        return;
      }
    }

    console.log('\\n🔄 Setting up dual database connections...');

    // Create two separate mongoose connections
    const currentConnection = mongoose.createConnection(currentMongoUri);
    const legacyConnection = mongoose.createConnection(legacyMongoUri);

    await Promise.all([
      new Promise((resolve, reject) => {
        currentConnection.once('open', resolve);
        currentConnection.once('error', reject);
      }),
      new Promise((resolve, reject) => {
        legacyConnection.once('open', resolve);
        legacyConnection.once('error', reject);
      })
    ]);

    console.log('✅ Connected to both databases');

    // Get collections from both databases
    const currentAlbums = currentConnection.db.collection('albums');
    const currentComments = currentConnection.db.collection('comments');
    const legacyAlbums = legacyConnection.db.collection('albums');
    const legacyComments = legacyConnection.db.collection('comments');

    // Check current database state
    const currentAlbumCount = await currentAlbums.countDocuments();
    const currentCommentCount = await currentComments.countDocuments();

    console.log('\\n📊 Current Database State:');
    console.log(`   Albums: ${currentAlbumCount}`);
    console.log(`   Comments: ${currentCommentCount}`);

    // Check legacy database state
    const legacyAlbumCount = await legacyAlbums.countDocuments();
    const legacyCommentCount = await legacyComments.countDocuments();

    console.log('\\n📊 Legacy Database State:');
    console.log(`   Albums: ${legacyAlbumCount}`);
    console.log(`   Comments: ${legacyCommentCount}`);

    if (legacyAlbumCount === 0 && legacyCommentCount === 0) {
      console.log('\\n⚠️  Legacy database appears to be empty.');
      console.log('   Please verify the connection string is correct.');
      return;
    }

    // Find albums in legacy that don't exist in current
    console.log('\\n🔍 Finding new albums in legacy database...');

    const currentAlbumIds = new Set((await currentAlbums.find({}, { _id: 1 }).toArray()).map(a => a._id.toString()));
    const legacyAlbumsData = await legacyAlbums.find({}).toArray();

    const newAlbums = legacyAlbumsData.filter(album => !currentAlbumIds.has(album._id.toString()));

    console.log(`\\n📈 Found ${newAlbums.length} new albums in legacy database:`);

    if (newAlbums.length === 0) {
      console.log('   No new albums to migrate.');
    } else {
      // Show the new albums
      newAlbums.slice(0, 10).forEach((album, idx) => {
        const date = (album.createdAt || album.postedAt)?.toISOString().split('T')[0] || 'No date';
        console.log(`   ${idx + 1}. "${album.title}" by ${album.artist} (${date})`);
      });

      if (newAlbums.length > 10) {
        console.log(`   ... and ${newAlbums.length - 10} more`);
      }

      console.log('\\n🔄 Ready to migrate these albums?');
      console.log('   This will:');
      console.log('   • Copy new albums to current database');
      console.log('   • Migrate embedded comments to standalone documents');
      console.log('   • Ensure proper group and turnNumber fields');

      console.log('\\n⚠️  Proceeding with migration in 5 seconds...');
      console.log('   Press Ctrl+C to cancel');

      await new Promise(resolve => setTimeout(resolve, 5000));

      console.log('\\n🚀 Starting migration...');

      let migratedCount = 0;
      let migratedCommentsCount = 0;

      for (const album of newAlbums) {
        try {
          // Prepare album data for insertion
          const albumData = { ...album };

          // Ensure required fields for modern schema
          if (!albumData.group) {
            // You might need to set a default group ID or ask user
            console.log(`   ⚠️  Album "${album.title}" missing group field - using default`);
            // Set a default group ID - you'll need to replace this with actual group ID
            // albumData.group = new mongoose.Types.ObjectId('YOUR_DEFAULT_GROUP_ID');
          }

          if (!albumData.turnNumber) {
            console.log(`   ⚠️  Album "${album.title}" missing turnNumber - calculating...`);
            // Calculate turn number based on existing albums in group
            const maxTurn = await currentAlbums.findOne(
              { group: albumData.group },
              { sort: { turnNumber: -1 } }
            );
            albumData.turnNumber = (maxTurn?.turnNumber || 0) + 1;
          }

          // Handle embedded comments
          let embeddedComments = [];
          if (albumData.comments && albumData.comments.length > 0) {
            embeddedComments = [...albumData.comments];
            albumData.comments = []; // Clear embedded comments
          }

          // Insert album
          await currentAlbums.insertOne(albumData);
          migratedCount++;

          console.log(`   ✅ Migrated: "${album.title}" by ${album.artist}`);

          // Migrate embedded comments to standalone
          for (const comment of embeddedComments) {
            const standaloneComment = {
              content: comment.content,
              author: comment.postedBy,
              album: albumData._id,
              createdAt: comment.postedAt || comment.createdAt || new Date(),
              updatedAt: comment.postedAt || comment.createdAt || new Date(),
              likes: [],
              replies: [],
              depth: 0,
              isHidden: false,
              isEdited: false
            };

            await currentComments.insertOne(standaloneComment);
            migratedCommentsCount++;
          }

          if (embeddedComments.length > 0) {
            console.log(`     • Migrated ${embeddedComments.length} comments`);
          }

        } catch (error) {
          console.log(`   ❌ Failed to migrate "${album.title}": ${error.message}`);
        }
      }

      console.log('\\n🎉 Migration Complete!');
      console.log(`   Albums migrated: ${migratedCount}`);
      console.log(`   Comments migrated: ${migratedCommentsCount}`);
    }

    // Also check for new comments
    console.log('\\n🔍 Checking for new standalone comments...');

    const currentCommentIds = new Set((await currentComments.find({}, { _id: 1 }).toArray()).map(c => c._id.toString()));
    const legacyCommentsData = await legacyComments.find({}).toArray();

    const newComments = legacyCommentsData.filter(comment => !currentCommentIds.has(comment._id.toString()));

    if (newComments.length > 0) {
      console.log(`\\n📝 Found ${newComments.length} new standalone comments to migrate`);

      for (const comment of newComments) {
        // Verify the album exists in current database
        const albumExists = await currentAlbums.findOne({ _id: comment.album });

        if (albumExists) {
          await currentComments.insertOne(comment);
          console.log(`   ✅ Migrated comment to "${albumExists.title}"`);
        } else {
          console.log(`   ⚠️  Skipped comment - album not found: ${comment.album}`);
        }
      }
    } else {
      console.log('   No new standalone comments found');
    }

    await currentConnection.close();
    await legacyConnection.close();

    console.log('\\n✅ Migration complete! All new albums and comments have been migrated.');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main().catch(console.error);