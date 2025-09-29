#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const fs = require('fs');

async function applyThemesFinal() {
  const client = new MongoClient('mongodb+srv://jyoungiv_db_user:iLh3sgpMklDaBx1p@cluster0.twifgsh.mongodb.net/note-club-modern?retryWrites=true&w=majority&appName=Cluster0');

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('note-club-modern');
    const themes = db.collection('themes');
    const albums = db.collection('albums');

    // Get all themes
    const allThemes = await themes.find({}).toArray();

    // Create comprehensive theme mapping
    const themeMap = new Map();

    // Helper function to add mapping
    const addMapping = (key, themeId) => {
      const normalizedKey = key.toLowerCase().trim();
      themeMap.set(normalizedKey, themeId);
    };

    for (const theme of allThemes) {
      const title = theme.title.toLowerCase();

      if (title === '80s') {
        addMapping('80s', theme._id);
        addMapping("80's", theme._id);
        addMapping('80s ', theme._id);
        addMapping("80's ", theme._id);
      } else if (title === 'female singers') {
        addMapping('female singers', theme._id);
        addMapping('female singers ', theme._id);
        addMapping('chicks who sing', theme._id);
        addMapping('women lead singers <3', theme._id);
        addMapping('more ladies', theme._id);
      } else if (title === 'shit that slaps') {
        addMapping('💩 that slaps', theme._id);
        addMapping('💩that slaps ', theme._id);
        addMapping('shit that slaps', theme._id);
        addMapping('shit that slaps', theme._id);
        addMapping('slappers only', theme._id);
        addMapping('slappers', theme._id);
        addMapping('slap that like button', theme._id);
      } else if (title === 'ivories') {
        addMapping('ivories', theme._id);
      } else if (title === "favorite band's new music") {
        addMapping("favorite band's, new music ", theme._id);
        addMapping('old bands, new release ', theme._id);
        addMapping('favorite, but new', theme._id);
        addMapping('newest album/favorite band', theme._id);
      }
    }

    console.log(`Created mapping for ${themeMap.size} theme variations`);

    // Load the old posts data to map themes to albums
    const noteclubsData = JSON.parse(fs.readFileSync('./exports/noteclubs.json', 'utf8'));

    // Apply themes to existing albums
    let albumsUpdated = 0;
    let albumsNotFound = 0;
    const unmatchedThemes = new Set();

    console.log('\n🎵 Applying themes to existing albums...');

    for (const noteclub of noteclubsData) {
      if (noteclub.theme && noteclub.theme.trim()) {
        const themeKey = noteclub.theme.toLowerCase().trim();
        const themeId = themeMap.get(themeKey);

        if (themeId) {
          // Find the corresponding album by artist and album name
          const album = await albums.findOne({
            $and: [
              { artist: { $regex: new RegExp(noteclub.artist.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } },
              { title: { $regex: new RegExp(noteclub.album.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } }
            ]
          });

          if (album && !album.theme) {
            await albums.updateOne(
              { _id: album._id },
              { $set: { theme: themeId } }
            );
            albumsUpdated++;
            console.log(`  ✅ Applied "${noteclub.theme}" theme to "${album.artist} - ${album.title}"`);
          } else if (album && album.theme) {
            console.log(`  ⏭️  Album already has theme: "${album.artist} - ${album.title}"`);
          } else if (!album) {
            albumsNotFound++;
            console.log(`  ❓ Album not found: "${noteclub.artist} - ${noteclub.album}" (theme: ${noteclub.theme})`);
          }
        } else {
          unmatchedThemes.add(noteclub.theme);
        }
      }
    }

    console.log('\nUnmatched themes:');
    unmatchedThemes.forEach(theme => console.log(`  - "${theme}"`));

    // Update theme statistics
    console.log('\n📊 Updating theme statistics...');
    for (const theme of allThemes) {
      const albumCount = await albums.countDocuments({ theme: theme._id });
      await themes.updateOne(
        { _id: theme._id },
        { $set: { albumCount } }
      );
      if (albumCount > 0) {
        console.log(`  📈 ${theme.title}: ${albumCount} albums`);
      }
    }

    console.log('\n✅ Theme application completed!');
    console.log(`📊 Summary:`);
    console.log(`   - ${albumsUpdated} albums updated with themes`);
    console.log(`   - ${albumsNotFound} albums not found in database`);
    console.log(`   - ${unmatchedThemes.size} unmatched theme variations`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

applyThemesFinal();