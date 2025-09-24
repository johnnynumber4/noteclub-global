import { NextRequest, NextResponse } from "next/server";

interface UnifiedAlbumResult {
  id: string;
  title: string;
  artist: string;
  year?: number;
  genre?: string;
  thumbnail?: string;
  description?: string;
  duration?: number;
  trackCount?: number;
  
  // Streaming URLs
  youtubeMusicUrl?: string;
  spotifyUrl?: string;
  appleMusicUrl?: string;
  
  // Source information
  primarySource: 'youtube' | 'spotify' | 'apple';
  availableOn: string[];
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

    console.log(`🔍 Unified music search for: ${query}`);

    // Search all services in parallel
    const [youtubeResults, spotifyResults, appleMusicResults] = await Promise.allSettled([
      searchYouTubeMusic(query, limit),
      searchSpotify(query, limit),
      searchAppleMusic(query, limit)
    ]);

    // Extract successful results
    const youtubeAlbums = youtubeResults.status === 'fulfilled' ? youtubeResults.value : [];
    const spotifyAlbums = spotifyResults.status === 'fulfilled' ? spotifyResults.value : [];
    const appleMusicAlbums = appleMusicResults.status === 'fulfilled' ? appleMusicResults.value : [];

    console.log(`📊 Search results - YouTube: ${youtubeAlbums.length}, Spotify: ${spotifyAlbums.length}, Apple Music: ${appleMusicAlbums.length}`);

    // Create unified results by matching albums across services
    const unifiedResults: UnifiedAlbumResult[] = [];
    const processedTitles = new Set<string>();

    // Process YouTube Music results first (often has good descriptions)
    for (const ytAlbum of youtubeAlbums) {
      const normalizedTitle = normalizeTitle(ytAlbum.title, ytAlbum.artist);
      if (processedTitles.has(normalizedTitle)) continue;
      
      processedTitles.add(normalizedTitle);
      
      const unified: UnifiedAlbumResult = {
        id: `unified_${ytAlbum.id}`,
        title: ytAlbum.title,
        artist: ytAlbum.artist,
        year: ytAlbum.year,
        genre: ytAlbum.genre,
        thumbnail: ytAlbum.thumbnail,
        description: ytAlbum.description,
        duration: ytAlbum.duration,
        trackCount: ytAlbum.trackCount,
        youtubeMusicUrl: ytAlbum.youtubeUrl,
        primarySource: 'youtube',
        availableOn: ['YouTube Music']
      };

      // Find matching Spotify album
      const spotifyMatch = findBestMatch(unified, spotifyAlbums);
      if (spotifyMatch) {
        unified.spotifyUrl = spotifyMatch.spotifyUrl;
        unified.availableOn.push('Spotify');
        // Use Spotify data if YouTube is missing some info
        if (!unified.genre && spotifyMatch.genre) unified.genre = spotifyMatch.genre;
        if (!unified.year && spotifyMatch.year) unified.year = spotifyMatch.year;
      }

      // Find matching Apple Music album
      const appleMusicMatch = findBestMatch(unified, appleMusicAlbums);
      if (appleMusicMatch) {
        unified.appleMusicUrl = appleMusicMatch.appleMusicUrl;
        unified.availableOn.push('Apple Music');
        // Use Apple Music data if others are missing some info
        if (!unified.genre && appleMusicMatch.genre) unified.genre = appleMusicMatch.genre;
        if (!unified.year && appleMusicMatch.year) unified.year = appleMusicMatch.year;
      }

      unifiedResults.push(unified);
    }

