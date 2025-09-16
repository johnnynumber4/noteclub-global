#!/usr/bin/env node

const { MongoClient } = require('mongodb');
const { ObjectId } = require('mongodb');

async function createRandomTheme() {
  const client = new MongoClient('mongodb://localhost:27017/note-club-modern');
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db('note-club-modern');
    const themes = db.collection('themes');
    const users = db.collection('users');
    
    // Check if Random theme already exists
    const existingTheme = await themes.findOne({ 
      title: { $regex: /^random$/i } 
    });
    
    if (existingTheme) {
      console.log('Random theme already exists:', existingTheme.title);
      return;
    }
    
    // Get the first user (demo user) as creator
    const demoUser = await users.findOne({});
    if (!demoUser) {
      console.error('No users found. Please create a user first.');
      return;
    }
    
    // Create Random theme with very long duration
    const startDate = new Date('2020-01-01');
    const endDate = new Date('2030-12-31');
    
    const randomTheme = {
      title: 'Random',
      description: 'Share any album you love - no theme restrictions! Perfect for when you want to explore diverse music without constraints.',
      startDate,
      endDate,
      createdBy: demoUser._id,
      isActive: false, // Don't make it active by default
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
    
    const result = await themes.insertOne(randomTheme);
    console.log('✅ Created Random theme:', result.insertedId);
    console.log('Theme details:', {
      title: randomTheme.title,
      description: randomTheme.description,
      startDate: randomTheme.startDate.toISOString(),
      endDate: randomTheme.endDate.toISOString()
    });
    
  } catch (error) {
    console.error('Error creating Random theme:', error);
  } finally {
    await client.close();
  }
}

createRandomTheme();