import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session?.user?.email || session.user.email !== "jyoungiv@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, isActive } = body;

    console.log("Toggle active request received:", { userId, isActive });

    if (!userId || typeof isActive !== "boolean") {
      console.error("Invalid request body:", { userId, isActive });
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid ObjectId format:", userId);
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    await dbConnect();

    console.log("Database connection established, attempting to find user...");
    console.log("Searching for user with ID:", userId);
    console.log("ID type:", typeof userId);
    console.log("Is valid ObjectId:", mongoose.Types.ObjectId.isValid(userId));

    // Try multiple approaches to find the user
    const existingUser = await User.findById(userId);
    console.log("findById result:", existingUser ? "FOUND" : "NOT FOUND");

    // Try with findOne as an alternative
    const existingUserAlt = await User.findOne({ _id: userId });
    console.log("findOne result:", existingUserAlt ? "FOUND" : "NOT FOUND");

    // Try to find all users to see if this one is in the list
    const allUsers = await User.find({});
    console.log("Total users found:", allUsers.length);
    console.log("Mongoose connection db name:", mongoose.connection.db?.databaseName);
    console.log("User model db name:", User.db.name);
    console.log("User collection name:", User.collection.name);

    const userInList = allUsers.find(u => u._id.toString() === userId);
    console.log("User in list:", userInList ? "YES" : "NO");

    if (userInList) {
      console.log("UserInList _id type:", typeof userInList._id);
      console.log("UserInList _id:", userInList._id);
      console.log("UserInList _id toString:", userInList._id.toString());
    }

    // If we found the user in the list but not with findById, use the one from the list
    let userToUpdate = existingUser || existingUserAlt || userInList;

    if (!userToUpdate) {
      console.error("User not found with any method:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Using user found via:", existingUser ? "findById" : existingUserAlt ? "findOne" : "find() list");

    console.log("Found user before update:", {
      id: userToUpdate._id.toString(),
      name: userToUpdate.name,
      currentIsActive: userToUpdate.isActive
    });

    // Log collection information
    console.log("Collection name:", User.collection.collectionName);
    console.log("Database name:", User.db.name);

    // The migrated users have string _ids instead of ObjectIds!
    // Try both string and ObjectId formats
    const db = mongoose.connection.db;
    const usersCollection = db?.collection('users');

    // First try with the _id as-is (might be string or ObjectId)
    let rawDoc = await usersCollection?.findOne({ _id: userToUpdate._id });
    console.log("Raw document with userToUpdate._id:", rawDoc ? "FOUND" : "NOT FOUND");

    // If not found, try with string version
    if (!rawDoc) {
      rawDoc = await usersCollection?.findOne({ _id: userId });
      console.log("Raw document with string userId:", rawDoc ? "FOUND" : "NOT FOUND");
    }

    if (!rawDoc) {
      console.error("User document not found in database with either format");
      return NextResponse.json({ error: "User not found in database" }, { status: 404 });
    }

    console.log("Raw doc _id type:", typeof rawDoc._id);
    console.log("Raw doc _id:", rawDoc._id);
    console.log("Raw doc isActive:", rawDoc.isActive);

    // Update using the same _id format as found
    const updateResult = await usersCollection?.updateOne(
      { _id: rawDoc._id },
      { $set: { isActive: isActive } }
    );

    console.log("Update result:", updateResult);

    if (!updateResult || updateResult.matchedCount === 0) {
      console.error("No document matched for update");
      return NextResponse.json({ error: "User not found during update" }, { status: 404 });
    }

    if (updateResult.modifiedCount === 0) {
      console.log("Document matched but not modified (value may be the same)");
    }

    console.log("User updated successfully:", {
      name: userToUpdate.name,
      newIsActive: isActive
    });

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