    // Add remaining Spotify albums that weren't matched
    for (const spotifyAlbum of spotifyAlbums) {
      const normalizedTitle = normalizeTitle(spotifyAlbum.title, spotifyAlbum.artist);
      if (processedTitles.has(normalizedTitle)) continue;
      
      processedTitles.add(normalizedTitle);
      
      const unified: UnifiedAlbumResult = {
        id: `unified_${spotifyAlbum.id}`,
        title: spotifyAlbum.title,
        artist: spotifyAlbum.artist,
        year: spotifyAlbum.year,
        genre: spotifyAlbum.genre,
        thumbnail: spotifyAlbum.thumbnail,
        duration: spotifyAlbum.duration,
        trackCount: spotifyAlbum.trackCount,
        spotifyUrl: spotifyAlbum.spotifyUrl,
        primarySource: 'spotify',
        availableOn: ['Spotify']
      };

      // Find matching Apple Music album
      const appleMusicMatch = findBestMatch(unified, appleMusicAlbums);
      if (appleMusicMatch) {
        unified.appleMusicUrl = appleMusicMatch.appleMusicUrl;
        unified.availableOn.push('Apple Music');
      }

      unifiedResults.push(unified);
    }

    // Add remaining Apple Music albums that weren't matched
    for (const appleMusicAlbum of appleMusicAlbums) {
      const normalizedTitle = normalizeTitle(appleMusicAlbum.title, appleMusicAlbum.artist);
      if (processedTitles.has(normalizedTitle)) continue;
      
      processedTitles.add(normalizedTitle);
      
      const unified: UnifiedAlbumResult = {
        id: `unified_${appleMusicAlbum.id}`,
        title: appleMusicAlbum.title,
        artist: appleMusicAlbum.artist,
        year: appleMusicAlbum.year,
        genre: appleMusicAlbum.genre,
        thumbnail: appleMusicAlbum.thumbnail,
        duration: appleMusicAlbum.duration,
        trackCount: appleMusicAlbum.trackCount,
        appleMusicUrl: appleMusicAlbum.appleMusicUrl,
        primarySource: 'apple',
        availableOn: ['Apple Music']
      };

      unifiedResults.push(unified);
    }

    // Sort results by relevance (more platforms = higher relevance)
    const sortedResults = unifiedResults
      .sort((a, b) => b.availableOn.length - a.availableOn.length)
      .slice(0, limit);

    console.log(`✨ Unified search completed: ${sortedResults.length} results`);

    return NextResponse.json({
      albums: sortedResults,
      query,
      searchSummary: {
        youtube: youtubeAlbums.length,
        spotify: spotifyAlbums.length,
        appleMusic: appleMusicAlbums.length,
        unified: sortedResults.length
      }
    });

  } catch (error) {
    console.error("Unified music search error:", error);
    return NextResponse.json(
      { error: "Failed to search music services" },
      { status: 500 }
    );
  }
}

async function searchYouTubeMusic(query: string, limit: number): Promise<any[]> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/youtube-music/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.albums || [];
  } catch (error) {
    console.log("YouTube Music search failed:", error);
    return [];
  }
}

async function searchSpotify(query: string, limit: number): Promise<any[]> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/spotify/search?q=${encodeURIComponent(query)}&type=album&limit=${limit}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.log("Spotify search failed:", error);
    return [];
  }
}

async function searchAppleMusic(query: string, limit: number): Promise<any[]> {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/apple-music/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.albums || [];
  } catch (error) {
    console.log("Apple Music search failed:", error);
    return [];
  }
}

function normalizeTitle(title: string, artist: string): string {
  // Create a normalized key for matching albums across services
  return `${title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()}_${artist.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()}`;
}

function findBestMatch(target: UnifiedAlbumResult, candidates: any[]): any | null {
  const targetNormalized = normalizeTitle(target.title, target.artist);
  
  // Try exact match first
  let bestMatch = candidates.find(candidate => 
    normalizeTitle(candidate.title || candidate.name, candidate.artist || candidate.artistName) === targetNormalized
  );
  
  if (bestMatch) return bestMatch;
  
  // Try partial matches
  const targetTitle = target.title.toLowerCase();
  const targetArtist = target.artist.toLowerCase();
  
  bestMatch = candidates.find(candidate => {
    const candidateTitle = (candidate.title || candidate.name || '').toLowerCase();
    const candidateArtist = (candidate.artist || candidate.artistName || '').toLowerCase();
    
    return candidateTitle.includes(targetTitle) && candidateArtist.includes(targetArtist) ||
           targetTitle.includes(candidateTitle) && targetArtist.includes(candidateArtist);
  });
  
  return bestMatch || null;
}