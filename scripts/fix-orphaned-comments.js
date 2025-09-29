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

    // Get all orphaned comments (with null album references)
    const orphanedComments = await db.collection('comments').find({
      album: null
    }).toArray();

    console.log(`Found ${orphanedComments.length} comments with null album references`);

    if (orphanedComments.length === 0) {
      console.log('✅ No orphaned comments found!');
      return;
    }

    // Let's examine these comments to understand their structure
    console.log('\n📋 Sample orphaned comments:');
    orphanedComments.slice(0, 5).forEach((comment, idx) => {
      console.log(`${idx + 1}. Comment ID: ${comment._id}`);
      console.log(`   Content: "${comment.content?.substring(0, 100) || 'No content'}..."`);
      console.log(`   Author: ${comment.author || 'No author'}`);
      console.log(`   Created: ${comment.createdAt || comment.postedAt || 'No date'}`);
      console.log(`   Album: ${comment.album}`);
      console.log('');
    });

    // Check if these comments might have been embedded comments that were migrated
    // We'll look for patterns in the content or timing that might help us match them

    console.log('\n🔍 Attempting to find matching albums for orphaned comments...');

    let matchedComments = 0;
    let deletedComments = 0;

    for (const comment of orphanedComments) {
      let matched = false;

      // Strategy 1: Look for albums by the same author around the same time
      if (comment.author && comment.createdAt) {
        const timeRange = 1000 * 60 * 60 * 24 * 7; // 7 days
        const startDate = new Date(comment.createdAt.getTime() - timeRange);
        const endDate = new Date(comment.createdAt.getTime() + timeRange);

        const candidateAlbums = await db.collection('albums').find({
          postedBy: comment.author,
          postedAt: { $gte: startDate, $lte: endDate }
        }).toArray();

        if (candidateAlbums.length === 1) {
          // Perfect match - same author, within time range
          const albumId = candidateAlbums[0]._id;
          await db.collection('comments').updateOne(
            { _id: comment._id },
            { $set: { album: albumId } }
          );
          console.log(`✅ Matched comment ${comment._id} to album "${candidateAlbums[0].title}"`);
          matchedComments++;
          matched = true;
        } else if (candidateAlbums.length > 1) {
          // Multiple candidates - pick the closest by date
          let closestAlbum = candidateAlbums[0];
          let minTimeDiff = Math.abs(comment.createdAt.getTime() - closestAlbum.postedAt.getTime());

          for (const album of candidateAlbums) {
            const timeDiff = Math.abs(comment.createdAt.getTime() - album.postedAt.getTime());
            if (timeDiff < minTimeDiff) {
              minTimeDiff = timeDiff;
              closestAlbum = album;
            }
          }

          const albumId = closestAlbum._id;
          await db.collection('comments').updateOne(
            { _id: comment._id },
            { $set: { album: albumId } }
          );
          console.log(`✅ Matched comment ${comment._id} to closest album "${closestAlbum.title}"`);
          matchedComments++;
          matched = true;
        }
      }

      // Strategy 2: If no match found and comment looks invalid, consider deleting
      if (!matched) {
        // Check if this comment has minimal content or looks like test data
        const content = comment.content || '';
        const isMinimalContent = content.length < 10;
        const hasNoAuthor = !comment.author;
        const hasNoDate = !comment.createdAt && !comment.postedAt;

        if (isMinimalContent || hasNoAuthor || hasNoDate) {
          console.log(`🗑️  Deleting orphaned comment ${comment._id} (insufficient data)`);
          console.log(`   Content: "${content}"`);
          console.log(`   Author: ${comment.author}`);
          console.log(`   Date: ${comment.createdAt || comment.postedAt}`);

          // Uncomment the next line to actually delete
          // await db.collection('comments').deleteOne({ _id: comment._id });
          deletedComments++;
        } else {
          console.log(`⚠️  Could not match comment ${comment._id}:`);
          console.log(`   Content: "${content.substring(0, 50)}..."`);
          console.log(`   Author: ${comment.author}`);
          console.log(`   Date: ${comment.createdAt || comment.postedAt}`);
        }
      }
    }

    console.log('\\n📊 FIXING RESULTS:');
    console.log('==================');
    console.log(`Total orphaned comments: ${orphanedComments.length}`);
    console.log(`Successfully matched: ${matchedComments}`);
    console.log(`Recommended for deletion: ${deletedComments}`);
    console.log(`Still orphaned: ${orphanedComments.length - matchedComments - deletedComments}`);

    if (deletedComments > 0) {
      console.log('\\n⚠️  To actually delete the orphaned comments with insufficient data,');
      console.log('   uncomment the deletion line in the script and run again.');
    }

    console.log('\\n✅ Orphaned comment fixing complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);