import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Group } from "@/models/Group";
import { User } from "@/models/User";

export const dynamic = 'force-dynamic';

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
        { name: "NoteClub OGs" },
        { name: "Original Note Club" },
        { name: "Note Club" },
        { name: "Migrated Albums" }, // From the migration
      ],
    });

    if (!defaultGroup) {
      // Create default group if it doesn't exist
      const allUsers = await User.find({}).sort({ name: 1 }); // Sort by first name
      const userIds = allUsers.map((user) => user._id);

      console.log(`Creating default group with ${allUsers.length} users`);

      defaultGroup = new Group({
        name: "NoteClub OGs",
        description: "Default group for all Note Club members",
        isPrivate: false,
        inviteCode: "DEFAULT",
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
          _id: { $in: defaultGroup.members },
        }).sort({ name: 1 });

        defaultGroup.turnOrder = allGroupUsers.map((user) => user._id);
        await defaultGroup.save();
      }
    }

    // Use Group model methods to get current and next turn users (handles inactive users)
    console.log(`Fetching turn users for group: ${defaultGroup.name}, currentTurnIndex: ${defaultGroup.currentTurnIndex}`);
    const currentTurnUser = await defaultGroup.getCurrentTurnUser();
    const nextTurnUser = await defaultGroup.getNextTurnUser();

    console.log('Current turn user:', currentTurnUser ? `${currentTurnUser.name} (${currentTurnUser._id})` : 'null');
    console.log('Next turn user:', nextTurnUser ? `${nextTurnUser.name} (${nextTurnUser._id})` : 'null');

    const isMyTurn =
      currentTurnUser?._id?.toString() === currentUser._id.toString();

    // Get all ACTIVE users for turn order display
    const allUsers = await User.find({ isActive: true }).select("name username image _id isActive");

    // Convert turnOrder IDs to strings for matching
    const turnOrderStrings = defaultGroup.turnOrder.map((id: any) => id.toString());
    const allTurnUsers = allUsers.filter((u) =>
      turnOrderStrings.includes(u._id.toString())
    );

    // Map turn order to ACTIVE users only in correct order
    const orderedUsers = defaultGroup.turnOrder
      .map((userId: any) =>
        allTurnUsers.find(
          (user: any) => user._id.toString() === userId.toString()
        )
      )
      .filter(
        (user: any): user is NonNullable<typeof user> =>
          user != null && user.name != null
      );

    // Find the current turn user's index in the FILTERED active users array
    const activeCurrentTurnIndex = orderedUsers.findIndex(
      (user: any) => user._id.toString() === currentTurnUser?._id?.toString()
    );

    console.log(`📊 Turn Status Response: DB currentTurnIndex=${defaultGroup.currentTurnIndex}, filtered activeIndex=${activeCurrentTurnIndex}, currentTurnUser=${currentTurnUser?.name}`);

    // Create safe response objects with all required fields
    const safeCurrentTurnUser = currentTurnUser ? {
      _id: currentTurnUser._id,
      name: currentTurnUser.name || 'Unknown',
      username: currentTurnUser.username || 'unknown',
      image: currentTurnUser.image || null,
    } : null;

    const safeNextTurnUser = nextTurnUser ? {
      _id: nextTurnUser._id,
      name: nextTurnUser.name || 'Unknown',
      username: nextTurnUser.username || 'unknown',
      image: nextTurnUser.image || null,
    } : null;

    return NextResponse.json({
      isMyTurn,
      currentTurnUser: safeCurrentTurnUser,
      nextTurnUser: safeNextTurnUser,
      currentTurnIndex: activeCurrentTurnIndex >= 0 ? activeCurrentTurnIndex : 0,
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
