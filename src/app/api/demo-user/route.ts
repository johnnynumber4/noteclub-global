import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Check if demo user exists
    const demoUser = await User.findOne({ email: "demo@noteclub.com" });
    
    return NextResponse.json({
      exists: !!demoUser,
      credentials: demoUser ? {
        email: "demo@noteclub.com",
        password: "demo123",
        name: demoUser.name,
        username: demoUser.username,
      } : null,
    });
  } catch (error) {
    console.error("Demo user check error:", error);
    return NextResponse.json(
      { error: "Failed to check demo user" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    // Check if demo user already exists
    const existingUser = await User.findOne({ email: "demo@noteclub.com" });

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: "Demo user already exists",
        credentials: {
          email: "demo@noteclub.com",
          password: "demo123",
        },
      });
    }

    // Get the highest turn order to place demo user at the end
    const lastUser = await User.findOne().sort({ turnOrder: -1 });
    const turnOrder = lastUser ? lastUser.turnOrder + 1 : 1;

    // Create demo user
    const demoUser = new User({
      name: "Demo User",
      email: "demo@noteclub.com",
      password: "demo123", // Will be hashed by pre-save hook
      username: "demo_user",
      turnOrder,
      favoriteGenres: ["Rock", "Hip-Hop", "Electronic"],
      musicPlatforms: {
        spotify: "https://open.spotify.com/user/demo",
        youtubeMusic: "https://music.youtube.com/channel/demo",
      },
      isActive: true,
      albumsPosted: 0,
      commentsPosted: 0,
      likesGiven: 0,
      likesReceived: 0,
      totalAlbumsPosted: 0,
      notificationSettings: {
        newThemes: true,
        turnReminders: true,
        comments: true,
        likes: true,
        emails: true,
      },
      role: "member",
      isVerified: true, // Mark as verified
      isBanned: false,
      bio: "Demo user account for testing Note Club Modern",
      location: "Demo City",
      joinedAt: new Date(),
      lastActive: new Date(),
    });

    await demoUser.save();

    return NextResponse.json({
      success: true,
      message: "Demo user created successfully",
      credentials: {
        email: "demo@noteclub.com",
        password: "demo123",
      },
    });
  } catch (error) {
    console.error("Demo user creation error:", error);
    return NextResponse.json(
      { error: "Failed to create demo user" },
      { status: 500 }
    );
  }
}