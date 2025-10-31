import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Album from "@/models/Album";
import { User } from "@/models/User";
import mongoose from "mongoose";

// Import Theme to ensure it's registered with Mongoose
import "@/models/Theme";

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    let currentUser = null;
    if (session?.user?.email) {
      currentUser = await User.findOne({ email: session.user.email });
    }

    const { albumId } = await params;

    // Validate albumId format
    if (!mongoose.Types.ObjectId.isValid(albumId)) {
      return NextResponse.json({ error: "Invalid album ID" }, { status: 400 });
    }

    const album = await Album.findById(albumId)
      .populate("theme", "title")
      .lean();

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    // Manually fetch the user using the same approach as albums list API
    const userId = (album as any).postedBy?.toString();
    let postedByUser = null;

    if (userId) {
      // Use User.find() to get all users, then filter - same as albums list API
      const users = await User.find({}, "_id name username image").lean();

      // Create lookup map
      const userMap = new Map();
      users.forEach((user: any) => {
        if (user._id) {
          const userIdString =
            user._id instanceof mongoose.Types.ObjectId
              ? user._id.toString()
              : user._id.toString();
          userMap.set(userIdString, user);
        }
      });

      postedByUser = userMap.get(userId) || null;
    }

    // Normalize mixed data structures
    const normalizedAlbum = {
      ...album,
      postedBy: postedByUser || { _id: userId || null, name: 'Unknown', username: 'unknown', image: null },
      theme: (album as any).theme || { title: 'No Theme' },
      isLikedByUser: currentUser ? (album as any).likes?.includes(currentUser._id) : false,
      likeCount: (album as any).likes?.length || 0,
    };

    return NextResponse.json({ album: normalizedAlbum });
  } catch (error) {
    console.error("Error fetching album:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}