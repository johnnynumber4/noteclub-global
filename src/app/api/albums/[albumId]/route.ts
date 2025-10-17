import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Album from "@/models/Album";
import { User } from "@/models/User";
import mongoose from "mongoose";

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
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

    const album = await Album.findById(albumId)
      .populate("theme", "title")
      .lean();

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    // Manual user lookup to handle ObjectId type issues
    let user = { _id: null, name: 'Unknown', username: 'unknown', image: null };
    if ((album as any).postedBy) {
      // Use the same approach as the main albums API
      const users = await User.find({}, "_id name username image").lean();
      const userMap = new Map();
      users.forEach((u: any) => {
        userMap.set(u._id.toString(), u);
      });

      const foundUser = userMap.get((album as any).postedBy.toString());

      if (foundUser) {
        user = foundUser;
      } else {
        user._id = (album as any).postedBy.toString();
      }
    }

    // Normalize mixed data structures
    const normalizedAlbum = {
      ...album,
      postedBy: user,
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