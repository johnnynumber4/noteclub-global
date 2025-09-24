import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Group } from "@/models/Group";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Find current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find or create default group (handle migrated data)
    let defaultGroup = await Group.findOne({ 
      $or: [
        { name: 'Original Note Club' }, 
        { name: 'Note Club' },
        { name: 'Migrated Albums' }  // From the migration
      ] 
    });
    
    if (!defaultGroup) {
      // Create default group if it doesn't exist
      const allUsers = await User.find({}).sort({ name: 1 }); // Sort by first name
      const userIds = allUsers.map(user => user._id);
      
      console.log(`Creating default group with ${allUsers.length} users`);
      
      defaultGroup = new Group({
        name: 'Note Club',
        description: 'Default group for all Note Club members',
        isPrivate: false,
        inviteCode: 'DEFAULT',
        maxMembers: 100,
        members: userIds,
        admins: [currentUser._id],
        createdBy: currentUser._id,
        turnOrder: userIds, // Alphabetical order by name
        currentTurnIndex: 0,
        turnDurationDays: 7,
        totalAlbumsShared: 0,
        totalThemes: 0,
        allowMemberInvites: true,
        requireApprovalForAlbums: false,
        notifyOnNewAlbums: true,
      });
      await defaultGroup.save();
    } else {
      // Add current user if not already in group
      if (!defaultGroup.members.includes(currentUser._id)) {
        defaultGroup.members.push(currentUser._id);
        
        // Update turn order with alphabetical sorting
        const allGroupUsers = await User.find({ 
          _id: { $in: defaultGroup.members } 
        }).sort({ name: 1 });
        
        defaultGroup.turnOrder = allGroupUsers.map(user => user._id);
        await defaultGroup.save();
      }
    }

    // Populate current turn user info
    const currentTurnUserId = defaultGroup.turnOrder[defaultGroup.currentTurnIndex];
    const currentTurnUser = await User.findById(currentTurnUserId).select('name username image');
    
    // Get next turn user
    const nextTurnIndex = (defaultGroup.currentTurnIndex + 1) % defaultGroup.turnOrder.length;
    const nextTurnUserId = defaultGroup.turnOrder[nextTurnIndex];
    const nextTurnUser = await User.findById(nextTurnUserId).select('name username image');

    const isMyTurn = currentTurnUserId?.toString() === currentUser._id.toString();
    
    // Get all users in turn order for display
    const allTurnUsers = await User.find({ 
      _id: { $in: defaultGroup.turnOrder } 
    }).select('name username image');
    
    const orderedUsers = defaultGroup.turnOrder
      .map((userId: any) => allTurnUsers.find((user: any) => user._id.toString() === userId.toString()))
      .filter((user: any): user is NonNullable<typeof user> => user != null && user.name != null);

    return NextResponse.json({
      isMyTurn,
      currentTurnUser: currentTurnUser || null,
      nextTurnUser: nextTurnUser || null,
      currentTurnIndex: defaultGroup.currentTurnIndex,
      totalMembers: defaultGroup.members.length,
      turnOrder: orderedUsers,
      groupName: defaultGroup.name,
    });

  } catch (error) {
    console.error("Error fetching turn status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}