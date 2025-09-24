import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    console.log(`Searching Apple Music for: ${query}`);

    // Use iTunes Search API (which includes Apple Music)
    const searchUrl = new URL("https://itunes.apple.com/search");
    searchUrl.searchParams.append("term", query);
    searchUrl.searchParams.append("entity", "album");
    searchUrl.searchParams.append("media", "music");
    searchUrl.searchParams.append("limit", Math.min(limit, 50).toString());
    searchUrl.searchParams.append("explicit", "Yes");

    const response = await fetch(searchUrl.toString(), {
      headers: {
        'User-Agent': 'NoteClubModern/1.0 (https://noteclub.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`Apple Music API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the results to our format
    const albums = data.results.map((item: any) => ({
      id: item.collectionId.toString(),
      title: item.collectionName,
      artist: item.artistName,
      year: item.releaseDate ? new Date(item.releaseDate).getFullYear() : null,
      genre: item.primaryGenreName,
      thumbnail: item.artworkUrl100?.replace('100x100', '600x600') || item.artworkUrl100,
      appleMusicUrl: item.collectionViewUrl,
      trackCount: item.trackCount,
      duration: null, // Not provided by iTunes API
      explicit: item.collectionExplicitness === 'explicit',
      copyright: item.copyright,
      price: item.collectionPrice,
      currency: item.currency,
      country: item.country,
      // Additional metadata
      label: null, // Not directly available
      type: 'Album',
      thumbnails: {
        small: item.artworkUrl60,
        medium: item.artworkUrl100,
        large: item.artworkUrl100?.replace('100x100', '600x600') || item.artworkUrl100,
        original: item.artworkUrl100?.replace('100x100', '600x600') || item.artworkUrl100
      }
    }));

    console.log(`Found ${albums.length} albums from Apple Music`);

    return NextResponse.json({ 
      albums,
      total: data.resultCount,
      query: query
    });

  } catch (error) {
    console.error("Apple Music search error:", error);
    return NextResponse.json(
      { error: "Failed to search Apple Music" },
      { status: 500 }
    );
  }
}