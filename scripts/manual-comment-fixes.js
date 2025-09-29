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

    // Manual fixes for the ambiguous matches based on better analysis
    const manualFixes = [
      {
        // "for a covers album, this is legit..." - most likely the Ozzy covers album
        commentId: '68b0fa35233b6646089ab083',
        albumId: '68b0fa35233b6646089ab02e',
        reasoning: 'Comment mentions "covers album" and dates align with Ozzy Under Cover album posting'
      },
      {
        // "Stones > Beatles" comment - probably about the Rolling Stones album in 2022
        commentId: '68b0fa35233b6646089ab079',
        albumId: '68b0fa35233b6646089aaed0',
        reasoning: 'Comment date (2022-11-12) closely matches El Mocambo 1977 posting (2022-11-13)'
      },
      {
        // "Dio is just amazing. I can see how this is #2!" - most likely about Last in Line by Dio
        commentId: '68b0fa35233b6646089ab07e',
        albumId: '68b0fa35233b6646089aaeff',
        reasoning: 'Comment mentions Dio and "#2", aligns with Last in Line posting date'
      },
      {
        // "His voice almost sounds like he's harmonizing with himself" - could be about Last in Line (Dio)
        commentId: '68b0fa35233b6646089ab07b',
        albumId: '68b0fa35233b6646089aaeff',
        reasoning: 'Comment about vocal harmonizing, date proximity to Last in Line album'
      }
      // Note: "It's a studio trick..." is harder to match, might leave for manual review
    ];

    console.log('🔧 Applying manual fixes for ambiguous matches...\\n');

    for (const fix of manualFixes) {
      try {
        // Verify the comment and album exist
        const comment = await db.collection('comments').findOne({ _id: new mongoose.Types.ObjectId(fix.commentId) });
        const album = await db.collection('albums').findOne({ _id: new mongoose.Types.ObjectId(fix.albumId) });

        if (!comment) {
          console.log(`❌ Comment ${fix.commentId} not found`);
          continue;
        }

        if (!album) {
          console.log(`❌ Album ${fix.albumId} not found`);
          continue;
        }

        // Apply the fix
        await db.collection('comments').updateOne(
          { _id: new mongoose.Types.ObjectId(fix.commentId) },
          { $set: { album: new mongoose.Types.ObjectId(fix.albumId) } }
        );

        console.log(`✅ Fixed comment: "${comment.content.substring(0, 50)}..."`);
        console.log(`   -> Matched to album: "${album.title}" by ${album.artist}`);
        console.log(`   -> Reasoning: ${fix.reasoning}\\n`);

      } catch (error) {
        console.log(`❌ Error fixing comment ${fix.commentId}: ${error.message}`);
      }
    }

    // Now let's handle some of the clearer unmatched comments that should probably be deleted
    const commentsToDelete = [
      '68b0fa35233b6646089ab090', // "Penis's "
      '68b0fa35233b6646089ab086', // "fixed"
      '68b0fa35233b6646089ab093', // "kinky"
      '68b0fa35233b6646089ab097'  // "MAD GOD"
    ];

    console.log('\\n🗑️  Cleaning up low-quality orphaned comments...\\n');

    for (const commentId of commentsToDelete) {
      try {
        const comment = await db.collection('comments').findOne({ _id: new mongoose.Types.ObjectId(commentId) });

        if (comment) {
          await db.collection('comments').deleteOne({ _id: new mongoose.Types.ObjectId(commentId) });
          console.log(`🗑️  Deleted: "${comment.content}" (low quality/insufficient context)`);
        }

      } catch (error) {
        console.log(`❌ Error deleting comment ${commentId}: ${error.message}`);
      }
    }

    // Final count check
    const remainingOrphaned = await db.collection('comments').countDocuments({ album: null });
    const totalComments = await db.collection('comments').countDocuments({});

    console.log('\\n📊 FINAL RESULTS:');
    console.log('==================');
    console.log(`Total comments: ${totalComments}`);
    console.log(`Remaining orphaned: ${remainingOrphaned}`);
    console.log(`Successfully matched: ${38 - remainingOrphaned - 4} (estimated)`); // 4 deleted

    if (remainingOrphaned > 0) {
      console.log('\\n⚠️  Remaining orphaned comments may need individual review');
      console.log('   Consider checking if they can be matched by examining album posting dates');
      console.log('   or if they should be deleted as historical artifacts');
    } else {
      console.log('\\n🎉 All comments successfully matched to albums!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);