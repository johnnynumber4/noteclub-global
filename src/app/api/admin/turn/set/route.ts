import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Group } from "@/models/Group";
import { User } from "@/models/User";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only allow admin (jyoungiv@gmail.com) to set turns
    if (!session?.user?.email || session.user.email !== "jyoungiv@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();
    const { userId, groupId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Validate userId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Find the group (default to "NoteClub OGs" if not specified)
    let group;
    if (groupId) {
      group = await Group.findById(groupId);
    } else {
      group = await Group.findOne({
        $or: [
          { name: "NoteClub OGs" },
          { name: "Original Note Club" },
          { name: "Note Club" },
        ],
      });
    }

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Find the user - try both direct lookup and string ID
    let user = await User.findById(userId).select("name username image isActive");

    // If not found with ObjectId, try with raw MongoDB query for Atlas compatibility
    if (!user && mongoose.connection?.db) {
      const db = mongoose.connection.db;
      const rawUser = await db.collection('users').findOne({ _id: userId });
      if (rawUser) {
        user = {
          _id: rawUser._id,
          name: rawUser.name,
          username: rawUser.username,
          image: rawUser.image,
          isActive: rawUser.isActive ?? true,
        } as any;
      }
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is in the turn order
    const userIndex = group.turnOrder.findIndex(
      (id: mongoose.Types.ObjectId) => id.toString() === userId
    );

    if (userIndex === -1) {
      return NextResponse.json(
        { error: "User is not in the turn order for this group" },
        { status: 400 }
      );
    }

    // Store previous turn info
    const previousIndex = group.currentTurnIndex;
    const previousUserId = group.turnOrder[previousIndex];
    let previousUser = await User.findById(previousUserId).select("name username");

    // Try raw query fallback
    if (!previousUser && mongoose.connection?.db) {
      const db = mongoose.connection.db;
      const rawUser = await db.collection('users').findOne({ _id: previousUserId.toString() });
      if (rawUser) {
        previousUser = { name: rawUser.name, username: rawUser.username } as any;
      }
    }

    // Set the new turn index using updateOne to bypass validation
    await Group.updateOne(
      { _id: group._id },
      { $set: { currentTurnIndex: userIndex } }
    );

    // Update the local instance to match the database
    group.currentTurnIndex = userIndex;

    // Get who's turn it actually is now (next active after userIndex)
    const actualCurrentTurn = await group.getCurrentTurnUser();

    return NextResponse.json({
      success: true,
      message: `Turn set to ${user.name}. ${actualCurrentTurn?.name || 'Unknown'}'s turn now.`,
      previousTurn: {
        user: previousUser,
        index: previousIndex,
      },
      newLastPosted: {
        user: user,
        index: userIndex,
      },
      actualCurrentTurn: actualCurrentTurn,
      group: {
        id: group._id,
        name: group.name,
      },
    });
  } catch (error) {
    console.error("Error setting turn:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
