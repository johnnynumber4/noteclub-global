import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";
import Album from "@/models/Album";
import mongoose from "mongoose";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    const { userId } = await params;

    // Find the user
    const user = await User.findById(userId).select("-password").lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's albums
    const userAlbums = await Album.find({ postedBy: userId })
      .populate("theme", "title")
      .sort({ postedAt: -1 })
      .limit(20)
      .lean();

    // Check if current user is viewing their own profile
    let currentUser = null;
    if (session?.user?.email) {
      currentUser = await User.findOne({ email: session.user.email });
    }

    const isOwnProfile = currentUser && currentUser._id.toString() === userId;

    // Calculate additional stats
    const totalLikesReceived = await Album.aggregate([
      { $match: { postedBy: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, totalLikes: { $sum: { $size: "$likes" } } } }
    ]);

    const totalCommentsReceived = await Album.aggregate([
      { $match: { postedBy: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, totalComments: { $sum: { $size: { $ifNull: ["$comments", []] } } } } }
    ]);

    // Prepare user profile data
    const profileData = {
      ...user,
      albums: userAlbums,
      stats: {
        albumsPosted: user.albumsPosted || 0,
        likesReceived: totalLikesReceived[0]?.totalLikes || 0,
        commentsReceived: totalCommentsReceived[0]?.totalComments || 0,
        profileCompletion: calculateProfileCompletion(user),
      },
      isOwnProfile,
    };

    // Hide sensitive information for non-own profiles
    if (!isOwnProfile) {
      delete profileData.email;
      delete profileData.notificationSettings;
      delete profileData.isActive;
      delete profileData.role;
      delete profileData.isVerified;
      delete profileData.isBanned;
      delete profileData.lastActive;
    }

    return NextResponse.json({ user: profileData });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { userId } = await params;
    const body = await request.json();

    // Find current user
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is trying to update their own profile
    if (currentUser._id.toString() !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Allowed fields for update
    const allowedUpdates = [
      'name',
      'bio',
      'location',
      'favoriteGenres',
      'musicPlatforms',
      'notificationSettings'
    ];

    const updates: any = {};
    Object.keys(body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = body[key];
      }
    });

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function calculateProfileCompletion(user: any): number {
  let completed = 0;
  const total = 7;

  if (user.bio) completed++;
  if (user.location) completed++;
  if (user.image) completed++;
  if (user.favoriteGenres && user.favoriteGenres.length > 0) completed++;
  if (user.musicPlatforms && Object.values(user.musicPlatforms).some((url) => url)) completed++;
  if (user.isVerified) completed++;
  if (user.albumsPosted > 0) completed++;

  return Math.round((completed / total) * 100);
}