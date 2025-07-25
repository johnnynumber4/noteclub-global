import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Album from "@/models/Album";
import Theme from "@/models/Theme";
import Turn from "@/models/Turn";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const theme = searchParams.get("theme");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";

    const skip = (page - 1) * limit;

    // Build query
    const query: any = { isApproved: true, isHidden: false };

    if (theme) {
      query.theme = theme;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Build sort
    let sortQuery: any = {};
    switch (sort) {
      case "newest":
        sortQuery = { postedAt: -1 };
        break;
      case "oldest":
        sortQuery = { postedAt: 1 };
        break;
      case "most-liked":
        sortQuery = { likeCount: -1 };
        break;
      case "alphabetical":
        sortQuery = { artist: 1, title: 1 };
        break;
      default:
        sortQuery = { postedAt: -1 };
    }

    const albums = await Album.find(query)
      .populate("postedBy", "name username image")
      .populate("theme", "title")
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Album.countDocuments(query);

    return NextResponse.json({
      albums,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching albums:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const {
      title,
      artist,
      year,
      genre,
      description,
      themeId,
      spotifyUrl,
      youtubeMusicUrl,
      appleMusicUrl,
      tidalUrl,
      deezerUrl,
      coverImageUrl,
      wikipediaUrl,
      wikipediaDescription,
      trackCount,
      duration,
      label,
    } = body;

    // Validate required fields
    if (!title || !artist || !themeId) {
      return NextResponse.json(
        { error: "Title, artist, and theme are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is active and can post
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Your account is not active" },
        { status: 403 }
      );
    }

    // Check if theme exists and is active
    const theme = await Theme.findById(themeId);
    if (!theme) {
      return NextResponse.json({ error: "Theme not found" }, { status: 404 });
    }

    if (!theme.isCurrentlyActive) {
      return NextResponse.json(
        { error: "Theme is not currently active" },
        { status: 400 }
      );
    }

    // Check if it's the user's turn
    const currentTurn = await Turn.findOne({
      theme: themeId,
      isActive: true,
    }).populate("user");

    if (
      !currentTurn ||
      currentTurn.user._id.toString() !== user._id.toString()
    ) {
      return NextResponse.json(
        { error: "It is not your turn to post" },
        { status: 403 }
      );
    }

    // Check if user has already posted for this theme
    const existingAlbum = await Album.findOne({
      theme: themeId,
      postedBy: user._id,
    });

    if (existingAlbum) {
      return NextResponse.json(
        { error: "You have already posted an album for this theme" },
        { status: 400 }
      );
    }

    // Create the album
    const album = new Album({
      title,
      artist,
      year,
      genre,
      description,
      theme: themeId,
      postedBy: user._id,
      turnNumber: currentTurn.turnNumber,
      spotifyUrl,
      youtubeMusicUrl,
      appleMusicUrl,
      tidalUrl,
      deezerUrl,
      coverImageUrl,
      wikipediaUrl,
      wikipediaDescription,
      trackCount,
      duration,
      label,
    });

    await album.save();

    // Update turn status
    currentTurn.isCompleted = true;
    currentTurn.completedAt = new Date();
    currentTurn.album = album._id;
    currentTurn.isActive = false;
    await currentTurn.save();

    // Update user statistics
    user.albumsPosted += 1;
    user.totalAlbumsPosted += 1;
    user.lastPostDate = new Date();
    await user.save();

    // Update theme statistics
    theme.albumCount += 1;
    await theme.save();

    // Activate next turn
    const nextTurn = await Turn.findOne({
      theme: themeId,
      isCompleted: false,
      isSkipped: false,
    }).sort({ turnNumber: 1 });

    if (nextTurn) {
      nextTurn.isActive = true;
      nextTurn.startedAt = new Date();
      await nextTurn.save();
    }

    // Populate the album for response
    await album.populate("postedBy", "name username image");
    await album.populate("theme", "title");

    return NextResponse.json({ album }, { status: 201 });
  } catch (error) {
    console.error("Error creating album:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
