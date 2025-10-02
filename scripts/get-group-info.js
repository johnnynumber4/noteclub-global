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

    console.log('🔍 CHECKING GROUPS FOR DEFAULT GROUP ID');
    console.log('=======================================');

    const currentConnection = mongoose.createConnection(process.env.MONGODB_URI);

    await new Promise((resolve, reject) => {
      currentConnection.once('open', resolve);
      currentConnection.once('error', reject);
    });

    console.log('✅ Connected to current database');

    // Check if groups collection exists
    const collections = await currentConnection.db.listCollections().toArray();
    const hasGroups = collections.some(c => c.name === 'groups');

    console.log('Groups collection exists:', hasGroups ? '✅' : '❌');

    if (hasGroups) {
      const groupCount = await currentConnection.db.collection('groups').countDocuments();
      console.log('Total groups:', groupCount);

      if (groupCount > 0) {
        const groups = await currentConnection.db.collection('groups').find({}).toArray();

        console.log('\n📋 Available groups:');
        groups.forEach((group, idx) => {
          console.log((idx + 1) + '. ' + (group.name || 'Unnamed Group'));
          console.log('   ID:', group._id);
          console.log('   Description:', group.description || 'No description');
          if (group.members) console.log('   Members:', Array.isArray(group.members) ? group.members.length : 'N/A');
          console.log('');
        });

        // Find the most commonly used group in existing albums
        console.log('🔍 Finding most commonly used group in albums:');
        const albumGroups = await currentConnection.db.collection('albums').aggregate([
          { $group: { _id: '$group', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 }
        ]).toArray();

        albumGroups.forEach((group, idx) => {
          console.log((idx + 1) + '. Group ID ' + group._id + ': ' + group.count + ' albums');
        });

        if (albumGroups.length > 0) {
          const defaultGroupId = albumGroups[0]._id;
          console.log('\n🎯 Suggested default group ID:', defaultGroupId);
          console.log('   (Most commonly used group with ' + albumGroups[0].count + ' albums)');
        }

      } else {
        console.log('No groups found in database');
      }
    } else {
      console.log('No groups collection found');

      // Check what group IDs are used in albums
      console.log('\n🔍 Checking group IDs used in existing albums:');
      const albumGroups = await currentConnection.db.collection('albums').aggregate([
        { $group: { _id: '$group', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]).toArray();

      if (albumGroups.length > 0) {
        console.log('Group IDs in use:');
        albumGroups.forEach((group, idx) => {
          console.log((idx + 1) + '. Group ID ' + group._id + ': ' + group.count + ' albums');
        });

        console.log('\n🎯 Suggested default group ID:', albumGroups[0]._id);
        console.log('   (Most commonly used group ID with ' + albumGroups[0].count + ' albums)');
      } else {
        console.log('No group information found in albums');
      }
    }

    await currentConnection.close();

    console.log('\n✅ Group analysis complete');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main().catch(console.error);