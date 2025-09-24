const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/note-club-modern';

async function verifyMigration() {
  console.log('🔍 Verifying migration...');
  
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db();
  
  // Check collections and counts
  const collections = ['users', 'albums', 'groups', 'themes', 'comments'];
  
  for (const collection of collections) {
    const count = await db.collection(collection).countDocuments();
    console.log(`📊 ${collection}: ${count} documents`);
    
    if (count > 0) {
      const sample = await db.collection(collection).findOne({});
      console.log(`   Sample ${collection.slice(0, -1)}:`, {
        _id: sample._id,
        ...Object.keys(sample).slice(1, 4).reduce((obj, key) => {
          obj[key] = sample[key];
          return obj;
        }, {})
      });
    }
  }
  
  // Check specific data integrity
  const users = await db.collection('users').find({}).toArray();
  const albums = await db.collection('albums').find({}).toArray();
  
  console.log('\n📈 Data Integrity Check:');
  console.log(`✓ Users with passwords: ${users.filter(u => u.password).length}/${users.length}`);
  console.log(`✓ Albums with artwork: ${albums.filter(a => a.artwork?.small).length}/${albums.length}`);
  console.log(`✓ Albums with Wikipedia descriptions: ${albums.filter(a => a.wikipediaDescription).length}/${albums.length}`);
  console.log(`✓ Albums with YouTube Music links: ${albums.filter(a => a.links?.youtubeMusic).length}/${albums.length}`);
  
  // Show sample migrated album
  const sampleAlbum = albums[0];
  if (sampleAlbum) {
    console.log('\n🎵 Sample Album:');
    console.log(`   Title: ${sampleAlbum.title}`);
    console.log(`   Artist: ${sampleAlbum.artist}`);
    console.log(`   Author: ${sampleAlbum.author}`);
    console.log(`   Created: ${sampleAlbum.createdAt}`);
    console.log(`   Has Artwork: ${!!sampleAlbum.artwork?.small}`);
    console.log(`   Has Wikipedia: ${!!sampleAlbum.wikipediaDescription}`);
  }
  
  await client.close();
  console.log('\n✅ Migration verification complete!');
}

verifyMigration().catch(console.error);