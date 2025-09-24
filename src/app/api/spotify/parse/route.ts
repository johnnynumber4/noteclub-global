import { NextRequest, NextResponse } from "next/server";

interface SpotifyAlbumData {
  id: string;
  title: string;
  artist: string;
  year: number;
  thumbnail: string;
  spotifyUrl: string;
  genres: string[];
  trackCount: number;
  duration: number;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: "Spotify URL is required" },
        { status: 400 }
      );
    }

    // Extract album ID from Spotify URL
    const albumId = extractSpotifyAlbumId(url);
    if (!albumId) {
      return NextResponse.json(
        { error: "Invalid Spotify album URL" },
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

    // Fetch album data from Spotify
    const albumData = await fetchSpotifyAlbum(albumId, accessToken);
    
    return NextResponse.json({ album: albumData });
  } catch (error) {
    console.error("Spotify parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse Spotify album: " + (error as Error).message },
      { status: 500 }
    );
  }
}

function extractSpotifyAlbumId(url: string): string | null {
  const patterns = [
    /spotify\.com\/album\/([a-zA-Z0-9]+)/,
    /open\.spotify\.com\/album\/([a-zA-Z0-9]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
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
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
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

async function fetchSpotifyAlbum(albumId: string, accessToken: string): Promise<SpotifyAlbumData> {
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
  };
}