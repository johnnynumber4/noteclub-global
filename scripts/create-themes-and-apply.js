#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const fs = require('fs');

async function createThemesAndApply() {
  const client = new MongoClient('mongodb+srv://jyoungiv_db_user:iLh3sgpMklDaBx1p@cluster0.twifgsh.mongodb.net/note-club-modern?retryWrites=true&w=majority&appName=Cluster0');

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('note-club-modern');
    const themes = db.collection('themes');
    const albums = db.collection('albums');
    const users = db.collection('users');

    // Get the first user as the creator for themes
    const demoUser = await users.findOne({});
    if (!demoUser) {
      console.error('No users found. Please create a user first.');
      return;
    }

    // Define themes based on migrated data
    const themesToCreate = [
      {
        title: '80s',
        description: 'Albums from the 1980s - the decade of synthesizers, new wave, and iconic pop music',
        guidelines: 'Any album released in the 1980s (1980-1989). Focus on music that captures the distinctive sound and spirit of the decade.',
        examples: ['New Order - Power, Corruption & Lies', 'Duran Duran - Rio', 'Prince - Purple Rain', 'Talking Heads - Remain in Light']
      },
      {
        title: 'Female Singers',
        description: 'Albums featuring female lead vocals - celebrating the power and artistry of women in music',
        guidelines: 'Albums with female lead singers or where female vocals are the primary focus. Can be solo artists or bands fronted by women.',
        examples: ['Joni Mitchell - Blue', 'Björk - Homogenic', 'Fiona Apple - Tidal', 'Aretha Franklin - I Never Loved a Man']
      },
      {
        title: 'Shit That Slaps',
        description: 'Albums that absolutely go hard - high energy music that hits different',
        guidelines: 'Albums with incredible energy, driving rhythms, and memorable hooks that get your blood pumping. Any genre welcome as long as it slaps.',
        examples: ['Death Grips - The Money Store', 'Run the Jewels - RTJ2', 'Lightning Bolt - Wonderful Rainbow', 'Power Trip - Nightmare Logic']
      },
      {
        title: 'Ivories',
        description: 'Piano-driven albums - showcasing the beauty and versatility of piano in music',
        guidelines: 'Albums where piano/keyboards play a central role in the composition and sound. From jazz to classical to rock to electronic.',
        examples: ['Bill Evans - Waltz for Debby', 'Radiohead - OK Computer', 'Herbie Hancock - Head Hunters', 'Nils Frahm - All Melody']
      },
      {
        title: 'Favorite Band\'s New Music',
        description: 'Latest releases from your favorite established artists - exploring how beloved bands evolve',
        guidelines: 'Recent albums from bands/artists you already love. Focus on how they\'ve grown, evolved, or returned to form.',
        examples: ['Tool - Fear Inoculum', 'My Bloody Valentine - m b v', 'Sufjan Stevens - The Ascension', 'King Gizzard - PetroDragonic Apocalypse']
      }
    ];

    // Create themes if they don't exist
    const createdThemes = [];
    for (const themeData of themesToCreate) {
      const existing = await themes.findOne({
        title: { $regex: new RegExp(`^${themeData.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
      });

      if (!existing) {
        const theme = {
          title: themeData.title,
          description: themeData.description,
          startDate: new Date('2020-01-01'),
          endDate: new Date('2030-12-31'),
          createdBy: demoUser._id,
          isActive: false,
          guidelines: themeData.guidelines,
          examples: themeData.examples,
          imageUrl: null,
          albumCount: 0,
          participantCount: 0,
          currentTurn: 1,
          maxTurns: null,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await themes.insertOne(theme);
        theme._id = result.insertedId;
        createdThemes.push(theme);
        console.log(`✅ Created theme: ${theme.title}`);
      } else {
        createdThemes.push(existing);
        console.log(`📋 Theme already exists: ${existing.title}`);
      }
    }

    // Check if Random theme exists, create if not, but don't force it to be active
    const randomTheme = await themes.findOne({
      title: { $regex: /^random$/i }
    });

    if (!randomTheme) {
      const theme = {
        title: 'Random',
        description: 'Share any album you love - no theme restrictions! Perfect for when you want to explore diverse music without constraints.',
        startDate: new Date('2020-01-01'),
        endDate: new Date('2030-12-31'),
        createdBy: demoUser._id,
        isActive: false, // Don't force it to be active if another theme is already active
        guidelines: 'Any album from any genre, era, or style is welcome. This is your chance to share hidden gems, classics, or personal favorites without any thematic constraints.',
        examples: ['Any album you love', 'Hidden gems', 'Personal favorites', 'Random discoveries'],
        imageUrl: null,
        albumCount: 0,
        participantCount: 0,
        currentTurn: 1,
        maxTurns: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await themes.insertOne(theme);
      createdThemes.push(theme);
      console.log(`✅ Created Random theme`);
    } else {
      console.log(`📋 Random theme already exists`);
    }

    // Check which theme is currently active
    const activeTheme = await themes.findOne({ isActive: true });
    if (activeTheme) {
      console.log(`🎯 Currently active theme: ${activeTheme.title}`);
    } else {
      console.log(`⚠️  No active theme found`);
    }

    // Load the old posts data to map themes to albums
    console.log('\n📚 Reading migrated data...');
    const noteclubsData = JSON.parse(fs.readFileSync('./exports/noteclubs.json', 'utf8'));

    // Create a map of theme names to theme IDs
    const themeMap = {};
    const allThemes = await themes.find({}).toArray();

    // Helper function to normalize theme keys
    const normalizeTheme = (str) => str.toLowerCase().trim();

    for (const theme of allThemes) {
      const themeTitle = theme.title.toLowerCase();

      // Map various theme name variations to the same theme
      if (themeTitle.includes('80')) {
        themeMap[normalizeTheme('80s')] = theme._id;
        themeMap[normalizeTheme("80's")] = theme._id;
        themeMap[normalizeTheme('80s ')] = theme._id;
        themeMap[normalizeTheme("80's ")] = theme._id;
        themeMap[normalizeTheme('80s')] = theme._id;
      } else if (themeTitle.includes('female') || themeTitle.includes('women') || themeTitle.includes('singer')) {
        themeMap[normalizeTheme('female singers')] = theme._id;
        themeMap[normalizeTheme('female singers ')] = theme._id;
        themeMap[normalizeTheme('Female Singers')] = theme._id;
        themeMap[normalizeTheme('chicks who sing')] = theme._id;
        themeMap[normalizeTheme('women lead singers <3')] = theme._id;
        themeMap[normalizeTheme('more ladies')] = theme._id;
      } else if (themeTitle.includes('slap') || themeTitle.includes('shit')) {
        themeMap[normalizeTheme('💩 that slaps')] = theme._id;
        themeMap[normalizeTheme('💩that slaps ')] = theme._id;
        themeMap[normalizeTheme('shit that slaps')] = theme._id;
        themeMap[normalizeTheme('Shit That Slaps')] = theme._id;
        themeMap[normalizeTheme('slappers only')] = theme._id;
        themeMap[normalizeTheme('slappers')] = theme._id;
        themeMap[normalizeTheme('slap that like button')] = theme._id;
      } else if (themeTitle === 'ivories') {
        themeMap[normalizeTheme('ivories')] = theme._id;
      } else if (themeTitle.includes('favorite') || themeTitle.includes('new')) {
        themeMap[normalizeTheme("favorite band's, new music ")] = theme._id;
        themeMap[normalizeTheme('old bands, new release ')] = theme._id;
        themeMap[normalizeTheme('favorite, but new')] = theme._id;
        themeMap[normalizeTheme('newest album/favorite band')] = theme._id;
      }
    }

    console.log('📋 Theme mapping created:', Object.keys(themeMap).length, 'variations mapped');

    // Apply themes to existing albums based on original noteclub entries
    let albumsUpdated = 0;
    let albumsNotFound = 0;

    console.log('\n🎵 Applying themes to existing albums...');

    for (const noteclub of noteclubsData) {
      if (noteclub.theme && noteclub.theme.trim()) {
        const themeKey = normalizeTheme(noteclub.theme);
        const themeId = themeMap[themeKey];

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
          } else if (!album) {
            albumsNotFound++;
            console.log(`  ❓ Album not found: "${noteclub.artist} - ${noteclub.album}" (theme: ${noteclub.theme})`);
          }
        } else {
          console.log(`  ⚠️  Unknown theme: "${noteclub.theme}" for "${noteclub.artist} - ${noteclub.album}"`);
        }
      }
    }

    // Update theme statistics
    console.log('\n📊 Updating theme statistics...');
    for (const theme of allThemes) {
      const albumCount = await albums.countDocuments({ theme: theme._id });
      if (albumCount > 0) {
        await themes.updateOne(
          { _id: theme._id },
          { $set: { albumCount } }
        );
        console.log(`  📈 ${theme.title}: ${albumCount} albums`);
      }
    }

    console.log('\n✅ Theme migration completed!');
    console.log(`📊 Summary:`);
    console.log(`   - ${createdThemes.length} themes available`);
    console.log(`   - ${albumsUpdated} albums updated with themes`);
    console.log(`   - ${albumsNotFound} albums not found in database`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

createThemesAndApply();