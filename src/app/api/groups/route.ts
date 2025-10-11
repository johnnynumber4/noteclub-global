import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";

// GET /api/groups - Get user's groups
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Import models after DB connection
    const { Group } = await import("@/models/Group");
    const { User } = await import("@/models/User");

    console.log("Fetching groups for user ID:", session.user.id);

    const groups = await Group.find({
      members: session.user.id
    })
    .populate("members", "name username image")
    .sort({ updatedAt: -1 });

    console.log("Found groups:", groups.length);

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Get groups error:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

// POST /api/groups - Create new group
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, description, isPrivate = true, maxMembers = 20 } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Group name is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Import models after DB connection
    const { Group } = await import("@/models/Group");
    const { User } = await import("@/models/User");

    // Generate unique invite code
    const inviteCode = await Group.generateInviteCode();

    const group = new Group({
      name: name.trim(),
      description: description?.trim(),
      isPrivate,
      maxMembers,
      inviteCode,
      members: [session.user.id],
      admins: [session.user.id],
      createdBy: session.user.id,
      turnOrder: [session.user.id],
      currentTurnIndex: 0,
    });

    await group.save();

    // Populate the group data (only populate real fields, not virtuals)
    await group.populate("members", "name username image");

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error("Create group error:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}