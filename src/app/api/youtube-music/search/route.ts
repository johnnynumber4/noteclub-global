import { NextRequest, NextResponse } from "next/server";
import YTMusic from "ytmusic-api";

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

    console.log("Searching YouTube Music for:", query);

    // Initialize ytmusic-api
    const ytmusic = new YTMusic();
    await ytmusic.initialize();

    let searchResults = [];
    
    try {
      // Search for albums specifically
      const results = await ytmusic.searchAlbums(query);
      searchResults = results;
      console.log(`Found ${searchResults.length} results from YouTube Music`);
    } catch (apiError: any) {
      console.warn("YouTube Music API error:", apiError?.message || apiError);
      throw apiError;
    }
    
    // Helper function to get the best quality thumbnail
    const getBestThumbnail = (thumbnails: any[]) => {
      if (!thumbnails || thumbnails.length === 0) return null;
      
      // Sort by width/height to get the highest quality
      const sorted = thumbnails.sort((a, b) => {
        const aSize = (a.width || 0) * (a.height || 0);
        const bSize = (b.width || 0) * (b.height || 0);
        return bSize - aSize;
      });
      
      return sorted[0]?.url;
    };

    // Transform results to match our interface with enhanced details
    const albums = searchResults.slice(0, 12).map((album: any) => ({
      id: album.albumId || album.browseId || album.id,
      title: album.name || album.title,
      artist: album.artist?.name || album.author?.name || album.author || album.artist,
      year: album.year,
      thumbnail: getBestThumbnail(album.thumbnails) || album.thumbnail,
      youtubeUrl: album.albumId 
        ? `https://music.youtube.com/browse/${album.albumId}`
        : album.playlistId
        ? `https://music.youtube.com/playlist?list=${album.playlistId}`
        : `https://music.youtube.com/browse/${album.browseId || album.id}`,
      type: album.type || "Album",
      
      // Additional metadata for better UX
      duration: album.duration,
      trackCount: album.trackCount,
      explicit: album.explicit,
      
      // Multiple thumbnail sizes
      thumbnails: {
        small: album.thumbnails?.find((t: any) => t.width <= 150)?.url,
        medium: album.thumbnails?.find((t: any) => t.width >= 200 && t.width <= 400)?.url,
        large: album.thumbnails?.find((t: any) => t.width >= 500)?.url,
        original: getBestThumbnail(album.thumbnails)
      }
    }));

    return NextResponse.json({ albums });
  } catch (error) {
    console.error("YouTube Music search error:", error);
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "unknown";
    
    // Provide helpful mock data that suggests the user try manual entry
    const mockAlbums = [
      {
        id: "manual_entry_suggestion",
        title: `Search: "${query}"`,
        artist: "YouTube Music API temporarily unavailable",
        year: new Date().getFullYear(),
        thumbnail: "https://via.placeholder.com/300x300/FF0000/ffffff?text=YTM+UNAVAILABLE",
        youtubeUrl: `https://music.youtube.com/search?q=${encodeURIComponent(query)}`,
        type: "Manual Entry Suggestion",
        trackCount: 0,
        thumbnails: {
          small: "https://via.placeholder.com/150x150/FF0000/ffffff?text=YTM",
          medium: "https://via.placeholder.com/300x300/FF0000/ffffff?text=YTM",
          large: "https://via.placeholder.com/500x500/FF0000/ffffff?text=YTM",
          original: "https://via.placeholder.com/500x500/FF0000/ffffff?text=YTM"
        }
      }
    ];
    
    return NextResponse.json({ 
      albums: mockAlbums,
      error: "YouTube Music API temporarily unavailable. Try manual entry or paste a music link instead.",
      suggestion: "Use the 'Paste Music Link' feature above for better results."
    });
  }
}
