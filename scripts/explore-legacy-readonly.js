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

    // Current database URI for comparison
    const currentMongoUri = process.env.MONGODB_URI;
    console.log('Current database configured:', currentMongoUri ? '✅' : '❌');

    // Legacy database connection exploration
    const baseUri = 'mongodb://jyoungiv:Duckies1!@cluckbot-shard-00-00.uf3cp.mongodb.net:27017,cluckbot-shard-00-01.uf3cp.mongodb.net:27017,cluckbot-shard-00-02.uf3cp.mongodb.net:27017';
    const params = '?ssl=true&replicaSet=atlas-jzzl00-shard-0&authSource=admin&retryWrites=true&w=majority';

    // The database name is literally '<dbname>'
    const possibleDbNames = ['<dbname>'];

    console.log('\\n🔍 Exploring legacy MongoDB instance...');
    console.log('Base URI:', baseUri.replace(/jyoungiv:[^@]+@/, 'jyoungiv:***@'));

    let foundDatabases = [];

    for (const dbName of possibleDbNames) {
      try {
        const testUri = `${baseUri}/${dbName}${params}`;
        console.log(`\n📂 Checking database: ${dbName}`);

        const connection = mongoose.createConnection(testUri);

        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Connection timeout after 10s')), 10000);
          connection.once('open', () => {
            clearTimeout(timeout);
            resolve();
          });
          connection.once('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        });

        console.log('   ✅ Connection successful');

        // List all collections
        const collections = await connection.db.listCollections().toArray();
        console.log(`   Collections found: ${collections.length}`);

        const collectionNames = collections.map(c => c.name);
        console.log(`   Collection names: ${collectionNames.join(', ')}`);

        // Check for note-club specific collections
        const hasAlbums = collections.some(c => c.name === 'albums');
        const hasComments = collections.some(c => c.name === 'comments');
        const hasUsers = collections.some(c => c.name === 'users');
        const hasGroups = collections.some(c => c.name === 'groups');

        if (hasAlbums || hasComments || hasUsers || hasGroups) {
          console.log('   🎯 Note Club collections found:');
          if (hasAlbums) {
            const albumCount = await connection.db.collection('albums').countDocuments();
            console.log(\`      Albums: \${albumCount}\`);
          }
          if (hasComments) {
            const commentCount = await connection.db.collection('comments').countDocuments();
            console.log(\`      Comments: \${commentCount}\`);
          }
          if (hasUsers) {
            const userCount = await connection.db.collection('users').countDocuments();
            console.log(\`      Users: \${userCount}\`);
          }
          if (hasGroups) {
            const groupCount = await connection.db.collection('groups').countDocuments();
            console.log(\`      Groups: \${groupCount}\`);
          }

          foundDatabases.push({
            name: dbName,
            uri: testUri,
            collections: { albums: hasAlbums, comments: hasComments, users: hasUsers, groups: hasGroups },
            connection
          });

          // If this looks like the main database, explore it more
          if (hasAlbums) {
            console.log('\\n   📊 Sample albums:');
            const sampleAlbums = await connection.db.collection('albums')
              .find({})
              .sort({ createdAt: -1, postedAt: -1 })
              .limit(5)
              .toArray();

            sampleAlbums.forEach((album, idx) => {
              const date = (album.createdAt || album.postedAt)?.toISOString().split('T')[0] || 'No date';
              console.log(\`      \${idx + 1}. "\${album.title}" by \${album.artist} (\${date})\`);
            });

            // Check for embedded vs standalone comments
            const albumsWithEmbedded = await connection.db.collection('albums').countDocuments({
              'comments.0': { $exists: true }
            });

            console.log(\`\\n   📝 Comment structure analysis:\`);
            console.log(\`      Albums with embedded comments: \${albumsWithEmbedded}\`);
            if (hasComments) {
              console.log(\`      Standalone comments: \${await connection.db.collection('comments').countDocuments()}\`);
            }

            // Check for migration indicators
            const albumsMissingGroup = await connection.db.collection('albums').countDocuments({
              group: { $exists: false }
            });
            const albumsMissingTurn = await connection.db.collection('albums').countDocuments({
              turnNumber: { $exists: false }
            });

            console.log(\`\\n   🔧 Migration status:\`);
            console.log(\`      Albums missing group field: \${albumsMissingGroup}\`);
            console.log(\`      Albums missing turnNumber field: \${albumsMissingTurn}\`);
          }

        } else {
          console.log('   ❌ No Note Club collections found');
        }

        await connection.close();

      } catch (error) {
        console.log(\`   ❌ Connection failed: \${error.message}\`);
      }
    }

    console.log('\\n📋 SUMMARY:');
    console.log('============');

    if (foundDatabases.length === 0) {
      console.log('❌ No Note Club databases found in the legacy instance');
      console.log('   Please verify:');
      console.log('   • The connection credentials are correct');
      console.log('   • The database name');
      console.log('   • Network connectivity');
    } else {
      console.log(\`✅ Found \${foundDatabases.length} database(s) with Note Club collections:\`);

      foundDatabases.forEach((db, idx) => {
        console.log(\`\\n\${idx + 1}. Database: \${db.name}\`);
        console.log(\`   Albums: \${db.collections.albums ? '✅' : '❌'}\`);
        console.log(\`   Comments: \${db.collections.comments ? '✅' : '❌'}\`);
        console.log(\`   Users: \${db.collections.users ? '✅' : '❌'}\`);
        console.log(\`   Groups: \${db.collections.groups ? '✅' : '❌'}\`);
      });

      const primaryDatabase = foundDatabases.find(db => db.collections.albums) || foundDatabases[0];

      console.log(\`\\n🎯 Primary database appears to be: \${primaryDatabase.name}\`);
      console.log('\\n🔄 Next steps:');
      console.log('   1. Confirm this is the correct legacy database');
      console.log('   2. Compare with current database to find new records');
      console.log('   3. Run migration script to copy new data');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }

  console.log('\\n✅ Exploration complete - no changes made to any database');
}

main().catch(console.error);