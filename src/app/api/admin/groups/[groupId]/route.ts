import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { Group } from "@/models/Group";
import { User } from "@/models/User";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Only allow admin (jyoungiv@gmail.com) to update groups
    if (!session?.user?.email || session.user.email !== "jyoungiv@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    const { groupId } = params;
    const body = await request.json();
    const { name, isPrivate, memberIds } = body;

    // Validate groupId
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json({ error: "Invalid group ID" }, { status: 400 });
    }

    // Find the group
    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Build update object
    const updateData: any = {};

    // Update name if provided
    if (name && typeof name === 'string') {
      const trimmedName = name.trim();
      if (trimmedName.length < 3) {
        return NextResponse.json(
          { error: "Group name must be at least 3 characters" },
          { status: 400 }
        );
      }
      if (trimmedName.length > 50) {
        return NextResponse.json(
          { error: "Group name must be less than 50 characters" },
          { status: 400 }
        );
      }
      updateData.name = trimmedName;
    }

    // Update privacy setting if provided
    if (typeof isPrivate === 'boolean') {
      updateData.isPrivate = isPrivate;
    }

    // Update members if provided
    if (Array.isArray(memberIds)) {
      // Validate all member IDs
      const validMemberIds = memberIds.filter(id => mongoose.Types.ObjectId.isValid(id));

      if (validMemberIds.length !== memberIds.length) {
        return NextResponse.json(
          { error: "Some member IDs are invalid" },
          { status: 400 }
        );
      }

      // Verify all users exist
      const users = await User.find({ _id: { $in: validMemberIds } }).select("_id username");

      if (users.length !== validMemberIds.length) {
        return NextResponse.json(
          { error: "Some users not found" },
          { status: 404 }
        );
      }

      // Get all users to rebuild turn order alphabetically
      const allUsers = await User.find({ _id: { $in: validMemberIds } })
        .select("_id username")
        .sort({ username: 1 });

      updateData.members = validMemberIds;
      updateData.turnOrder = allUsers.map(user => user._id);

      // If current turn index is out of bounds, reset to 0
      if (group.currentTurnIndex >= allUsers.length) {
        updateData.currentTurnIndex = 0;
      }
    }

    // Use updateOne to bypass validation
    await Group.updateOne(
      { _id: group._id },
      { $set: updateData }
    );

    // Fetch updated group with populated data
    const updatedGroup = await Group.findById(groupId)
      .populate('members', 'name email username image isActive')
      .populate('admins', 'name email username')
      .populate('createdBy', 'name email');

    return NextResponse.json({
      success: true,
      message: "Group updated successfully",
      group: updatedGroup,
    });
  } catch (error) {
    console.error("Error updating group:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
