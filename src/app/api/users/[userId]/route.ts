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

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Invalid user ID format" }, { status: 400 });
    }

    // Find the user - Atlas stores IDs as strings, not ObjectIds
    // Use raw MongoDB query for Atlas compatibility
    const db = mongoose.connection.db;
    let user = await db.collection('users').findOne({ _id: userId });

    if (user) {
      // Remove the password field manually since we can't use .select() with raw queries
      delete user.password;
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user's albums using raw query for Atlas compatibility
    const userAlbums = await db.collection('albums').find({ postedBy: userId })
      .sort({ postedAt: -1 })
      .limit(20)
      .toArray();

    // Manually populate theme data
    const themeIds = [...new Set(userAlbums.map(album => album.theme).filter(Boolean))];
    const themes = await db.collection('themes').find({ _id: { $in: themeIds } }).toArray();
    const themeMap = new Map(themes.map(theme => [theme._id, theme]));

    // Add theme titles to albums
    userAlbums.forEach(album => {
      if (album.theme && themeMap.has(album.theme)) {
        album.theme = { title: themeMap.get(album.theme).title };
      } else {
        album.theme = { title: 'No Theme' };
      }
    });

    // Check if current user is viewing their own profile
    let currentUser = null;
    if (session?.user?.email) {
      currentUser = await db.collection('users').findOne({ email: session.user.email });
    }

    const isOwnProfile = currentUser && currentUser._id === userId;

    // Calculate additional stats using raw MongoDB queries
    const likesResult = await db.collection('albums').aggregate([
      { $match: { postedBy: userId } },
      { $group: { _id: null, totalLikes: { $sum: { $size: { $ifNull: ["$likes", []] } } } } }
    ]).toArray();

    const commentsResult = await db.collection('albums').aggregate([
      { $match: { postedBy: userId } },
      { $group: { _id: null, totalComments: { $sum: { $size: { $ifNull: ["$comments", []] } } } } }
    ]).toArray();

    const totalLikesReceived = likesResult.length > 0 ? likesResult[0].totalLikes : 0;
    const totalCommentsReceived = commentsResult.length > 0 ? commentsResult[0].totalComments : 0;

    // Prepare user profile data
    const profileData = {
      ...user,
      albums: userAlbums,
      stats: {
        albumsPosted: user.albumsPosted || 0,
        likesReceived: totalLikesReceived,
        commentsReceived: totalCommentsReceived,
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