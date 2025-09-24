import { NextRequest, NextResponse } from "next/server";
import YTMusic from "ytmusic-api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const albumId = searchParams.get("id");

    if (!albumId) {
      return NextResponse.json(
        { error: "Album ID is required" },
        { status: 400 }
      );
    }

    console.log("Fetching YouTube Music album details for:", albumId);

    // Initialize ytmusic-api
    const ytmusic = new YTMusic();
    await ytmusic.initialize();

    // Get detailed album information
    const albumDetails = await ytmusic.getAlbum(albumId);
    
    if (!albumDetails) {
      return NextResponse.json(
        { error: "Album not found" },
        { status: 404 }
      );
    }


    // Extract the best quality thumbnail
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

    // Try to get a rich description from multiple sources
    let albumDescription = null;
    
    // First, try Wikipedia with exact album title
    if (albumDetails.name && albumDetails.artist?.name) {
      try {
        // Try different Wikipedia search strategies
        const searchTerms = [
          `${albumDetails.name}_album`,
          `${albumDetails.name}_(album)`,
          `${albumDetails.name}_(${albumDetails.artist.name}_album)`,
          `${albumDetails.name}_${albumDetails.artist.name}_album`
        ];
        
        for (const searchTerm of searchTerms) {
          try {
            const wikiResponse = await fetch(
              `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`,
              { 
                headers: { 
                  'User-Agent': 'NoteClubModern/1.0 (https://noteclub.com)' 
                } 
              }
            );
            
            if (wikiResponse.ok) {
              const wikiData = await wikiResponse.json();
              if (wikiData.extract && wikiData.extract.length > 100 && !wikiData.extract.includes('may refer to')) {
                albumDescription = wikiData.extract;
                break; // Found a good description, stop searching
              }
            }
          } catch (e) {
            continue;
          }
        }
      } catch (error) {
        // Silently fail Wikipedia search
      }
    }
    
    // Fallback to basic description if Wikipedia didn't work
    if (!albumDescription && albumDetails.name && albumDetails.artist?.name && albumDetails.year) {
      albumDescription = `"${albumDetails.name}" is an album by ${albumDetails.artist.name}${albumDetails.year ? ` released in ${albumDetails.year}` : ''}.${albumDetails.songs?.length ? ` This album contains ${albumDetails.songs.length} tracks.` : ''}`;
    }

    // Transform to our album format using actual ytmusic-api structure
    const album = {
      id: albumDetails.albumId || albumId,
      title: albumDetails.name,
      artist: albumDetails.artist?.name,
      year: albumDetails.year,
      thumbnail: getBestThumbnail(albumDetails.thumbnails),
      youtubeUrl: `https://music.youtube.com/browse/${albumId}`,
      type: albumDetails.type || "Album",
      
      // Enhanced details from ytmusic-api format
      description: albumDescription,
      duration: null,
      trackCount: albumDetails.songs?.length || 0,
      
      // Track listing from songs array
      tracks: albumDetails.songs?.slice(0, 20).map((song: any, index: number) => ({
        position: index + 1,
        title: song.name,
        artist: song.artist?.name,
        duration: song.duration,
        youtubeUrl: song.videoId ? `https://music.youtube.com/watch?v=${song.videoId}` : null
      })) || [],
      
      // Additional metadata
      genre: null,
      label: null,
      copyright: null,
      releaseType: albumDetails.type,
      
      // All available thumbnails for different use cases
      thumbnails: {
        small: albumDetails.thumbnails?.find((t: any) => t.width <= 150)?.url,
        medium: albumDetails.thumbnails?.find((t: any) => t.width >= 200 && t.width <= 400)?.url,
        large: albumDetails.thumbnails?.find((t: any) => t.width >= 500)?.url,
        original: getBestThumbnail(albumDetails.thumbnails)
      }
    };

    return NextResponse.json({ album });
  } catch (error) {
    console.error("YouTube Music album details error:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch album details" },
      { status: 500 }
    );
  }
}