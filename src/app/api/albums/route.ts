import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Album from "@/models/Album";
import Theme from "@/models/Theme";
import Turn from "@/models/Turn";
import { User } from "@/models/User";
import { Group } from "@/models/Group";
import mongoose from "mongoose";
import { fetchWikipediaDescription } from "@/lib/utils";

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
        { status: 'published' } // New migrated schema
      ]
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
    const userIds = [...new Set(albums.map((album: any) => album.postedBy?.toString()).filter(Boolean))];
    
    // Fetch all users and create string-based lookup map
    const users = await User.find({}, "name username image").lean();
    
    const userMap = new Map();
    users.forEach((user: any) => {
      // Add both string and ObjectId versions for maximum compatibility
      userMap.set(user._id.toString(), user);
      if (user._id instanceof mongoose.Types.ObjectId) {
        userMap.set(user._id.toString(), user);
      }
    });

    // Add user like status and normalize mixed data structures
    const albumsWithLikeStatus = albums.map((album: Record<string, unknown>) => {
      // Get user from our manual lookup (handle both author and postedBy)
      const userId = (album.postedBy || album.author)?.toString();
      const user = userId ? userMap.get(userId) || { name: 'Unknown', username: 'unknown', image: null } 
                          : { name: 'Unknown', username: 'unknown', image: null };
      
      // Normalize theme (handle both title and name)
      const theme = album.theme ? {
        title: (album.theme as any)?.title || (album.theme as any)?.name || 'No Theme'
      } : { title: 'No Theme' };
      
      // Normalize cover image (handle both coverImageUrl and artwork object)
      const coverImageUrl = album.coverImageUrl || 
        (album.artwork as any)?.large || 
        (album.artwork as any)?.medium || 
        (album.artwork as any)?.small || 
        null;
      
      // Normalize streaming links (handle both flat and nested structures)
      const spotifyUrl = album.spotifyUrl || (album.links as any)?.spotify || null;
      const youtubeMusicUrl = album.youtubeMusicUrl || (album.links as any)?.youtubeMusic || null;
      const appleMusicUrl = album.appleMusicUrl || (album.links as any)?.appleMusic || null;
      
      return {
        ...album,
        // Ensure consistent field names
        postedBy: user,
        theme,
        coverImageUrl,
        spotifyUrl,
        youtubeMusicUrl,
        appleMusicUrl,
        isLikedByUser: currentUser && Array.isArray(album.likes) 
          ? album.likes.includes(currentUser._id) 
          : false,
        likeCount: Array.isArray(album.likes) ? album.likes.length : 0,
      };
    });

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

    // Find user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Find or create default group
    let defaultGroup = await Group.findOne({ name: 'Note Club' });
    if (!defaultGroup) {
      defaultGroup = new Group({
        name: 'Note Club',
        description: 'Default group for all Note Club members',
        isPrivate: false,
        inviteCode: 'DEFAULT',
        maxMembers: 100,
        members: [user._id],
        admins: [user._id],
        createdBy: user._id,
        turnOrder: [user._id],
        currentTurnIndex: 0,
        turnDurationDays: 7,
        totalAlbumsShared: 0,
        totalThemes: 0,
        allowMemberInvites: true,
        requireApprovalForAlbums: false,
        notifyOnNewAlbums: true,
      });
      await defaultGroup.save();
    } else if (!defaultGroup.members.includes(user._id)) {
      // Add user to default group if not already a member
      defaultGroup.members.push(user._id);
      if (!defaultGroup.turnOrder.includes(user._id)) {
        defaultGroup.turnOrder.push(user._id);
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

    // Allow Random theme as fallback, or check if theme is currently active
    const isRandomTheme = theme.title.toLowerCase() === 'random';
    if (!theme.isCurrentlyActive && !isRandomTheme) {
      return NextResponse.json(
        { error: "Theme is not currently active" },
        { status: 400 }
      );
    }

    // Skip turn checking for Random theme OR override mode (allows anyone to post anytime)
    let currentTurn = null;
    if (!isRandomTheme && !isOverride) {
      // Check if it's the user's turn (only for non-Random themes and non-override mode)
      currentTurn = await Turn.findOne({
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

    // Auto-fetch Wikipedia description if not provided
    let finalWikipediaUrl = wikipediaUrl;
    let finalWikipediaDescription = wikipediaDescription;
    
    if (!wikipediaDescription && title && artist) {
      try {
        console.log(`Auto-fetching Wikipedia description for: ${title} by ${artist}`);
        const wikiData = await fetchWikipediaDescription(title, artist);
        if (wikiData.description && wikiData.source === 'wikipedia') {
          finalWikipediaDescription = wikiData.description;
          finalWikipediaUrl = wikiData.url;
          console.log(`✅ Found Wikipedia description for ${title}`);
        }
      } catch (error) {
        console.log(`Failed to auto-fetch Wikipedia description for ${title}:`, error);
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
      postedBy: user._id,
      turnNumber: currentTurn?.turnNumber || 1,
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

    // Update turn status (only for themes with turn management and not override mode)
    if (currentTurn && !isOverride) {
      currentTurn.isCompleted = true;
      currentTurn.completedAt = new Date();
      currentTurn.album = album._id;
      currentTurn.isActive = false;
      await currentTurn.save();

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
    }

    // Update user statistics
    user.albumsPosted += 1;
    user.totalAlbumsPosted += 1;
    user.lastPostDate = new Date();
    await user.save();

    // Update theme statistics
    await Theme.updateOne(
      { _id: themeId },
      { $inc: { albumCount: 1 } }
    );

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
