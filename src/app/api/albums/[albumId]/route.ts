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

    // Validate albumId format
    if (!mongoose.Types.ObjectId.isValid(albumId)) {
      return NextResponse.json({ error: "Invalid album ID" }, { status: 400 });
    }

    const album = await Album.findById(albumId)
      .populate("postedBy", "_id name username image")
      .populate("theme", "title")
      .lean();

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    // Normalize mixed data structures
    const normalizedAlbum = {
      ...album,
      postedBy: (album as any).postedBy || { _id: null, name: 'Unknown', username: 'unknown', image: null },
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