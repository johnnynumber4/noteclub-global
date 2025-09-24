import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "@/lib/url-utils";

interface ParsedAlbumData {
  title: string;
  artist: string;
  year?: number;
  thumbnail?: string;
  spotifyUrl?: string;
  youtubeMusicUrl?: string;
  appleMusicUrl?: string;
  genres?: string[];
  trackCount?: number;
  duration?: number;
  source: "spotify" | "youtube" | "apple" | "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: "Music URL is required" },
        { status: 400 }
      );
    }

    console.log("Parsing music link:", url);

    let albumData: ParsedAlbumData | null = null;

    // Try Spotify first
    if (url.includes("spotify.com")) {
      albumData = await parseSpotifyUrl(url);
    }
    // Try YouTube Music
    else if (url.includes("music.youtube.com")) {
      albumData = await parseYouTubeUrl(url);
    }
    // Try Apple Music
    else if (url.includes("music.apple.com")) {
      albumData = await parseAppleMusicUrl(url);
    }

    if (!albumData) {
      return NextResponse.json(
        { error: "Unsupported music platform or invalid URL" },
        { status: 400 }
      );
    }

    return NextResponse.json({ album: albumData });
  } catch (error) {
    console.error("Music link parse error:", error);
    return NextResponse.json(
      { error: "Failed to parse music link: " + (error as Error).message },
      { status: 500 }
    );
  }
}

async function parseSpotifyUrl(url: string): Promise<ParsedAlbumData | null> {
  try {
    // Call our Spotify parser
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/spotify/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return {
      ...data.album,
      source: "spotify" as const,
      spotifyUrl: url,
    };
  } catch (error) {
    console.error("Spotify parse error:", error);
    return null;
  }
}

async function parseYouTubeUrl(url: string): Promise<ParsedAlbumData | null> {
  try {
    // Extract playlist ID from YouTube Music URL
    const playlistMatch = url.match(/[?&]list=([^&]+)/);
    if (!playlistMatch) return null;

    const YoutubeMusicApi = require("node-youtube-music").default;

    // Try to get album info from the playlist
    const albumInfo = await YoutubeMusicApi.getAlbum(playlistMatch[1]);

    return {
      title: albumInfo.title,
      artist: albumInfo.artist?.name || albumInfo.artist,
      year: albumInfo.year,
      thumbnail: albumInfo.thumbnails?.[0]?.url,
      youtubeMusicUrl: url,
      trackCount: albumInfo.tracks?.length,
      source: "youtube" as const,
    };
  } catch (error) {
    console.error("YouTube parse error:", error);
    return null;
  }
}

async function parseAppleMusicUrl(
  url: string
): Promise<ParsedAlbumData | null> {
  try {
    // Call our Apple Music parser
    const response = await fetch(
      `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/api/apple-music/parse`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return {
      ...data.album,
      source: "apple" as const,
      appleMusicUrl: url,
    };
  } catch (error) {
    console.error("Apple Music parse error:", error);
    return null;
  }
}
