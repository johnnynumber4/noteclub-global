const fs = require('fs').promises;
const path = require('path');
const { MongoClient } = require('mongodb');

// New database connection - use your current app's MongoDB URI
const NEW_MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/note-club-modern';

async function transformAndImport() {
  console.log('🔄 Starting data transformation and import...');
  
  try {
    // Read exported data
    const exportsDir = path.join(__dirname, '..', 'exports');
    
    const postsData = JSON.parse(await fs.readFile(path.join(exportsDir, 'posts.json'), 'utf8'));
    const usersData = JSON.parse(await fs.readFile(path.join(exportsDir, 'users.json'), 'utf8'));
    const commentsData = JSON.parse(await fs.readFile(path.join(exportsDir, 'comments.json'), 'utf8'));
    const noteclubsData = JSON.parse(await fs.readFile(path.join(exportsDir, 'noteclubs.json'), 'utf8'));
    
    console.log(`📊 Found ${postsData.length} posts, ${usersData.length} users, ${commentsData.length} comments, ${noteclubsData.length} noteclub entries`);
    
    // Connect to new database
    const client = new MongoClient(NEW_MONGODB_URI);
    await client.connect();
    console.log('✓ Connected to new MongoDB database');
    
    const db = client.db();
    
    // Transform and import users
    console.log('👥 Transforming users...');
    const transformedUsers = usersData.map(user => ({
      _id: user._id,
      email: user.email,
      name: user.name,
      username: user.username,
      bio: user.bio || '',
      profilePicture: user.profilePicture,
      password: user.password,
      emailVerified: user.emailVerified || false,
      
      // New fields for enhanced schema
      preferences: {
        notifications: {
          turnReminders: true,
          newAlbums: true,
          comments: true,
          likes: false
        },
        privacy: {
          profileVisible: true,
          albumHistoryVisible: true
        }
      },
      
      statistics: {
        albumsPosted: 0, // Will calculate this
        commentsGiven: 0,
        likesReceived: 0,
        favoriteGenres: []
      },
      
      // Group management
      groups: [], // Will populate from context
      currentGroup: null,
      
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    
    // Clear existing users and insert transformed ones
    await db.collection('users').deleteMany({});
    await db.collection('users').insertMany(transformedUsers);
    console.log(`✓ Imported ${transformedUsers.length} users`);
    
    // Create a default group for all users
    const defaultGroup = {
      name: "Original Note Club",
      description: "Migrated from the original Note Club",
      isPrivate: true,
      members: transformedUsers.map(u => ({
        user: u._id,
        role: 'member',
        joinedAt: new Date()
      })),
      createdBy: transformedUsers[0]._id, // First user as creator
      settings: {
        turnOrder: 'alphabetical',
        allowGuestPosts: false,
        requireApproval: false
      },
      stats: {
        totalAlbums: postsData.length,
        totalMembers: transformedUsers.length,
        activeMembers: transformedUsers.length
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('groups').deleteMany({});
    const groupResult = await db.collection('groups').insertOne(defaultGroup);
    const groupId = groupResult.insertedId;
    console.log(`✓ Created default group: ${groupId}`);
    
    // Update users with group membership
    await db.collection('users').updateMany(
      {},
      { 
        $set: { 
          currentGroup: groupId,
          groups: [groupId]
        }
      }
    );
    
    // Create a default theme
    const defaultTheme = {
      name: "Migrated Albums",
      description: "Albums migrated from original Note Club",
      isActive: true,
      group: groupId,
      createdBy: transformedUsers[0]._id,
      albumCount: postsData.length,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await db.collection('themes').deleteMany({});
    const themeResult = await db.collection('themes').insertOne(defaultTheme);
    const themeId = themeResult.insertedId;
    console.log(`✓ Created default theme: ${themeId}`);
    
    // Transform and import posts as albums
    console.log('💿 Transforming posts to albums...');
    
    // Create user lookup for author names
    const userLookup = {};
    transformedUsers.forEach(user => {
      userLookup[user._id] = user;
    });
    
    const transformedAlbums = postsData.map(post => ({
      title: post.albumTitle,
      artist: post.albumArtist,
      
      // Music service links (from old data)
      links: {
        youtubeMusic: post.yt ? `https://music.youtube.com/playlist?list=${post.yt}` : null,
        spotify: null, // Not in old data
        appleMusic: null // Not in old data
      },
      
      // Artwork and metadata
      artwork: {
        small: post.albumArt,
        medium: post.albumArt,
        large: post.albumArt
      },
      
      description: post.content || '',
      wikipediaDescription: post.wikiDesc || null,
      
      // User and group info
      author: post.author,
      group: groupId,
      theme: themeId,
      
      // Engagement
      likes: [],
      comments: [], // Will populate separately
      views: Math.floor(Math.random() * 50), // Random views for migrated content
      
      // Metadata
      genres: [], // Could be extracted from Wikipedia description
      releaseYear: null, // Could be parsed from Wikipedia
      isExplicit: false,
      
      // Status
      status: 'published',
      
      // Timestamps
      createdAt: new Date(post.createdAt),
      updatedAt: new Date()
    }));
    
    await db.collection('albums').deleteMany({});
    const albumResults = await db.collection('albums').insertMany(transformedAlbums);
    console.log(`✓ Imported ${transformedAlbums.length} albums`);
    
    // Transform and import comments
    console.log('💬 Transforming comments...');
    
    // Note: Comments in old schema might need different handling
    // For now, create basic structure
    const transformedComments = commentsData.map(comment => ({
      content: comment.content || comment.text || '',
      author: comment.author || comment.user,
      album: comment.post || null, // Will need to map post IDs to album IDs
      likes: [],
      createdAt: new Date(comment.createdAt || Date.now()),
      updatedAt: new Date()
    })).filter(comment => comment.content); // Only comments with content
    
    if (transformedComments.length > 0) {
      await db.collection('comments').deleteMany({});
      await db.collection('comments').insertMany(transformedComments);
      console.log(`✓ Imported ${transformedComments.length} comments`);
    }
    
    // Update user statistics
    console.log('📊 Updating user statistics...');
    for (const user of transformedUsers) {
      const userAlbumsCount = transformedAlbums.filter(album => album.author === user._id).length;
      const userCommentsCount = transformedComments.filter(comment => comment.author === user._id).length;
      
      await db.collection('users').updateOne(
        { _id: user._id },
        { 
          $set: { 
            'statistics.albumsPosted': userAlbumsCount,
            'statistics.commentsGiven': userCommentsCount
          }
        }
      );
    }
    
    console.log('✅ Data transformation and import completed successfully!');
    console.log(`
📈 Migration Summary:
- ${transformedUsers.length} users migrated
- ${transformedAlbums.length} albums migrated (from posts)
- ${transformedComments.length} comments migrated
- 1 default group created
- 1 default theme created
    `);
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error during transformation and import:', error);
  }
}

// Run if called directly
if (require.main === module) {
  transformAndImport();
}

module.exports = { transformAndImport };