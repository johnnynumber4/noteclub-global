import mongoose from 'mongoose';
import dbConnect from '../src/lib/mongodb.js';
import { User } from '../src/models/User.js';
import { Group } from '../src/models/Group.js';

async function setupDefaultGroup() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await dbConnect();
    console.log('✅ Connected to MongoDB');

    // Check if default group already exists
    let defaultGroup = await Group.findOne({ 
      $or: [{ name: 'Note Club' }, { name: 'Original Note Club' }] 
    });
    
    if (defaultGroup) {
      console.log(`✅ Default group already exists: ${defaultGroup.name} (ID: ${defaultGroup._id})`);
    } else {
      console.log('📝 Creating default group...');
      
      // Get all users to add to the group, sorted by name for alphabetical order
      const users = await User.find({}).sort({ name: 1 });
      const userIds = users.map(user => user._id);
      
      console.log(`👥 Found ${users.length} users to add to group`);
      
      defaultGroup = new Group({
        name: 'Note Club',
        description: 'Default group for all Note Club members',
        isPrivate: false,
        inviteCode: 'DEFAULT',
        maxMembers: 1000,
        members: userIds,
        admins: userIds.length > 0 ? [userIds[0]] : [], // First user becomes admin
        createdBy: userIds.length > 0 ? userIds[0] : new mongoose.Types.ObjectId(),
        turnOrder: userIds, // Already sorted by name
        currentTurnIndex: 0,
        turnDurationDays: 7,
        totalAlbumsShared: 0,
        totalThemes: 0,
        allowMemberInvites: true,
        requireApprovalForAlbums: false,
        notifyOnNewAlbums: true,
      });
      
      await defaultGroup.save();
      console.log(`✅ Created default group: ${defaultGroup.name} (ID: ${defaultGroup._id})`);
      console.log(`👥 Added ${userIds.length} users to the group`);
    }

    // Display current turn status
    const currentTurnUserId = defaultGroup.turnOrder[defaultGroup.currentTurnIndex];
    if (currentTurnUserId) {
      const currentTurnUser = await User.findById(currentTurnUserId);
      console.log(`🎯 Current turn: ${currentTurnUser?.name || 'Unknown User'} (${currentTurnUser?.email || 'No email'})`);
    }

    console.log('🎉 Default group setup complete!');
    console.log(`📊 Group ID: ${defaultGroup._id}`);
    console.log(`👥 Total members: ${defaultGroup.members.length}`);
    console.log(`🔄 Turn order length: ${defaultGroup.turnOrder.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up default group:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

setupDefaultGroup();