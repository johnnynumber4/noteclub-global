#!/usr/bin/env node

/**
 * Export Local Data to MongoDB Atlas
 * Exports all collections from local MongoDB to MongoDB Atlas cluster
 */

const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://localhost:27017/note-club-modern';
const ATLAS_URI = 'mongodb+srv://jyoungiv_db_user:iLh3sgpMklDaBx1p@cluster0.twifgsh.mongodb.net/note-club-modern?retryWrites=true&w=majority&appName=Cluster0';

async function exportToAtlas() {
  let localConnection = null;
  let atlasConnection = null;

  try {
    console.log('🚀 Starting data export to MongoDB Atlas...');
    
    // Connect to local MongoDB
    console.log('📡 Connecting to local MongoDB...');
    localConnection = await mongoose.createConnection(LOCAL_URI);
    await new Promise(resolve => {
      if (localConnection.readyState === 1) resolve();
      else localConnection.once('open', resolve);
    });
    console.log('✅ Connected to local MongoDB');

    // Connect to MongoDB Atlas
    console.log('☁️  Connecting to MongoDB Atlas...');
    atlasConnection = await mongoose.createConnection(ATLAS_URI);
    await new Promise(resolve => {
      if (atlasConnection.readyState === 1) resolve();
      else atlasConnection.once('open', resolve);
    });
    console.log('✅ Connected to MongoDB Atlas');

    const localDb = localConnection.db;
    const atlasDb = atlasConnection.db;

    // Get list of collections from local database
    const collections = await localDb.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections to export:`);
    collections.forEach(col => console.log(`   - ${col.name}`));

    let totalDocuments = 0;

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`\n📦 Exporting collection: ${collectionName}`);

      // Get all documents from local collection
      const localCollection = localDb.collection(collectionName);
      const documents = await localCollection.find({}).toArray();
      
      console.log(`   📄 Found ${documents.length} documents`);

      if (documents.length > 0) {
        // Clear existing data in Atlas collection (optional - remove if you want to merge)
        const atlasCollection = atlasDb.collection(collectionName);
        const existingCount = await atlasCollection.countDocuments();
        
        if (existingCount > 0) {
          console.log(`   🗑️  Clearing ${existingCount} existing documents in Atlas`);
          await atlasCollection.deleteMany({});
        }

        // Insert documents into Atlas
        console.log(`   ⬆️  Inserting ${documents.length} documents into Atlas...`);
        await atlasCollection.insertMany(documents, { ordered: false });
        
        // Verify insertion
        const verifyCount = await atlasCollection.countDocuments();
        console.log(`   ✅ Verified: ${verifyCount} documents in Atlas`);
        
        totalDocuments += verifyCount;
      }
    }

    console.log('\n🎉 Data export completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Collections exported: ${collections.length}`);
    console.log(`   - Total documents: ${totalDocuments}`);
    console.log('');
    console.log('✨ Your data is now available in MongoDB Atlas!');
    console.log('🔧 Next: Update your .env file to use the Atlas connection string');
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  } finally {
    // Close connections
    if (localConnection) {
      await localConnection.close();
      console.log('🔌 Disconnected from local MongoDB');
    }
    if (atlasConnection) {
      await atlasConnection.close();
      console.log('🔌 Disconnected from MongoDB Atlas');
    }
  }
}

// Run export if called directly
if (require.main === module) {
  exportToAtlas();
}

module.exports = { exportToAtlas };