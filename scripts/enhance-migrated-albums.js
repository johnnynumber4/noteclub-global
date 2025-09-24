#!/usr/bin/env node

/**
 * Enhancement Script: Fill Missing Album Data
 * Uses the unified search to enhance migrated albums with missing data
 */

const mongoose = require('mongoose');
const fetch = require('node-fetch');

async function enhanceAlbumData() {
  try {
    console.log('🔍 Starting album data enhancement...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/note-club-modern');
    console.log('✅ Connected to MongoDB');
    
    // Get Album model
    const Album = require('../src/models/Album.ts').default;
    
    // Find albums that need enhancement (missing Apple Music or other data)
    const albumsToEnhance = await Album.find({
      $or: [
        { appleMusicUrl: { $in: ['', null, undefined] } },
        { genre: { $in: ['', null, undefined] } },
        { year: { $in: [null, undefined] } }
      ]
    }).limit(50); // Process in batches to avoid rate limits
    
    console.log(`📊 Found ${albumsToEnhance.length} albums to enhance`);
    
    if (albumsToEnhance.length === 0) {
      console.log('ℹ️ No albums need enhancement');
      return;
    }
    
    let enhanced = 0;
    let errors = 0;
    
    // Process each album
    for (const album of albumsToEnhance) {
      try {
        console.log(`🎵 Enhancing: "${album.title}" by ${album.artist}`);
        
        // Use the unified search to get enhanced data
        const searchResponse = await fetch(
          `http://localhost:3000/api/music/search-all?q=${encodeURIComponent(`${album.title} ${album.artist}`)}&limit=1`
        );
        
        if (!searchResponse.ok) {
          throw new Error(`Search API returned ${searchResponse.status}`);
        }
        
        const searchData = await searchResponse.json();
        const searchResults = searchData.albums || [];
        
        if (searchResults.length > 0) {
          const enhancedData = searchResults[0];
          let updates = {};
          
          // Fill missing Apple Music URL
          if (!album.appleMusicUrl && enhancedData.appleMusicUrl) {
            updates.appleMusicUrl = enhancedData.appleMusicUrl;
            console.log('   📱 Added Apple Music link');
          }
          
          // Fill missing genre
          if (!album.genre && enhancedData.genre) {
            updates.genre = enhancedData.genre;
            console.log(`   🎭 Added genre: ${enhancedData.genre}`);
          }
          
          // Fill missing year
          if (!album.year && enhancedData.year) {
            updates.year = enhancedData.year;
            console.log(`   📅 Added year: ${enhancedData.year}`);
          }
          
          // Fill missing track count
          if (!album.trackCount && enhancedData.trackCount) {
            updates.trackCount = enhancedData.trackCount;
            console.log(`   💿 Added track count: ${enhancedData.trackCount}`);
          }
          
          // Fill missing duration
          if (!album.duration && enhancedData.duration) {
            updates.duration = enhancedData.duration;
            console.log(`   ⏱️ Added duration: ${enhancedData.duration}s`);
          }
          
          // Update better cover image if current one is low quality
          if (enhancedData.thumbnail && 
              (!album.coverImageUrl || album.coverImageUrl.includes('60x60') || album.coverImageUrl.includes('100x100'))) {
            updates.coverImageUrl = enhancedData.thumbnail;
            console.log('   🖼️ Updated cover image');
          }
          
          // Apply updates if any
          if (Object.keys(updates).length > 0) {
            await Album.updateOne({ _id: album._id }, { $set: updates });
            enhanced++;
            console.log(`   ✅ Enhanced with ${Object.keys(updates).length} fields`);
          } else {
            console.log('   ℹ️ No enhancements needed');
          }
          
        } else {
          console.log('   ⚠️ No search results found');
        }
        
        // Add small delay to be respectful to APIs
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        errors++;
        console.error(`   ❌ Error enhancing "${album.title}":`, error.message);
      }
    }
    
    console.log('\n🎉 Enhancement completed!');
    console.log(`   ✅ Successfully enhanced: ${enhanced} albums`);
    console.log(`   ❌ Errors: ${errors} albums`);
    console.log(`   📊 Success rate: ${((enhanced / albumsToEnhance.length) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('💥 Enhancement failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run enhancement if called directly
if (require.main === module) {
  enhanceAlbumData();
}

module.exports = { enhanceAlbumData };