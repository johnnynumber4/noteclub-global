import { NextRequest, NextResponse } from "next/server";

// Mock data for demonstration - replace with real YouTube Music API later
const mockAlbums = [
  {
    id: "OLAK5uy_k6WqVQjPCT5ykN_w8mB2M1L0",
    title: "Blood Sugar Sex Magik",
    artist: "Red Hot Chili Peppers",
    year: 1991,
    thumbnail: "https://via.placeholder.com/150x150/d32f2f/ffffff?text=BSSM",
    youtubeUrl:
      "https://music.youtube.com/playlist?list=OLAK5uy_k6WqVQjPCT5ykN_w8mB2M1L0",
    type: "Album",
  },
  {
    id: "OLAK5uy_nBEE5TNHEA2Ryx2F3qLQvF2V",
    title: "Californication",
    artist: "Red Hot Chili Peppers",
    year: 1999,
    thumbnail: "https://via.placeholder.com/150x150/1976d2/ffffff?text=CALIF",
    youtubeUrl:
      "https://music.youtube.com/playlist?list=OLAK5uy_nBEE5TNHEA2Ryx2F3qLQvF2V",
    type: "Album",
  },
  {
    id: "OLAK5uy_lyCGJwR1Q9QxJPSWGJ8s7J8s",
    title: "Stadium Arcadium",
    artist: "Red Hot Chili Peppers",
    year: 2006,
    thumbnail: "https://via.placeholder.com/150x150/388e3c/ffffff?text=SA",
    youtubeUrl:
      "https://music.youtube.com/playlist?list=OLAK5uy_lyCGJwR1Q9QxJPSWGJ8s7J8s",
    type: "Album",
  },
  {
    id: "OLAK5uy_mByTheWay8FnA8FnA8FnA8Fn",
    title: "By the Way",
    artist: "Red Hot Chili Peppers",
    year: 2002,
    thumbnail: "https://via.placeholder.com/150x150/7b1fa2/ffffff?text=BTW",
    youtubeUrl:
      "https://music.youtube.com/playlist?list=OLAK5uy_mByTheWay8FnA8FnA8FnA8Fn",
    type: "Album",
  },
  {
    id: "OLAK5uy_mothersmilk123456789",
    title: "Mother's Milk",
    artist: "Red Hot Chili Peppers",
    year: 1989,
    thumbnail: "https://via.placeholder.com/150x150/f57c00/ffffff?text=MM",
    youtubeUrl:
      "https://music.youtube.com/playlist?list=OLAK5uy_mothersmilk123456789",
    type: "Album",
  },
  {
    id: "OLAK5uy_unlimited_love_2022",
    title: "Unlimited Love",
    artist: "Red Hot Chili Peppers",
    year: 2022,
    thumbnail: "https://via.placeholder.com/150x150/e91e63/ffffff?text=UL",
    youtubeUrl:
      "https://music.youtube.com/playlist?list=OLAK5uy_unlimited_love_2022",
    type: "Album",
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    console.log("Searching for:", query);

    // Simulate search delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Filter mock results based on query
    const filteredAlbums = mockAlbums.filter(
      (album) =>
        album.title.toLowerCase().includes(query.toLowerCase()) ||
        album.artist.toLowerCase().includes(query.toLowerCase())
    );

    // If no specific matches, return all mock albums for demo
    const results = filteredAlbums.length > 0 ? filteredAlbums : mockAlbums;

    return NextResponse.json({ albums: results });
  } catch (error) {
    console.error("YouTube Music search error:", error);
    return NextResponse.json(
      { error: "Failed to search YouTube Music: " + (error as Error).message },
      { status: 500 }
    );
  }
}
