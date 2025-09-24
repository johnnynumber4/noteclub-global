import { NextRequest, NextResponse } from "next/server";

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

    console.log("🎵 Searching YouTube Music v2 for:", query);

    let searchResults: any[] = [];
    
    try {
      // Import ytmusic-api dynamically to avoid SSR issues
      const YTMusic = (await import("ytmusic-api")).default;
      const ytmusic = new YTMusic();
      
      // Initialize the API
      await ytmusic.initialize();
      
      // Search for albums
      const results = await ytmusic.searchAlbums(query);
      
      console.log(`✅ Found ${results.length} results from YTMusic API v2`);
      
      // Transform results to our format
      searchResults = results.slice(0, 12).map((album: any) => {
        // Extract the best quality thumbnail
        const getBestThumbnail = (thumbnails: any[]) => {
          if (!thumbnails || thumbnails.length === 0) return null;
          
          // Find the highest quality thumbnail
          const sorted = thumbnails.sort((a, b) => {
            const aSize = (a.width || 0) * (a.height || 0);
            const bSize = (b.width || 0) * (b.height || 0);
            return bSize - aSize;
          });
          
          return sorted[0]?.url;
        };

        const thumbnail = getBestThumbnail(album.thumbnails);
        
        return {
          id: album.albumId || album.browseId,
          title: album.name || album.title,
          artist: album.artist?.name || album.artist || "Unknown Artist",
          year: album.year,
          thumbnail: thumbnail,
          youtubeUrl: album.albumId 
            ? `https://music.youtube.com/browse/${album.albumId}`
            : album.browseId
            ? `https://music.youtube.com/browse/${album.browseId}`
            : `https://music.youtube.com/search?q=${encodeURIComponent(album.name || album.title)}`,
          type: album.type || "Album",
          
          // Enhanced metadata
          duration: album.duration,
          trackCount: album.trackCount,
          explicit: album.isExplicit,
          description: null, // Will be populated when getting detailed info
          
          // Multiple thumbnail sizes
          thumbnails: {
            small: album.thumbnails?.find((t: any) => t.width <= 150)?.url,
            medium: album.thumbnails?.find((t: any) => t.width >= 200 && t.width <= 400)?.url,
            large: album.thumbnails?.find((t: any) => t.width >= 500)?.url,
            original: thumbnail
          }
        };
      });

    } catch (apiError: any) {
      console.error("YTMusic API v2 error:", apiError?.message || apiError);
      
      // Provide helpful fallback data
      const fallbackQuery = query;
      searchResults = [
        {
          id: "ytmusic_api_unavailable",
          title: `Search: "${fallbackQuery}"`,
          artist: "YTMusic API temporarily unavailable",
          year: new Date().getFullYear(),
          thumbnail: "https://via.placeholder.com/300x300/1976D2/ffffff?text=YTM+V2",
          youtubeUrl: `https://music.youtube.com/search?q=${encodeURIComponent(fallbackQuery)}`,
          type: "API Error",
          trackCount: 0,
          thumbnails: {
            small: "https://via.placeholder.com/150x150/1976D2/ffffff?text=YTM",
            medium: "https://via.placeholder.com/300x300/1976D2/ffffff?text=YTM",
            large: "https://via.placeholder.com/500x500/1976D2/ffffff?text=YTM",
            original: "https://via.placeholder.com/500x500/1976D2/ffffff?text=YTM"
          }
        }
      ];
      
      return NextResponse.json({ 
        albums: searchResults,
        error: "YTMusic API v2 temporarily unavailable. Try manual entry or paste a music link instead.",
        suggestion: "Use the 'Paste Music Link' feature for better results, or enter album details manually."
      });
    }
    
    return NextResponse.json({ 
      albums: searchResults,
      source: "ytmusic-api-v5"
    });
    
  } catch (error: any) {
    console.error("YTMusic search v2 error:", error);
    
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "unknown";
    
    return NextResponse.json(
      { 
        error: "Failed to search YouTube Music",
        albums: [{
          id: "system_error",
          title: `Search: "${query}"`,
          artist: "System error occurred",
          year: new Date().getFullYear(),
          thumbnail: "https://via.placeholder.com/300x300/F44336/ffffff?text=ERROR",
          youtubeUrl: `https://music.youtube.com/search?q=${encodeURIComponent(query)}`,
          type: "Error",
          trackCount: 0
        }]
      },
      { status: 500 }
    );
  }
}