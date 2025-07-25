import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Album from "@/models/Album";
import Theme from "@/models/Theme";
import { User } from "@/models/User";

export async function GET() {
  try {
    await dbConnect();

    // Get sample data to verify connection
    const [albumCount, themeCount, userCount] = await Promise.all([
      Album.countDocuments(),
      Theme.countDocuments(),
      User.countDocuments(),
    ]);

    const latestAlbum = await Album.findOne().sort({ submittedAt: -1 });
    const activeTheme = await Theme.findOne({ isActive: true });

    return NextResponse.json({
      success: true,
      message: "MongoDB connection successful!",
      stats: {
        albums: albumCount,
        themes: themeCount,
        users: userCount,
      },
      data: {
        latestAlbum: latestAlbum
          ? {
              title: latestAlbum.title,
              artist: latestAlbum.artist,
              submittedBy: latestAlbum.submittedBy,
            }
          : null,
        activeTheme: activeTheme
          ? {
              title: activeTheme.title,
              description: activeTheme.description,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Database connection failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
