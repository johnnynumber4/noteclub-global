import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";
import mongoose from "mongoose";
import { isAdmin } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin using role-based auth
    const hasAdminAccess = await isAdmin();
    if (!hasAdminAccess) {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, isActive } = body;

    if (!userId || typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find user - handle both ObjectId and string IDs for migrated users
    const allUsers = await User.find({});
    const userToUpdate = allUsers.find(u => u._id.toString() === userId);

    if (!userToUpdate) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Update using native MongoDB driver to handle string IDs from migration
    const db = mongoose.connection.db;
    const usersCollection = db?.collection('users');

    // Try to find with the actual _id from the user document first
    let rawDoc = await usersCollection?.findOne({ _id: userToUpdate._id });

    // If not found, try with string version (for migrated users)
    if (!rawDoc) {
      rawDoc = await usersCollection?.findOne({ _id: userId });
    }

    if (!rawDoc) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    // Update using the same _id format as found in the database
    const updateResult = await usersCollection?.updateOne(
      { _id: rawDoc._id },
      { $set: { isActive: isActive } }
    );

    if (!updateResult || updateResult.matchedCount === 0) {
      return NextResponse.json({ error: "User not found during update" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: userToUpdate._id,
        name: userToUpdate.name,
        email: userToUpdate.email,
        isActive: isActive
      },
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
