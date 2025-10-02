import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { User } from "@/models/User";

export async function GET() {
  try {
    await dbConnect();

    // Get all users with basic info (no passwords)
    const users = await User.find({}, "_id email username name").lean();

    return NextResponse.json({
      count: users.length,
      users: users.map(user => ({
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        name: user.name
      }))
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}