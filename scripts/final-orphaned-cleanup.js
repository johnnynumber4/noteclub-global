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

    // Get the final 5 orphaned comments
    const orphanedComments = await db.collection('comments').find({ album: null }).toArray();

    console.log(`🔍 Examining the final ${orphanedComments.length} orphaned comments:`);
    console.log('================================================================\\n');

    for (const comment of orphanedComments) {
      console.log(`📝 Comment ID: ${comment._id}`);
      console.log(`   Content: "${comment.content}"`);
      console.log(`   Author: ${comment.author}`);
      console.log(`   Created: ${comment.createdAt ? comment.createdAt.toISOString() : 'No date'}`);

      // Try to find albums by the same author around the same time (wider window)
      if (comment.author && comment.createdAt) {
        const timeWindow = 7 * 24 * 60 * 60 * 1000; // 7 days
        const startDate = new Date(comment.createdAt.getTime() - timeWindow);
        const endDate = new Date(comment.createdAt.getTime() + timeWindow);

        const candidateAlbums = await db.collection('albums').find({
          $or: [
            { postedBy: comment.author },
            { postedAt: { $gte: startDate, $lte: endDate } }
          ]
        }).sort({ postedAt: -1 }).limit(3).toArray();

        if (candidateAlbums.length > 0) {
          console.log(`   🎵 Potential albums:`);
          candidateAlbums.forEach((album, idx) => {
            const daysDiff = Math.abs(comment.createdAt - album.postedAt) / (1000 * 60 * 60 * 24);
            const sameAuthor = album.postedBy.toString() === comment.author.toString();
            console.log(`     ${idx + 1}. "${album.title}" by ${album.artist}`);
            console.log(`        Posted: ${album.postedAt.toISOString()} (${daysDiff.toFixed(1)} days ${daysDiff < 1 ? 'ago' : 'difference'})`);
            console.log(`        Same author: ${sameAuthor}`);
          });
        } else {
          console.log(`   ❌ No nearby albums found`);
        }

        // Try text matching with broader search
        const content = comment.content.toLowerCase();
        const textMatches = await db.collection('albums').find({
          $or: [
            { title: { $regex: new RegExp(content.split(' ').filter(w => w.length > 3)[0] || '', 'i') } },
            { artist: { $regex: new RegExp(content.split(' ').filter(w => w.length > 3)[0] || '', 'i') } },
            { description: { $regex: new RegExp(content.split(' ').filter(w => w.length > 3)[0] || '', 'i') } }
          ]
        }).limit(2).toArray();

        if (textMatches.length > 0) {
          console.log(`   🔤 Text-based matches:`);
          textMatches.forEach((album, idx) => {
            console.log(`     ${idx + 1}. "${album.title}" by ${album.artist}`);
          });
        }
      }

      console.log('\\n' + '-'.repeat(60) + '\\n');
    }

    // Decision logic for each comment based on analysis
    const decisions = [
      {
        id: '68b0fa35233b6646089ab07c',
        action: 'keep',
        reasoning: 'Technical comment about recording, might be valuable'
      },
      {
        id: '68b0fa35233b6646089ab09b',
        action: 'delete',
        reasoning: 'Too vague ("Reservoir Dogs") without clear album context'
      },
      {
        id: '68b0fa35233b6646089ab088',
        action: 'keep',
        reasoning: 'Detailed music opinion, might be valuable'
      },
      {
        id: '68b0fa35233b6646089ab08b',
        action: 'keep',
        reasoning: 'Personal reminiscence, has emotional value'
      },
      {
        id: '68b0fa35233b6646089ab08f',
        action: 'keep',
        reasoning: 'Music opinion, could be valuable'
      }
    ];

    console.log('🤔 RECOMMENDED ACTIONS:');
    console.log('========================\\n');

    let deletedCount = 0;
    let keptCount = 0;

    for (const decision of decisions) {
      const comment = orphanedComments.find(c => c._id.toString() === decision.id);
      if (!comment) continue;

      console.log(`📝 "${comment.content.substring(0, 50)}..."`);
      console.log(`   Action: ${decision.action.toUpperCase()}`);
      console.log(`   Reasoning: ${decision.reasoning}`);

      if (decision.action === 'delete') {
        // Uncomment to actually delete:
        // await db.collection('comments').deleteOne({ _id: comment._id });
        deletedCount++;
        console.log(`   🗑️  Would delete this comment`);
      } else {
        keptCount++;
        console.log(`   💾 Keep as historical comment (album reference lost)`);
      }
      console.log('');
    }

    console.log('\\n📊 FINAL RECOMMENDATION:');
    console.log('=========================');
    console.log(`Comments to keep: ${keptCount} (meaningful content, preserve as historical)`);
    console.log(`Comments to delete: ${deletedCount} (insufficient context)`);
    console.log('');

    if (deletedCount > 0) {
      console.log('⚠️  To actually delete the recommended comments,');
      console.log('   uncomment the deletion line in the script and run again.');
      console.log('');
    }

    console.log('🎯 SUMMARY OF ALL COMMENT-ALBUM MATCHING:');
    console.log('=========================================');
    console.log('• Started with: 38 orphaned comments (all had album: null)');
    console.log('• Successfully matched: 29 comments to their albums');
    console.log('• Deleted low-quality: 4 comments (spam/minimal content)');
    console.log('• Remaining orphaned: 5 comments');
    console.log('  - 4 recommended to keep as historical (meaningful content)');
    console.log('  - 1 recommended for deletion (insufficient context)');
    console.log('');
    console.log('✅ MISSION ACCOMPLISHED: 76% of comments successfully matched!');
    console.log('   The remaining comments are either historically valuable or edge cases.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);