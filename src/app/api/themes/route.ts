import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Theme from "@/models/Theme";
import { User } from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // 'active', 'upcoming', 'past'
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const skip = (page - 1) * limit;

    // Build query based on status
    let query: any = {};
    const now = new Date();

    switch (status) {
      case "active":
        query = {
          isActive: true,
          startDate: { $lte: now },
          endDate: { $gte: now },
        };
        break;
      case "upcoming":
        query = {
          startDate: { $gt: now },
        };
        break;
      case "past":
        query = {
          endDate: { $lt: now },
        };
        break;
      default:
        // All themes
        break;
    }

    const themes = await Theme.find(query)
      .populate("createdBy", "name username image")
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Theme.countDocuments(query);

    return NextResponse.json({
      themes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching themes:", error);
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
      description,
      startDate,
      endDate,
      guidelines,
      examples,
      imageUrl,
      maxTurns,
    } = body;

    // Validate required fields
    if (!title || !description || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Title, description, start date, and end date are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user has permission to create themes (moderator or admin)
    if (user.role !== "moderator" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // Check for overlapping active themes
    const overlapping = await Theme.findOne({
      isActive: true,
      $or: [
        {
          startDate: { $lte: end },
          endDate: { $gte: start },
        },
      ],
    });

    if (overlapping) {
      return NextResponse.json(
        { error: "Theme dates overlap with an existing active theme" },
        { status: 400 }
      );
    }

    // Create the theme
    const theme = new Theme({
      title,
      description,
      startDate: start,
      endDate: end,
      createdBy: user._id,
      guidelines,
      examples,
      imageUrl,
      maxTurns,
      isActive: start <= new Date(), // Auto-activate if start date is now or past
    });

    await theme.save();

    // Populate the theme for response
    await theme.populate("createdBy", "name username image");

    return NextResponse.json({ theme }, { status: 201 });
  } catch (error) {
    console.error("Error creating theme:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
