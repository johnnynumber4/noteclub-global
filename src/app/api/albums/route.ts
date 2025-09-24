import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Album from "@/models/Album";
import Theme from "@/models/Theme";
import { User } from "@/models/User";
import { Group } from "@/models/Group";
import mongoose from "mongoose";
import { fetchWikipediaDescription } from "@/lib/utils";

// Type definitions for better type safety
interface UserLookup {
  _id: string | mongoose.Types.ObjectId;
  name: string;
  username: string;
  image?: string;
}

interface ThemeData {
  title?: string;
  name?: string;
}

interface ArtworkData {
  large?: string;
  medium?: string;
  small?: string;
}

interface LinksData {
  spotify?: string;
  youtubeMusic?: string;
  appleMusic?: string;
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    let currentUser = null;
    if (session?.user?.email) {
      currentUser = await User.findOne({ email: session.user.email });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const theme = searchParams.get("theme");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "newest";

    const skip = (page - 1) * limit;

    // Build query - support both old and new schema
    const query: Record<string, unknown> = {
      $or: [
        { isApproved: true, isHidden: false }, // Old schema
        { status: "published" }, // New migrated schema
      ],
    };

    if (theme) {
      query.theme = theme;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Build sort
    let sortQuery: Record<string, 1 | -1> = {};
    switch (sort) {
      case "newest":
        sortQuery = { postedAt: -1 }; // Now using postedAt as per schema
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
      .populate("theme", "title")
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .lean();

    // Manual user lookup to handle ObjectId type issues
    const userIds = [
      ...new Set(
        albums
          .map((album: Record<string, unknown>) => album.postedBy?.toString())
          .filter(Boolean)
      ),
    ];

    // Fetch all users and create string-based lookup map
    const users = await User.find({}, "_id name username image").lean();

    const userMap = new Map();
    users.forEach((user) => {
      // Handle both ObjectId and string cases for maximum compatibility
      if (user._id) {
        const userIdString =
          user._id instanceof mongoose.Types.ObjectId
            ? user._id.toString()
            : user._id.toString();
        userMap.set(userIdString, user);
      }
    });

    // Add user like status and normalize mixed data structures
    const albumsWithLikeStatus = albums.map(
      (album: Record<string, unknown>) => {
        // Get user from our manual lookup (handle both author and postedBy)
        const userId = (album.postedBy || album.author)?.toString();
        const user = userId
          ? userMap.get(userId) || {
              _id: userId,
              name: "Unknown",
              username: "unknown",
              image: null,
            }
          : { _id: null, name: "Unknown", username: "unknown", image: null };

        // Normalize theme (handle both title and name)
        const theme = album.theme
          ? {
              title:
                (album.theme as ThemeData)?.title ||
                (album.theme as ThemeData)?.name ||
                "No Theme",
            }
          : { title: "No Theme" };

        // Normalize cover image (handle both coverImageUrl and artwork object)
        const coverImageUrl =
          album.coverImageUrl ||
          (album.artwork as ArtworkData)?.large ||
          (album.artwork as ArtworkData)?.medium ||
          (album.artwork as ArtworkData)?.small ||
          null;

        // Normalize streaming links (handle both flat and nested structures)
        const spotifyUrl =
          album.spotifyUrl || (album.links as LinksData)?.spotify || null;
        const youtubeMusicUrl =
          album.youtubeMusicUrl ||
          (album.links as LinksData)?.youtubeMusic ||
          null;
        const appleMusicUrl =
          album.appleMusicUrl || (album.links as LinksData)?.appleMusic || null;

        return {
          ...album,
          // Ensure consistent field names
          postedBy: user,
          theme,
          coverImageUrl,
          spotifyUrl,
          youtubeMusicUrl,
          appleMusicUrl,
          isLikedByUser:
            currentUser && Array.isArray(album.likes)
              ? album.likes.includes(currentUser._id)
              : false,
          likeCount: Array.isArray(album.likes) ? album.likes.length : 0,
        };
      }
    );

    const total = await Album.countDocuments(query);

    return NextResponse.json({
      albums: albumsWithLikeStatus,
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
      isOverride,
    } = body;

    // Validate required fields
    if (!title || !artist || !themeId) {
      return NextResponse.json(
        { error: "Title, artist, and theme are required" },
        { status: 400 }
      );
    }

    // Find user by email (more reliable than session ID)
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Use the actual user ID from database, not from session
    const userId = user._id;

    // Find or create default group
    let defaultGroup = await Group.findOne({ name: "Note Club" });
    if (!defaultGroup) {
      defaultGroup = new Group({
        name: "Note Club",
        description: "Default group for all Note Club members",
        isPrivate: false,
        inviteCode: "DEFAULT",
        maxMembers: 100,
        members: [userId],
        admins: [userId],
        createdBy: userId,
        turnOrder: [userId],
        currentTurnIndex: 0,
        turnDurationDays: 7,
        totalAlbumsShared: 0,
        totalThemes: 0,
        allowMemberInvites: true,
        requireApprovalForAlbums: false,
        notifyOnNewAlbums: true,
      });
      await defaultGroup.save();
    } else if (!defaultGroup.members.includes(userId)) {
      // Add user to default group if not already a member
      defaultGroup.members.push(userId);
      if (!defaultGroup.turnOrder.includes(userId)) {
        defaultGroup.turnOrder.push(userId);
      }
      await defaultGroup.save();
    }

    const groupId = defaultGroup._id;

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

    // Allow posting to any theme - removed active theme restriction

    // Allow all users to post anytime - removed turn restrictions

    // Allow multiple posts per theme - removed restriction

    // Auto-fetch Wikipedia description if not provided
    let finalWikipediaUrl = wikipediaUrl;
    let finalWikipediaDescription = wikipediaDescription;

    if (!wikipediaDescription && title && artist) {
      try {
        console.log(
          `Auto-fetching Wikipedia description for: ${title} by ${artist}`
        );
        const wikiData = await fetchWikipediaDescription(title, artist);
        if (wikiData.description && wikiData.source === "wikipedia") {
          finalWikipediaDescription = wikiData.description;
          finalWikipediaUrl = wikiData.url;
          console.log(`✅ Found Wikipedia description for ${title}`);
        }
      } catch (error) {
        console.log(
          `Failed to auto-fetch Wikipedia description for ${title}:`,
          error
        );
        // Continue without Wikipedia data
      }
    }

    // Create the album
    const album = new Album({
      title,
      artist,
      year,
      genre,
      description,
      theme: themeId,
      group: groupId,
      postedBy: userId,
      turnNumber: 1, // Default turn number since turn restrictions removed
      spotifyUrl,
      youtubeMusicUrl,
      appleMusicUrl,
      tidalUrl,
      deezerUrl,
      coverImageUrl,
      wikipediaUrl: finalWikipediaUrl,
      wikipediaDescription: finalWikipediaDescription,
      trackCount,
      duration,
      label,
    });

    await album.save();

    // Turn management disabled - all users can post anytime

    // Update user statistics
    try {
      user.albumsPosted += 1;
      user.totalAlbumsPosted += 1;
      user.lastPostDate = new Date();
      await user.save();
    } catch (userSaveError) {
      console.error("Error updating user statistics:", userSaveError);
      // Don't fail the album creation if user stats update fails
      // The album has been successfully created, just log the error
    }

    // Update theme statistics
    await Theme.updateOne({ _id: themeId }, { $inc: { albumCount: 1 } });

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
