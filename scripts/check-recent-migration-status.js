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
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Let's check albums from the last 30 days to see if any need migration
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    console.log(`🕒 Checking albums from the last 30 days (since ${thirtyDaysAgo.toISOString().split('T')[0]}):`);
    console.log('='.repeat(80));

    const recentAlbums = await db.collection('albums').find({
      $or: [
        { createdAt: { $gte: thirtyDaysAgo } },
        { postedAt: { $gte: thirtyDaysAgo } }
      ]
    }).sort({ createdAt: -1 }).toArray();

    console.log(`\\nFound ${recentAlbums.length} albums from the last 30 days\\n`);

    if (recentAlbums.length === 0) {
      console.log('🤔 No recent albums found. Let me check the most recent albums regardless of date...');

      const latestAlbums = await db.collection('albums').find({})
        .sort({ createdAt: -1, postedAt: -1 })
        .limit(10)
        .toArray();

      console.log(`\\n📊 Most recent 10 albums in the database:`);
      latestAlbums.forEach((album, idx) => {
        const date = (album.createdAt || album.postedAt)?.toISOString().split('T')[0] || 'No date';
        console.log(`${idx + 1}. "${album.title}" by ${album.artist} (${date})`);
      });

      console.log('\\n💡 These albums appear to be from your existing migration.');
      console.log('   If you have new albums that were added very recently,');
      console.log('   they might not be showing up due to date formatting issues.');

      return;
    }

    let needsMigration = 0;
    let fullyMigrated = 0;

    console.log('🔍 Analyzing each recent album:');
    console.log('-'.repeat(60));

    for (const album of recentAlbums) {
      const date = (album.createdAt || album.postedAt)?.toISOString().split('T')[0] || 'No date';
      console.log(`\\n📀 "${album.title}" by ${album.artist} (${date})`);
      console.log(`   ID: ${album._id}`);

      // Check migration status
      const hasGroup = !!album.group;
      const hasTurnNumber = !!album.turnNumber;
      const hasEmbeddedComments = album.comments && album.comments.length > 0;
      const standaloneComments = await db.collection('comments').countDocuments({ album: album._id });

      console.log(`   Group: ${hasGroup ? '✅' : '❌'}`);
      console.log(`   Turn Number: ${hasTurnNumber ? '✅' : '❌'}`);
      console.log(`   Embedded Comments: ${hasEmbeddedComments ? '⚠️ ' + album.comments.length : '✅ 0'}`);
      console.log(`   Standalone Comments: ${standaloneComments}`);

      const isMigrated = hasGroup && hasTurnNumber && !hasEmbeddedComments;

      if (isMigrated) {
        console.log(`   Status: ✅ FULLY MIGRATED`);
        fullyMigrated++;
      } else {
        console.log(`   Status: 🚨 NEEDS MIGRATION`);
        needsMigration++;

        // Show what needs to be fixed
        const issues = [];
        if (!hasGroup) issues.push('missing group');
        if (!hasTurnNumber) issues.push('missing turnNumber');
        if (hasEmbeddedComments) issues.push(`${album.comments.length} embedded comments`);

        console.log(`   Issues: ${issues.join(', ')}`);
      }
    }

    console.log('\\n📊 SUMMARY:');
    console.log('============');
    console.log(`Total recent albums: ${recentAlbums.length}`);
    console.log(`Fully migrated: ${fullyMigrated}`);
    console.log(`Need migration: ${needsMigration}`);

    if (needsMigration > 0) {
      console.log('\\n🔧 MIGRATION NEEDED:');
      console.log('====================');

      const albumsNeedingMigration = [];

      for (const album of recentAlbums) {
        const hasGroup = !!album.group;
        const hasTurnNumber = !!album.turnNumber;
        const hasEmbeddedComments = album.comments && album.comments.length > 0;

        if (!hasGroup || !hasTurnNumber || hasEmbeddedComments) {
          albumsNeedingMigration.push({
            id: album._id,
            title: album.title,
            artist: album.artist,
            needsGroup: !hasGroup,
            needsTurnNumber: !hasTurnNumber,
            embeddedComments: hasEmbeddedComments ? album.comments.length : 0
          });
        }
      }

      albumsNeedingMigration.forEach((album, idx) => {
        console.log(`\\n${idx + 1}. "${album.title}" by ${album.artist}`);
        console.log(`   ID: ${album.id}`);

        const fixes = [];
        if (album.needsGroup) fixes.push('add group field');
        if (album.needsTurnNumber) fixes.push('add turnNumber field');
        if (album.embeddedComments > 0) fixes.push(\`migrate \${album.embeddedComments} embedded comments\`);

        console.log(\`   Fixes needed: \${fixes.join(', ')}\`);
      });

      console.log('\\n💡 Ready to run migration script?');
      console.log('   The migration will:');
      if (albumsNeedingMigration.some(a => a.needsGroup || a.needsTurnNumber)) {
        console.log('   • Add missing group and turnNumber fields');
      }
      if (albumsNeedingMigration.some(a => a.embeddedComments > 0)) {
        console.log('   • Convert embedded comments to standalone Comment documents');
      }

    } else {
      console.log('\\n🎉 All recent albums are fully migrated!');
      console.log('   No migration work is needed.');
    }

    // Also check if there are any comments that need to be migrated from embedded to standalone
    const totalEmbeddedComments = await db.collection('albums').aggregate([
      { $match: { 'comments.0': { $exists: true } } },
      { $project: { commentCount: { $size: '$comments' } } },
      { $group: { _id: null, totalEmbedded: { $sum: '$commentCount' } } }
    ]).toArray();

    const embeddedCount = totalEmbeddedComments[0]?.totalEmbedded || 0;

    if (embeddedCount > 0) {
      console.log(\`\\n📝 Additionally found \${embeddedCount} embedded comments across all albums that need migration.\`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);