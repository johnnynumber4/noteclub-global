import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Group } from "@/models/Group";
import { User } from "@/models/User";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only allow admin access
    if (!session?.user?.email || session.user.email !== "jyoungiv@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    // Find default group
    const group = await Group.findOne({
      $or: [
        { name: "NoteClub OGs" },
        { name: "Original Note Club" },
        { name: "Note Club" },
      ],
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Get all users in turn order with their active status
    const turnOrderDetails = await Promise.all(
      group.turnOrder.map(async (userId: mongoose.Types.ObjectId, index: number) => {
        let user = await User.findById(userId).select("name username isActive");

        // Try raw query fallback
        if (!user && mongoose.connection?.db) {
          const db = mongoose.connection.db;
          const rawUser = await db.collection('users').findOne({ _id: userId.toString() });
          if (rawUser) {
            user = {
              _id: rawUser._id,
              name: rawUser.name,
              username: rawUser.username,
              isActive: rawUser.isActive ?? true,
            } as any;
          }
        }

        return {
          index,
          userId: userId.toString(),
          name: user?.name || "Unknown",
          username: user?.username || "unknown",
          isActive: user?.isActive ?? false,
          isCurrent: index === group.currentTurnIndex,
        };
      })
    );

    return NextResponse.json({
      group: {
        name: group.name,
        currentTurnIndex: group.currentTurnIndex,
        totalMembers: group.turnOrder.length,
      },
      turnOrder: turnOrderDetails,
      currentUser: turnOrderDetails[group.currentTurnIndex],
      nextUser: turnOrderDetails[(group.currentTurnIndex + 1) % group.turnOrder.length],
    });
  } catch (error) {
    console.error("Error fetching turn state:", error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
