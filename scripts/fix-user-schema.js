const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/note-club-modern';

async function fixUserSchema() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    
    console.log('🔄 Fixing user schema to match current User model...');
    
    const users = await db.collection('users').find({}).toArray();
    console.log(`Found ${users.length} users to update`);
    
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`Updating user ${i+1}/${users.length}: ${user.name}`);
      
      const updatedUser = {
        // Keep existing fields
        _id: user._id,
        name: user.name,
        email: user.email,
        password: user.password,
        username: user.username,
        bio: user.bio || '',
        profilePicture: user.profilePicture,
        emailVerified: user.emailVerified,
        
        // Add missing schema fields with defaults
        image: user.profilePicture, // Map profilePicture to image
        favoriteGenres: user.favoriteGenres || [],
        musicPlatforms: user.musicPlatforms || {
          spotify: null,
          youtubeMusic: null,
          appleMusic: null,
          tidal: null,
          deezer: null
        },
        
        turnOrder: user.turnOrder || i, // Assign based on array index
        isActive: user.isActive !== undefined ? user.isActive : true,
        lastPostDate: user.lastPostDate || null,
        totalAlbumsPosted: user.totalAlbumsPosted || 0,
        location: user.location || null,
        
        albumsPosted: user.albumsPosted || 0,
        commentsPosted: user.commentsPosted || 0,
        likesGiven: user.likesGiven || 0,
        likesReceived: user.likesReceived || 0,
        
        notificationSettings: user.notificationSettings || {
          newThemes: true,
          turnReminders: true,
          comments: true,
          likes: false,
          emails: true
        },
        
        role: user.role || 'member',
        isVerified: user.isVerified !== undefined ? user.isVerified : false,
        isBanned: user.isBanned !== undefined ? user.isBanned : false,
        lastActive: user.lastActive || new Date(),
        joinedAt: user.joinedAt || user.createdAt || new Date(),
        
        // Timestamps
        createdAt: user.createdAt || new Date(),
        updatedAt: new Date(),
        
        // Remove Mongoose versioning
        __v: 0
      };
      
      // Replace the entire document
      await db.collection('users').replaceOne(
        { _id: user._id },
        updatedUser
      );
    }
    
    console.log('✅ All users updated successfully');
    
    // Verify one user
    const sampleUser = await db.collection('users').findOne({ email: 'jyoungiv@gmail.com' });
    console.log('Sample updated user fields:', Object.keys(sampleUser).sort());
    
  } catch (error) {
    console.error('❌ Error fixing user schema:', error);
  } finally {
    await client.close();
  }
}

fixUserSchema();