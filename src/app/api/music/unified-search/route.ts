import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/url-utils";

interface UnifiedAlbumResult {
  id: string;
  title: string;
  artist: string;
  year?: number;
  thumbnail?: string;
  source: "spotify" | "youtube";
  spotifyUrl?: string;
  youtubeMusicUrl?: string;
  youtubeUrl?: string;
  trackCount?: number;
  albumType?: string;
  genres?: string[];
  explicit?: boolean;
  description?: string;
  type?: string;
  duration?: string;
  thumbnails?: {
    small?: string;
    medium?: string;
    large?: string;
    original?: string;
  };
}

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

    // Search both platforms in parallel with timeout
    const [spotifyResults, youtubeResults] = await Promise.allSettled([
      searchSpotify(query, limit),
      searchYouTubeMusic(query, limit),
    ]);

    let combinedResults: UnifiedAlbumResult[] = [];
    const errors: string[] = [];

    // Process Spotify results
    if (spotifyResults.status === "fulfilled" && spotifyResults.value) {
      combinedResults = [...combinedResults, ...spotifyResults.value];
    } else if (spotifyResults.status === "rejected") {
      errors.push(`Spotify: ${spotifyResults.reason.message}`);
    }

    // Process YouTube Music results
    if (youtubeResults.status === "fulfilled" && youtubeResults.value) {
      combinedResults = [...combinedResults, ...youtubeResults.value];
    } else if (youtubeResults.status === "rejected") {
      errors.push(`YouTube Music: ${youtubeResults.reason.message}`);
    }

    // Sort results by relevance (you can customize this logic)
    combinedResults.sort((a, b) => {
      // Prefer results with more complete data
      const scoreA = getRelevanceScore(a, query);
      const scoreB = getRelevanceScore(b, query);
      return scoreB - scoreA;
    });

    return NextResponse.json({
      results: combinedResults,
      query,
      total: combinedResults.length,
      sources: {
        spotify: spotifyResults.status === "fulfilled",
        youtube: youtubeResults.status === "fulfilled",
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Unified search error:", error);
    return NextResponse.json(
      { error: "Search failed: " + (error as Error).message },
      { status: 500 }
    );
  }
}

async function searchSpotify(
  query: string,
  limit: number
): Promise<UnifiedAlbumResult[]> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(
      `${baseUrl}/api/spotify/search?q=${encodeURIComponent(
        query
      )}&type=album&limit=${limit}`,
      {
        signal: AbortSignal.timeout(15000) // 15 second timeout
      }
    );

    if (!response.ok) {
      throw new Error(`Spotify search failed: ${response.status}`);
    }

    const data = await response.json();
    return (data.results || []).map(
      (album: any): UnifiedAlbumResult => ({
        id: `spotify_${album.id}`,
        title: album.title,
        artist: album.artist,
        year: album.year,
        thumbnail: album.thumbnail,
        source: "spotify" as const,
        spotifyUrl: album.spotifyUrl,
        trackCount: album.trackCount,
        albumType: album.albumType,
        genres: album.genres,
      })
    );
  } catch (error) {
    console.error("Spotify search error:", error);
    throw error;
  }
}

async function searchYouTubeMusic(
  query: string,
  limit: number
): Promise<UnifiedAlbumResult[]> {
  try {
    // Try v2 API first, fallback to original
    const baseUrl = getBaseUrl();
    let response = await fetch(
      `${baseUrl}/api/youtube-music/search-v2?q=${encodeURIComponent(query)}`,
      {
        signal: AbortSignal.timeout(15000) // 15 second timeout
      }
    );

    if (!response.ok) {
      // Fallback to original API
      response = await fetch(
        `${baseUrl}/api/youtube-music/search?q=${encodeURIComponent(query)}`,
        {
          signal: AbortSignal.timeout(15000) // 15 second timeout
        }
      );
    }

    if (!response.ok) {
      throw new Error(`YouTube Music search failed: ${response.status}`);
    }

    const data = await response.json();
    return (data.albums || []).slice(0, limit).map(
      (album: any): UnifiedAlbumResult => ({
        id: `youtube_${album.id}`,
        title: album.title,
        artist: album.artist,
        year: album.year,
        thumbnail: album.thumbnails?.medium || album.thumbnail,
        source: "youtube" as const,
        youtubeMusicUrl: album.youtubeUrl,
        trackCount: album.trackCount,
        explicit: album.explicit,
        description: album.description,
        type: album.type,
        duration: album.duration,
        thumbnails: album.thumbnails,
      })
    );
  } catch (error) {
    console.error("YouTube Music search error:", error);
    throw error;
  }
}

function getRelevanceScore(album: UnifiedAlbumResult, query: string): number {
  let score = 0;
  const queryLower = query.toLowerCase();
  const titleLower = album.title.toLowerCase();
  const artistLower = album.artist.toLowerCase();

  // Exact matches get highest score
  if (titleLower === queryLower) score += 100;
  if (artistLower === queryLower) score += 80;

  // Partial matches
  if (titleLower.includes(queryLower)) score += 50;
  if (artistLower.includes(queryLower)) score += 40;

  // Bonus for having complete metadata
  if (album.year) score += 10;
  if (album.thumbnail) score += 10;
  if (album.trackCount) score += 5;
  if (album.genres?.length) score += 5;

  // Source preference (you can adjust this)
  if (album.source === "spotify") score += 2; // Slightly prefer Spotify for metadata quality

  return score;
}
