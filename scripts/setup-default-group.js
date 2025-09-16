const mongoose = require('mongoose');

// Directly set MongoDB URI from .env.local
const MONGODB_URI = 'mongodb://localhost:27017/note-club-modern';

// Import models (adjust for ES modules)
const Group = require('../src/models/Group').Group || require('../src/models/Group').default;
const { User } = require('../src/models/User');

async function setupDefaultGroup() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if default group already exists
    let defaultGroup = await Group.findOne({ name: 'Note Club' });
    
    if (defaultGroup) {
      console.log('Default group already exists:', defaultGroup.name, '(ID:', defaultGroup._id + ')');
    } else {
      // Create default group
      console.log('Creating default group...');
      
      // Get all users to add to the group
      const users = await User.find({});
      const userIds = users.map(user => user._id);
      
      defaultGroup = new Group({
        name: 'Note Club',
        description: 'Default group for all Note Club members',
        isPrivate: false,
        inviteCode: 'DEFAULT',
        maxMembers: 1000,
        members: userIds,
        admins: userIds.length > 0 ? [userIds[0]] : [], // First user becomes admin
        createdBy: userIds.length > 0 ? userIds[0] : new mongoose.Types.ObjectId(),
        turnOrder: userIds.sort(), // Alphabetical order by ObjectId
        currentTurnIndex: 0,
        turnDurationDays: 7,
        totalAlbumsShared: 0,
        totalThemes: 0,
        allowMemberInvites: true,
        requireApprovalForAlbums: false,
        notifyOnNewAlbums: true,
      });
      
      await defaultGroup.save();
      console.log('Created default group:', defaultGroup.name, '(ID:', defaultGroup._id + ')');
      console.log('Added', userIds.length, 'users to the group');
    }

    // Update all users to be in this group if they aren't already
    const allUsers = await User.find({});
    for (const user of allUsers) {
      if (!user.groups || !user.groups.includes(defaultGroup._id)) {
        if (!user.groups) user.groups = [];
        user.groups.push(defaultGroup._id);
        if (!user.currentGroup) {
          user.currentGroup = defaultGroup._id;
        }
        await user.save();
        console.log('Added user', user.name, 'to default group');
      }
    }

    console.log('Default group setup complete!');
    console.log('Group ID:', defaultGroup._id);
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting up default group:', error);
    process.exit(1);
  }
}

setupDefaultGroup();