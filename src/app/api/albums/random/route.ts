import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Album from "@/models/Album";

export async function GET() {
  try {
    await dbConnect();

    // Build query to only get published/approved albums
    const query: Record<string, unknown> = {
      $or: [
        { isApproved: true, isHidden: false }, // Old schema
        { status: "published" }, // New migrated schema
      ],
    };

    // Get count of albums matching the query
    const count = await Album.countDocuments(query);

    if (count === 0) {
      return NextResponse.json(
        { error: "No albums found" },
        { status: 404 }
      );
    }

    // Get a random album using MongoDB aggregation
    const randomAlbums = await Album.aggregate([
      { $match: query },
      { $sample: { size: 1 } }
    ]);

    if (!randomAlbums || randomAlbums.length === 0) {
      return NextResponse.json(
        { error: "No albums found" },
        { status: 404 }
      );
    }

    const randomAlbum = randomAlbums[0];

    return NextResponse.json({
      albumId: randomAlbum._id.toString()
    });
  } catch (error) {
    console.error("Error fetching random album:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
