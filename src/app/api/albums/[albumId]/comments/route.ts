import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Album from "@/models/Album";
import { User } from "@/models/User";
import mongoose from "mongoose";

// For now, we'll use a simple Comment schema embedded in albums
// In a production app, you might want a separate Comment model
interface Comment {
  _id: string;
  content: string;
  postedBy: any;
  postedAt: Date;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ albumId: string }> }
) {
  try {
    await dbConnect();

    const { albumId } = await params;

    const album = await Album.findById(albumId).lean();

    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    // Manual user lookup for comments to handle ObjectId type issues
    const commentUserIds = [...new Set((album.comments || []).map((comment: any) => comment.postedBy?.toString()).filter(Boolean))];
    const users = await User.find({}, "_id name username image").lean();

    const userMap = new Map();
    users.forEach((user: any) => {
      userMap.set(user._id.toString(), user);
    });

    const comments = (album.comments || []).map((comment: any) => {
      const userId = comment.postedBy?.toString();
      const user = userId ? userMap.get(userId) || { _id: userId, name: 'Unknown', username: 'unknown', image: null }
                          : { _id: null, name: 'Unknown', username: 'unknown', image: null };
      
      return {
        ...comment,
        postedBy: user
      };
    });

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const body = await request.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

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

    // Create comment object
    const comment = {
      _id: new mongoose.Types.ObjectId().toString(),
      content: content.trim(),
      postedBy: user._id,
      postedAt: new Date(),
    };

    // Add comment to album
    if (!album.comments) {
      album.comments = [];
    }
    album.comments.push(comment);

    await album.save();

    // Populate the new comment for response
    await album.populate("comments.postedBy", "name username image");
    const newComment = album.comments[album.comments.length - 1];

    return NextResponse.json({ comment: newComment }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}