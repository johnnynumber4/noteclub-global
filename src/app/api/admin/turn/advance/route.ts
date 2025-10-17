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

    // Only allow admin (jyoungiv@gmail.com) to advance turns
    if (!session?.user?.email || session.user.email !== "jyoungiv@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    const body = await request.json();
    const { groupId } = body;

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

    // Get current state
    const oldIndex = group.currentTurnIndex;
    const oldUserId = group.turnOrder[oldIndex];

    // Advance: move currentTurnIndex to next position (this represents who "just posted")
    const newIndex = (oldIndex + 1) % group.turnOrder.length;

    // Use updateOne to bypass validation (in case maxMembers exceeds schema max)
    await Group.updateOne(
      { _id: group._id },
      { $set: { currentTurnIndex: newIndex } }
    );

    // Update local instance to match
    group.currentTurnIndex = newIndex;

    // Get users at old and new positions
    const oldUserId2 = group.turnOrder[oldIndex];
    const newUserId = group.turnOrder[newIndex];

    let oldUser = await User.findById(oldUserId2).select("name username image isActive");
    if (!oldUser && mongoose.connection?.db) {
      const db = mongoose.connection.db;
      const rawUser = await db.collection('users').findOne({ _id: oldUserId2.toString() });
      if (rawUser) {
        oldUser = {
          _id: rawUser._id,
          name: rawUser.name,
          username: rawUser.username,
          image: rawUser.image,
          isActive: rawUser.isActive ?? true,
        } as any;
      }
    }

    let newUser = await User.findById(newUserId).select("name username image isActive");
    if (!newUser && mongoose.connection?.db) {
      const db = mongoose.connection.db;
      const rawUser = await db.collection('users').findOne({ _id: newUserId.toString() });
      if (rawUser) {
        newUser = {
          _id: rawUser._id,
          name: rawUser.name,
          username: rawUser.username,
          image: rawUser.image,
          isActive: rawUser.isActive ?? true,
        } as any;
      }
    }

    // Now get whose turn it actually is (next active user after newIndex)
    const currentTurnUser = await group.getCurrentTurnUser();

    return NextResponse.json({
      success: true,
      message: `Advanced from index ${oldIndex} to ${newIndex}. ${currentTurnUser?.name || 'Unknown'}'s turn now.`,
      previousIndex: oldIndex,
      previousUser: oldUser,
      newIndex: newIndex,
      lastPosted: newUser,
      currentTurnUser: currentTurnUser,
      group: {
        id: group._id,
        name: group.name,
      },
    });
  } catch (error) {
    console.error("Error advancing turn:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
