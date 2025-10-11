import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";
import Album from "@/models/Album";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is admin
    if (!session?.user?.email || session.user.email !== "jyoungiv@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await dbConnect();

    // Fetch all users
    const users = await User.find({})
      .select("name email username image isActive role turnOrder joinedAt")
      .sort({ name: 1 });

    // Get actual album counts for each user
    const userIds = users.map(u => u._id);
    const albumCounts = await Album.aggregate([
      {
        $match: {
          postedBy: { $in: userIds }
        }
      },
      {
        $group: {
          _id: "$postedBy",
          count: { $sum: 1 }
        }
      }
    ]);

    // Create a map of user ID to album count
    const albumCountMap = new Map(
      albumCounts.map(ac => [ac._id.toString(), ac.count])
    );

    // Add actual album counts to users
    const usersWithAlbumCounts = users.map(user => ({
      ...user.toObject(),
      albumsPosted: albumCountMap.get(user._id.toString()) || 0
    }));

    // Get total album count
    const totalAlbums = await Album.countDocuments();

    return NextResponse.json({ users: usersWithAlbumCounts, totalAlbums });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
