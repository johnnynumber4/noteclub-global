import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Group } from "@/models/Group";

// GET /api/groups/[groupId] - Get specific group
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { groupId } = await params;
    const group = await Group.findById(groupId)
      .populate("members", "name username image")
      .populate("admins", "name username image");

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check if user is a member
    if (!group.members.some((member: any) => member._id.toString() === session.user.id)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({ group });
  } catch (error) {
    console.error("Get group error:", error);
    return NextResponse.json(
      { error: "Failed to fetch group" },
      { status: 500 }
    );
  }
}

// PATCH /api/groups/[groupId] - Update group
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { groupId } = await params;
    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check if user is admin
    if (!group.admins.includes(session.user.id)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const updates = await request.json();
    const allowedUpdates = [
      "name", "description", "isPrivate", "maxMembers", 
      "turnDurationDays", "allowMemberInvites", 
      "requireApprovalForAlbums", "notifyOnNewAlbums"
    ];

    // Filter to only allowed updates
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj: any, key) => {
        obj[key] = updates[key];
        return obj;
      }, {});

    Object.assign(group, filteredUpdates);
    await group.save();

    await group.populate("members", "name username image");

    return NextResponse.json({ group });
  } catch (error) {
    console.error("Update group error:", error);
    return NextResponse.json(
      { error: "Failed to update group" },
      { status: 500 }
    );
  }
}