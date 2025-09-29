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

    // Get all orphaned comments and all albums
    const orphanedComments = await db.collection('comments').find({ album: null }).toArray();
    const albums = await db.collection('albums').find({}).toArray();

    console.log(`Found ${orphanedComments.length} orphaned comments and ${albums.length} albums`);

    // Let's try to match based on content hints
    let potentialMatches = [];

    for (const comment of orphanedComments) {
      const content = comment.content.toLowerCase();

      // Look for specific musical terms, band names, or album references in the content
      const musicKeywords = [];

      // Extract potential band/album names from comment content
      if (content.includes('dio')) musicKeywords.push('dio');
      if (content.includes('killswitch')) musicKeywords.push('killswitch', 'killswitch engage');
      if (content.includes('rtj')) musicKeywords.push('rtj', 'run the jewels');
      if (content.includes('zappa')) musicKeywords.push('zappa', 'frank zappa');
      if (content.includes('stones')) musicKeywords.push('stones', 'rolling stones');
      if (content.includes('beatles')) musicKeywords.push('beatles');
      if (content.includes('holy diver')) musicKeywords.push('holy diver');
      if (content.includes('reservoir dogs')) musicKeywords.push('reservoir dogs');
      if (content.includes('covers album')) musicKeywords.push('cover', 'covers');

      // Search albums for matches
      const matchingAlbums = [];

      for (const album of albums) {
        const albumText = `${album.title} ${album.artist} ${album.description || ''}`.toLowerCase();

        for (const keyword of musicKeywords) {
          if (albumText.includes(keyword)) {
            matchingAlbums.push({
              album,
              keyword,
              confidence: keyword.length > 3 ? 'high' : 'medium'
            });
            break; // Only add each album once
          }
        }
      }

      if (matchingAlbums.length > 0) {
        potentialMatches.push({
          comment,
          matches: matchingAlbums,
          keywords: musicKeywords
        });

        console.log(`\\n🎵 Comment: "${comment.content.substring(0, 60)}..."`);
        console.log(`   Keywords found: ${musicKeywords.join(', ')}`);
        console.log(`   Potential matches (${matchingAlbums.length}):`);

        matchingAlbums.forEach((match, idx) => {
          console.log(`   ${idx + 1}. "${match.album.title}" by ${match.album.artist} (${match.confidence} confidence)`);
          console.log(`      Posted: ${match.album.postedAt?.toISOString().split('T')[0] || 'Unknown'}`);
          console.log(`      Match: ${match.keyword}`);
        });
      }
    }

    console.log(`\\n📊 CONTENT MATCHING RESULTS:`);
    console.log(`Comments with potential matches: ${potentialMatches.length}`);
    console.log(`Comments with no matches: ${orphanedComments.length - potentialMatches.length}`);

    // Show high-confidence matches that we could auto-fix
    const highConfidenceMatches = potentialMatches.filter(pm =>
      pm.matches.length === 1 && pm.matches[0].confidence === 'high'
    );

    if (highConfidenceMatches.length > 0) {
      console.log(`\\n✅ HIGH CONFIDENCE MATCHES (${highConfidenceMatches.length}):`);
      console.log('These could be automatically fixed:');

      for (const match of highConfidenceMatches) {
        const comment = match.comment;
        const album = match.matches[0].album;
        console.log(`\\n🔗 Comment: "${comment.content.substring(0, 50)}..."`);
        console.log(`   -> Album: "${album.title}" by ${album.artist}`);
        console.log(`   -> Would update comment ${comment._id} to reference album ${album._id}`);

        // Apply the high-confidence fix:
        await db.collection('comments').updateOne(
          { _id: comment._id },
          { $set: { album: album._id } }
        );
        console.log('   ✅ Updated!');
      }

      console.log(`\\n✅ Applied ${highConfidenceMatches.length} high-confidence fixes!`);
    }

    // Show ambiguous matches that need manual review
    const ambiguousMatches = potentialMatches.filter(pm =>
      pm.matches.length > 1 || pm.matches[0].confidence !== 'high'
    );

    if (ambiguousMatches.length > 0) {
      console.log(`\\n⚠️  AMBIGUOUS MATCHES (${ambiguousMatches.length}):`);
      console.log('These need manual review:');

      ambiguousMatches.slice(0, 5).forEach(match => {
        console.log(`\\n❓ Comment: "${match.comment.content.substring(0, 50)}..."`);
        console.log(`   Multiple possible albums:`);
        match.matches.forEach((m, idx) => {
          console.log(`   ${idx + 1}. "${m.album.title}" by ${m.album.artist}`);
        });
      });

      if (ambiguousMatches.length > 5) {
        console.log(`   ... and ${ambiguousMatches.length - 5} more`);
      }
    }

    // Comments with no matches - these might need to be deleted
    const unmatchedComments = orphanedComments.filter(comment =>
      !potentialMatches.some(pm => pm.comment._id.toString() === comment._id.toString())
    );

    if (unmatchedComments.length > 0) {
      console.log(`\\n🗑️  UNMATCHED COMMENTS (${unmatchedComments.length}):`);
      console.log('These might need to be deleted:');

      unmatchedComments.slice(0, 5).forEach(comment => {
        console.log(`   - "${comment.content.substring(0, 50)}..." (${comment.createdAt?.toISOString().split('T')[0] || 'No date'})`);
      });

      if (unmatchedComments.length > 5) {
        console.log(`   ... and ${unmatchedComments.length - 5} more`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);