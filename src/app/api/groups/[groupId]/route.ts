import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Group } from "@/models/Group";
import mongoose from "mongoose";

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

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ error: "Invalid group ID format" }, { status: 400 });
    }

    // Handle both ObjectId and string IDs (for migrated groups)
    const db = mongoose.connection.db;
    const groupsCollection = db?.collection('groups');

    // Try to find with both string and ObjectId formats
    let groupDoc = await groupsCollection?.findOne({
      $or: [
        { _id: groupId },
        { _id: new mongoose.Types.ObjectId(groupId) }
      ]
    });

    if (!groupDoc) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Manually populate members and admins
    const usersCollection = db?.collection('users');

    // Get member IDs (handle both string and ObjectId formats)
    const memberIds = (groupDoc.members || []).map((id: any) =>
      typeof id === 'string' ? id : id.toString()
    );

    const members = await usersCollection?.find({
      $or: [
        { _id: { $in: memberIds } },
        { _id: { $in: memberIds.map((id: string) => {
          try {
            return new mongoose.Types.ObjectId(id);
          } catch {
            return id;
          }
        })}}
      ]
    }).project({ name: 1, username: 1, image: 1 }).toArray();

    // Get admin IDs
    const adminIds = (groupDoc.admins || []).map((id: any) =>
      typeof id === 'string' ? id : id.toString()
    );

    const admins = await usersCollection?.find({
      $or: [
        { _id: { $in: adminIds } },
        { _id: { $in: adminIds.map((id: string) => {
          try {
            return new mongoose.Types.ObjectId(id);
          } catch {
            return id;
          }
        })}}
      ]
    }).project({ name: 1, username: 1, image: 1 }).toArray();

    // Construct the group object
    const group = {
      ...groupDoc,
      members: members || [],
      admins: admins || [],
      memberCount: (members || []).length,
    };

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check if user is a member (compare string IDs)
    const userIdStr = session.user.id.toString();
    const isMember = group.members.some((member: any) => {
      const memberId = typeof member._id === 'string' ? member._id : member._id.toString();
      return memberId === userIdStr;
    });

    if (!isMember) {
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

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ error: "Invalid group ID format" }, { status: 400 });
    }

    // Handle both ObjectId and string IDs (for migrated groups)
    const db = mongoose.connection.db;
    const groupsCollection = db?.collection('groups');

    // Try to find with both string and ObjectId formats
    let groupDoc = await groupsCollection?.findOne({
      $or: [
        { _id: groupId },
        { _id: new mongoose.Types.ObjectId(groupId) }
      ]
    });

    if (!groupDoc) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check if user is admin (compare string IDs)
    const userIdStr = session.user.id.toString();
    const adminIds = (groupDoc.admins || []).map((id: any) =>
      typeof id === 'string' ? id : id.toString()
    );
    const isAdmin = adminIds.includes(userIdStr);

    if (!isAdmin) {
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

    // Update using native MongoDB driver
    await groupsCollection?.updateOne(
      { _id: groupDoc._id },
      { $set: filteredUpdates }
    );

    // Fetch updated group with populated members
    const updatedGroupDoc = await groupsCollection?.findOne({ _id: groupDoc._id });

    // Manually populate members
    const usersCollection = db?.collection('users');
    const memberIds = (updatedGroupDoc.members || []).map((id: any) =>
      typeof id === 'string' ? id : id.toString()
    );

    const members = await usersCollection?.find({
      $or: [
        { _id: { $in: memberIds } },
        { _id: { $in: memberIds.map((id: string) => {
          try {
            return new mongoose.Types.ObjectId(id);
          } catch {
            return id;
          }
        })}}
      ]
    }).project({ name: 1, username: 1, image: 1 }).toArray();

    const group = {
      ...updatedGroupDoc,
      members: members || [],
    };

    return NextResponse.json({ group });
  } catch (error) {
    console.error("Update group error:", error);
    return NextResponse.json(
      { error: "Failed to update group" },
      { status: 500 }
    );
  }
}