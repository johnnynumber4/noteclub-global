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

    // First, let's find the correct album IDs for our intended matches
    console.log('🔍 Finding correct album IDs...');

    // Get the albums we want to match to
    const dioLastInLine = await db.collection('albums').findOne({ title: /last in line/i, artist: /dio/i });
    const ozzyUnderCover = await db.collection('albums').findOne({ title: /under cover/i, artist: /ozzy/i });
    const stonesElMocambo = await db.collection('albums').findOne({ title: /el mocambo/i, artist: /rolling stones/i });

    console.log('Found albums:');
    if (dioLastInLine) console.log(`- Dio Last in Line: ${dioLastInLine._id} - "${dioLastInLine.title}" by ${dioLastInLine.artist}`);
    if (ozzyUnderCover) console.log(`- Ozzy Under Cover: ${ozzyUnderCover._id} - "${ozzyUnderCover.title}" by ${ozzyUnderCover.artist}`);
    if (stonesElMocambo) console.log(`- Stones El Mocambo: ${stonesElMocambo._id} - "${stonesElMocambo.title}" by ${stonesElMocambo.artist}`);

    // Get the orphaned comments that we previously mismatched
    const commentsToCorrect = [
      {
        commentId: '68b0fa35233b6646089ab083',
        content: 'for a covers album',
        correctAlbum: ozzyUnderCover
      },
      {
        commentId: '68b0fa35233b6646089ab079',
        content: 'Stones > Beatles',
        correctAlbum: stonesElMocambo
      },
      {
        commentId: '68b0fa35233b6646089ab07e',
        content: 'Dio is just amazing',
        correctAlbum: dioLastInLine
      },
      {
        commentId: '68b0fa35233b6646089ab07b',
        content: 'harmonizing with himself',
        correctAlbum: dioLastInLine
      }
    ];

    console.log('\\n🔧 Correcting mismatched comments...');

    for (const correction of commentsToCorrect) {
      if (!correction.correctAlbum) {
        console.log(`⚠️  Could not find correct album for comment containing "${correction.content}"`);
        continue;
      }

      try {
        const comment = await db.collection('comments').findOne({
          _id: new mongoose.Types.ObjectId(correction.commentId)
        });

        if (!comment) {
          console.log(`❌ Comment ${correction.commentId} not found`);
          continue;
        }

        // Update to correct album
        await db.collection('comments').updateOne(
          { _id: new mongoose.Types.ObjectId(correction.commentId) },
          { $set: { album: correction.correctAlbum._id } }
        );

        console.log(`✅ Corrected: "${comment.content.substring(0, 50)}..."`);
        console.log(`   -> Now correctly linked to: "${correction.correctAlbum.title}" by ${correction.correctAlbum.artist}`);

      } catch (error) {
        console.log(`❌ Error correcting comment ${correction.commentId}: ${error.message}`);
      }
    }

    // Now let's try to match some of the remaining orphaned comments using date proximity
    console.log('\\n🕒 Attempting date-based matching for remaining comments...');

    const remainingOrphanedComments = await db.collection('comments').find({ album: null }).toArray();
    console.log(`Found ${remainingOrphanedComments.length} remaining orphaned comments`);

    let additionalMatches = 0;

    for (const comment of remainingOrphanedComments) {
      if (!comment.createdAt) continue;

      // Find albums posted within 24 hours of the comment
      const timeWindow = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      const startDate = new Date(comment.createdAt.getTime() - timeWindow);
      const endDate = new Date(comment.createdAt.getTime() + timeWindow);

      const nearbyAlbums = await db.collection('albums').find({
        postedAt: { $gte: startDate, $lte: endDate }
      }).toArray();

      if (nearbyAlbums.length === 1) {
        // Perfect match - only one album posted around the same time
        const album = nearbyAlbums[0];

        await db.collection('comments').updateOne(
          { _id: comment._id },
          { $set: { album: album._id } }
        );

        console.log(`✅ Date-matched: "${comment.content.substring(0, 40)}..."`);
        console.log(`   -> To album: "${album.title}" by ${album.artist}`);
        console.log(`   -> Comment: ${comment.createdAt.toISOString()}, Album: ${album.postedAt.toISOString()}`);

        additionalMatches++;
      } else if (nearbyAlbums.length > 1) {
        // Multiple candidates, show them for manual review
        console.log(`\\n❓ Multiple options for: "${comment.content.substring(0, 40)}..." (${comment.createdAt.toISOString()})`);
        nearbyAlbums.forEach((album, idx) => {
          console.log(`   ${idx + 1}. "${album.title}" by ${album.artist} (${album.postedAt.toISOString()})`);
        });
      }
    }

    // Final status
    const finalOrphanedCount = await db.collection('comments').countDocuments({ album: null });
    const totalComments = await db.collection('comments').countDocuments({});

    console.log('\\n🎯 FINAL STATUS:');
    console.log('================');
    console.log(`Total comments: ${totalComments}`);
    console.log(`Successfully linked: ${totalComments - finalOrphanedCount}`);
    console.log(`Still orphaned: ${finalOrphanedCount}`);
    console.log(`Additional matches this run: ${additionalMatches}`);

    if (finalOrphanedCount === 0) {
      console.log('\\n🎉 SUCCESS! All comments are now properly matched to albums!');
    } else if (finalOrphanedCount < 10) {
      console.log('\\n✨ Almost there! Only a few orphaned comments remain.');
      console.log('   These may be comments on deleted albums or require manual review.');
    } else {
      console.log('\\n📝 Progress made! Consider running additional matching strategies if needed.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);