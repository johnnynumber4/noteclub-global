#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const fs = require('fs');

async function debugThemes() {
  const client = new MongoClient('mongodb+srv://jyoungiv_db_user:iLh3sgpMklDaBx1p@cluster0.twifgsh.mongodb.net/note-club-modern?retryWrites=true&w=majority&appName=Cluster0');

  try {
    await client.connect();
    const db = client.db('note-club-modern');
    const themes = db.collection('themes');

    // Get all themes
    const allThemes = await themes.find({}).toArray();
    console.log('Available themes:');
    allThemes.forEach(theme => console.log(`- ${theme.title} (ID: ${theme._id})`));

    // Load noteclub data and see what themes we're trying to match
    const noteclubsData = JSON.parse(fs.readFileSync('./exports/noteclubs.json', 'utf8'));
    const uniqueThemes = new Set();

    for (const noteclub of noteclubsData) {
      if (noteclub.theme && noteclub.theme.trim()) {
        uniqueThemes.add(noteclub.theme);
      }
    }

    console.log('\nUnique themes from migrated data:');
    Array.from(uniqueThemes).forEach(theme => console.log(`- "${theme}"`));

    // Test the mapping
    const normalizeTheme = (str) => str.toLowerCase().trim();

    // Create a map with better matching
    const themeMap = {};
    for (const theme of allThemes) {
      const themeTitle = theme.title.toLowerCase();

      if (themeTitle.includes('80')) {
        themeMap[normalizeTheme('80s')] = theme._id;
        themeMap[normalizeTheme("80's")] = theme._id;
        themeMap[normalizeTheme('80s ')] = theme._id;
        themeMap[normalizeTheme("80's ")] = theme._id;
      }
    }

    console.log('\nTesting 80s mapping:');
    console.log('80s ->', themeMap[normalizeTheme('80s')]);
    console.log("80's ->", themeMap[normalizeTheme("80's")]);
    console.log("80's  ->", themeMap[normalizeTheme("80's ")]);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

debugThemes();