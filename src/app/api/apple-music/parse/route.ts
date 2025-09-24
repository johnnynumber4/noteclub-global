import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/url-utils";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "Apple Music URL is required" },
        { status: 400 }
      );
    }

    console.log("Parsing Apple Music URL:", url);

    // Extract album ID from Apple Music URL
    // Format: https://music.apple.com/us/album/album-name/1234567890
    const albumMatch = url.match(/\/album\/[^\/]+\/(\d+)/);

    if (!albumMatch) {
      return NextResponse.json(
        { error: "Invalid Apple Music album URL format" },
        { status: 400 }
      );
    }

    const albumId = albumMatch[1];

    // Use our album details API to get full information
    const baseUrl = getBaseUrl();
    const albumResponse = await fetch(
      `${baseUrl}/api/apple-music/album?id=${albumId}`
    );

    if (!albumResponse.ok) {
      const errorData = await albumResponse.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to fetch album details" },
        { status: albumResponse.status }
      );
    }

    const { album } = await albumResponse.json();

    return NextResponse.json({
      album: {
        ...album,
        appleMusicUrl: url, // Use the original URL provided
      },
    });
  } catch (error) {
    console.error("Apple Music parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse Apple Music URL" },
      { status: 500 }
    );
  }
}
