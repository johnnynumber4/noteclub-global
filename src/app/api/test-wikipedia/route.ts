import { NextRequest, NextResponse } from "next/server";
import { fetchWikipediaDescription } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const album = searchParams.get("album");
    const artist = searchParams.get("artist");

    if (!album || !artist) {
      return NextResponse.json(
        { error: "Both 'album' and 'artist' parameters are required" },
        { status: 400 }
      );
    }

    console.log(`🧪 Testing Wikipedia/fallback fetch for: "${album}" by ${artist}`);

    const result = await fetchWikipediaDescription(album, artist);

    return NextResponse.json({
      album,
      artist,
      result,
      success: !!result.description,
      message: result.description
        ? `Found description from ${result.source}`
        : "No description found from any source"
    });

  } catch (error) {
    console.error("Test error:", error);
    return NextResponse.json(
      { error: "Test failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}