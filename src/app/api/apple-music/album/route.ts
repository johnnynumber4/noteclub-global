import { NextRequest, NextResponse } from "next/server";

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

    console.log("Fetching Apple Music album details for:", albumId);

    // Use iTunes Lookup API to get album details and tracks
    const lookupUrl = new URL("https://itunes.apple.com/lookup");
    lookupUrl.searchParams.append("id", albumId);
    lookupUrl.searchParams.append("entity", "song");
    lookupUrl.searchParams.append("limit", "200");

    const response = await fetch(lookupUrl.toString(), {
      headers: {
        'User-Agent': 'NoteClubModern/1.0 (https://noteclub.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`Apple Music API returned ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      return NextResponse.json(
        { error: "Album not found" },
        { status: 404 }
      );
    }

    // First result is the album, rest are tracks
    const albumInfo = data.results[0];
    const tracks = data.results.slice(1).filter((item: any) => item.wrapperType === 'track');

    // Calculate total duration from tracks
    const totalDurationMs = tracks.reduce((sum: number, track: any) => sum + (track.trackTimeMillis || 0), 0);

    const album = {
      id: albumInfo.collectionId.toString(),
      title: albumInfo.collectionName,
      artist: albumInfo.artistName,
      year: albumInfo.releaseDate ? new Date(albumInfo.releaseDate).getFullYear() : null,
      genre: albumInfo.primaryGenreName,
      thumbnail: albumInfo.artworkUrl100?.replace('100x100', '600x600') || albumInfo.artworkUrl100,
      appleMusicUrl: albumInfo.collectionViewUrl,
      type: "Album",
      
      // Enhanced details
      description: null, // Would need additional API or scraping
      duration: Math.round(totalDurationMs / 1000), // Convert to seconds
      trackCount: albumInfo.trackCount,
      
      // Track listing
      tracks: tracks.map((track: any, index: number) => ({
        position: track.trackNumber || index + 1,
        title: track.trackName,
        artist: track.artistName,
        duration: track.trackTimeMillis ? Math.round(track.trackTimeMillis / 1000) : null,
        explicit: track.trackExplicitness === 'explicit',
        previewUrl: track.previewUrl,
        appleMusicUrl: track.trackViewUrl
      })),
      
      // Additional metadata
      explicit: albumInfo.collectionExplicitness === 'explicit',
      copyright: albumInfo.copyright,
      price: albumInfo.collectionPrice,
      currency: albumInfo.currency,
      country: albumInfo.country,
      releaseType: 'Album',
      
      // All available artwork sizes
      thumbnails: {
        small: albumInfo.artworkUrl60,
        medium: albumInfo.artworkUrl100,
        large: albumInfo.artworkUrl100?.replace('100x100', '600x600') || albumInfo.artworkUrl100,
        original: albumInfo.artworkUrl100?.replace('100x100', '600x600') || albumInfo.artworkUrl100
      }
    };

    return NextResponse.json({ album });
  } catch (error) {
    console.error("Apple Music album details error:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch album details" },
      { status: 500 }
    );
  }
}