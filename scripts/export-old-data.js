const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

// Your MongoDB Atlas connection string
const OLD_MONGODB_URI = process.env.OLD_MONGODB_URI || 'mongodb://jyoungiv:Duckies1!@cluckbot-shard-00-00.uf3cp.mongodb.net:27017,cluckbot-shard-00-01.uf3cp.mongodb.net:27017,cluckbot-shard-00-02.uf3cp.mongodb.net:27017/<dbname>?ssl=true&replicaSet=atlas-jzzl00-shard-0&authSource=admin&retryWrites=true&w=majority';

async function exportData() {
  const client = new MongoClient(OLD_MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to old MongoDB database');
    
    const db = client.db();
    
    // Get list of all collections
    const collections = await db.listCollections().toArray();
    console.log('Found collections:', collections.map(c => c.name));
    
    // Export each collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`Exporting ${collectionName}...`);
      
      const collection = db.collection(collectionName);
      const data = await collection.find({}).toArray();
      
      // Create exports directory if it doesn't exist
      const exportDir = path.join(__dirname, '..', 'exports');
      await fs.mkdir(exportDir, { recursive: true });
      
      // Write to JSON file
      const filePath = path.join(exportDir, `${collectionName}.json`);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      
      console.log(`✓ Exported ${data.length} documents from ${collectionName} to ${filePath}`);
    }
    
    console.log('✅ Export completed successfully!');
    
  } catch (error) {
    console.error('❌ Error exporting data:', error);
  } finally {
    await client.close();
  }
}

exportData();