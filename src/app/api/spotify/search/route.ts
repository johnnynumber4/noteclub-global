import { NextRequest, NextResponse } from "next/server";

interface SpotifySearchResult {
  id: string;
  title: string;
  artist: string;
  year: number;
  thumbnail: string;
  spotifyUrl: string;
  albumType: string;
  trackCount: number;
  genres: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "album";
    const limit = parseInt(searchParams.get("limit") || "20");

    if (!query) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    // Get Spotify access token
    const accessToken = await getSpotifyAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: "Failed to authenticate with Spotify" },
        { status: 500 }
      );
    }

    // Search Spotify
    const searchResults = await searchSpotify(query, type, limit, accessToken);

    return NextResponse.json({
      results: searchResults,
      query,
      total: searchResults.length,
    });
  } catch (error) {
    console.error("Spotify search error:", error);
    return NextResponse.json(
      { error: "Failed to search Spotify: " + (error as Error).message },
      { status: 500 }
    );
  }
}

async function getSpotifyAccessToken(): Promise<string | null> {
  try {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("Missing Spotify credentials");
      return null;
    }

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${clientId}:${clientSecret}`
        ).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      throw new Error(`Spotify auth failed: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Spotify auth error:", error);
    return null;
  }
}

async function searchSpotify(
  query: string,
  type: string,
  limit: number,
  accessToken: string
): Promise<SpotifySearchResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://api.spotify.com/v1/search?q=${encodedQuery}&type=${type}&limit=${limit}&market=US`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Spotify API failed: ${response.status}`);
  }

  const data = await response.json();

  if (type === "album" && data.albums) {
    return data.albums.items.map(
      (album: any): SpotifySearchResult => ({
        id: album.id,
        title: album.name,
        artist: album.artists[0]?.name || "Unknown Artist",
        year: album.release_date
          ? parseInt(album.release_date.split("-")[0])
          : 0,
        thumbnail: album.images[0]?.url || "",
        spotifyUrl: album.external_urls.spotify,
        albumType: album.album_type,
        trackCount: album.total_tracks,
        genres: album.genres || [],
      })
    );
  }

  return [];
}

export async function POST(request: NextRequest) {
  try {
    const { albumId } = await request.json();

    if (!albumId) {
      return NextResponse.json(
        { error: "Album ID is required" },
        { status: 400 }
      );
    }

    // Get Spotify access token
    const accessToken = await getSpotifyAccessToken();
    if (!accessToken) {
      return NextResponse.json(
        { error: "Failed to authenticate with Spotify" },
        { status: 500 }
      );
    }

    // Get detailed album info
    const albumDetails = await getSpotifyAlbumDetails(albumId, accessToken);

    return NextResponse.json({ album: albumDetails });
  } catch (error) {
    console.error("Spotify album details error:", error);
    return NextResponse.json(
      { error: "Failed to get album details: " + (error as Error).message },
      { status: 500 }
    );
  }
}

async function getSpotifyAlbumDetails(albumId: string, accessToken: string) {
  const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Spotify API failed: ${response.status}`);
  }

  const album = await response.json();

  // Calculate total duration
  const totalDuration = album.tracks.items.reduce(
    (acc: number, track: any) => acc + track.duration_ms,
    0
  );

  return {
    id: album.id,
    title: album.name,
    artist: album.artists[0]?.name || "Unknown Artist",
    year: parseInt(album.release_date.split("-")[0]),
    thumbnail: album.images[0]?.url || "",
    spotifyUrl: album.external_urls.spotify,
    genres: album.genres || [],
    trackCount: album.total_tracks,
    duration: Math.round(totalDuration / 1000), // Convert to seconds
    tracks: album.tracks.items.map((track: any) => ({
      name: track.name,
      trackNumber: track.track_number,
      duration: Math.round(track.duration_ms / 1000),
      artists: track.artists.map((artist: any) => artist.name),
    })),
    releaseDate: album.release_date,
    label: album.label,
    popularity: album.popularity,
  };
}
