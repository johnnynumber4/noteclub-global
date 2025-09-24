import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";


export async function POST(request: Request) {
  try {
    await dbConnect();

    const { name, email, password } = await request.json();

    console.log("📝 Registration data:", { name, email, password: "provided" });

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Generate unique username (simple version for now)
    const baseUsername = email
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    let username = baseUsername;
    let counter = 1;

    while (await User.findOne({ username })) {
      username = `${baseUsername}${counter}`;
      counter++;
    }

    // Get next turn order (highest + 1)
    const lastUser = await User.findOne().sort({ turnOrder: -1 });
    const turnOrder = lastUser ? lastUser.turnOrder + 1 : 1;

    // Create user (pre-save hook will handle password hashing)
    const user = new User({
      name,
      email,
      password, // Don't hash here - let pre-save hook handle it
      username,
      turnOrder,
      favoriteGenres: [],
      musicPlatforms: {},
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
      isVerified: false,
      isBanned: false,
      joinedAt: new Date(),
      lastActive: new Date(),
    });

    console.log("💾 Saving user, pre-save hook will hash password...");
    await user.save();
    console.log("✅ User saved successfully");

    return NextResponse.json(
      { message: "User created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
