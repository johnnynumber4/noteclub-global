import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import { isAdmin } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  try {
    // Check if user is admin using role-based auth
    const hasAdminAccess = await isAdmin();
    if (!hasAdminAccess) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    await dbConnect();

    // Use native MongoDB driver to handle both string and ObjectId formats
    const db = mongoose.connection.db;
    const groupsCollection = db?.collection('groups');
    const usersCollection = db?.collection('users');

    // Fetch all groups
    const groupDocs = await groupsCollection?.find({}).sort({ createdAt: -1 }).toArray();

    if (!groupDocs || groupDocs.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    // Collect all unique user IDs (members, admins, createdBy)
    const allUserIds = new Set<string>();

    groupDocs.forEach(group => {
      // Add member IDs
      (group.members || []).forEach((id: any) => {
        const idStr = typeof id === 'string' ? id : id.toString();
        allUserIds.add(idStr);
      });

      // Add admin IDs
      (group.admins || []).forEach((id: any) => {
        const idStr = typeof id === 'string' ? id : id.toString();
        allUserIds.add(idStr);
      });

      // Add createdBy ID
      if (group.createdBy) {
        const idStr = typeof group.createdBy === 'string' ? group.createdBy : group.createdBy.toString();
        allUserIds.add(idStr);
      }
    });

    const userIdArray = Array.from(allUserIds);

    // Fetch all users at once (handle both string and ObjectId formats)
    const users = await usersCollection?.find({
      $or: [
        { _id: { $in: userIdArray } },
        { _id: { $in: userIdArray.map(id => {
          try {
            return new mongoose.Types.ObjectId(id);
          } catch {
            return id;
          }
        })}}
      ]
    }).toArray();

    // Create a user lookup map
    const userMap = new Map();
    users?.forEach(user => {
      const userId = typeof user._id === 'string' ? user._id : user._id.toString();
      userMap.set(userId, user);
    });

    // Populate groups with user data
    const populatedGroups = groupDocs.map(group => {
      // Populate members
      const members = (group.members || []).map((id: any) => {
        const idStr = typeof id === 'string' ? id : id.toString();
        const user = userMap.get(idStr);
        return user ? {
          _id: user._id,
          name: user.name,
          email: user.email,
          username: user.username,
          image: user.image,
          isActive: user.isActive
        } : null;
      }).filter(Boolean);

      // Populate admins
      const admins = (group.admins || []).map((id: any) => {
        const idStr = typeof id === 'string' ? id : id.toString();
        const user = userMap.get(idStr);
        return user ? {
          _id: user._id,
          name: user.name,
          email: user.email,
          username: user.username
        } : null;
      }).filter(Boolean);

      // Populate createdBy
      let createdBy = null;
      if (group.createdBy) {
        const idStr = typeof group.createdBy === 'string' ? group.createdBy : group.createdBy.toString();
        const user = userMap.get(idStr);
        if (user) {
          createdBy = {
            _id: user._id,
            name: user.name,
            email: user.email
          };
        }
      }

      return {
        ...group,
        members,
        admins,
        createdBy
      };
    });

    return NextResponse.json({ groups: populatedGroups });
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
