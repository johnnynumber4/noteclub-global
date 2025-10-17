import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Album from "@/models/Album";
import { User } from "@/models/User";

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const { albumId } = await params;

    // Find user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find album
    const album = await Album.findById(albumId);
    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    // Check if user has already liked this album
    const hasLiked = album.likes?.includes(user._id);

    if (hasLiked) {
      // Unlike - remove user from likes array
      album.likes = album.likes.filter(
        (likeUserId: unknown) => likeUserId?.toString() !== user._id.toString()
      );
    } else {
      // Like - add user to likes array
      if (!album.likes) {
        album.likes = [];
      }
      album.likes.push(user._id);
    }

    await album.save();

    // Get updated album with virtual property
    const updatedAlbum = await Album.findById(albumId).lean();

    return NextResponse.json({
      success: true,
      liked: !hasLiked,
      likeCount: updatedAlbum?.likes?.length || 0,
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}