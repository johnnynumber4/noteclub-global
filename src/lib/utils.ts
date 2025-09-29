import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Fetches Wikipedia description for an album, with fallback to music search APIs
 */
export async function fetchWikipediaDescription(albumTitle: string, artistName: string): Promise<{
  description: string | null;
  url: string | null;
  source: 'wikipedia' | 'music-search' | 'fallback';
}> {
  try {
    // Try multiple Wikipedia search strategies
    const searchTerms = [
      `${albumTitle}_album`,
      `${albumTitle}_(album)`,
      `${albumTitle}_(${artistName}_album)`,
      `${albumTitle}_${artistName}_album`,
      `${albumTitle}`,
      `${albumTitle}_by_${artistName}`,
      `${albumTitle}_(${artistName})`
    ];

    for (const searchTerm of searchTerms) {
      try {
        const wikiResponse = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchTerm)}`,
          {
            headers: {
              'User-Agent': 'NoteClubModern/1.0 (https://noteclub.com)',
              'Accept': 'application/json'
            }
          }
        );

        if (wikiResponse.ok) {
          const wikiData = await wikiResponse.json();
          
          // Check if this is a good result
          if (wikiData.extract && 
              wikiData.extract.length > 50 && 
              !wikiData.extract.includes('may refer to') &&
              !wikiData.extract.includes('is a disambiguation page') &&
              wikiData.type === 'standard') {
            
            // Score the result based on relevance
            const extract = wikiData.extract.toLowerCase();
            const albumLower = albumTitle.toLowerCase();
            const artistLower = artistName.toLowerCase();
            
            let score = 0;
            if (extract.includes(albumLower)) score += 3;
            if (extract.includes(artistLower)) score += 2;
            if (extract.includes('album')) score += 1;
            if (extract.includes('studio album')) score += 2;
            if (extract.includes('debut album')) score += 2;
            
            // Accept good matches
            if (score >= 3 || (extract.includes(albumLower) && extract.includes(artistLower))) {
              return {
                description: wikiData.extract,
                url: wikiData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(searchTerm)}`,
                source: 'wikipedia'
              };
            }
          }
        }
      } catch {
        continue;
      }
    }

    // If Wikipedia fails, try MusicBrainz API for album information
    try {
      console.log(`📀 Wikipedia failed for "${albumTitle}" by ${artistName}, trying MusicBrainz...`);

      // Search MusicBrainz for album information
      const searchQuery = `${albumTitle} AND artist:${artistName}`;
      const mbResponse = await fetch(
        `https://musicbrainz.org/ws/2/release-group?query=${encodeURIComponent(searchQuery)}&fmt=json&limit=3`,
        {
          headers: {
            'User-Agent': 'NoteClubModern/1.0 (https://noteclub.com)',
            'Accept': 'application/json'
          }
        }
      );

      if (mbResponse.ok) {
        const mbData = await mbResponse.json();

        for (const releaseGroup of mbData['release-groups'] || []) {
          // Check if this is a good match
          if (releaseGroup.title &&
              releaseGroup.title.toLowerCase().includes(albumTitle.toLowerCase()) &&
              releaseGroup['artist-credit'] &&
              releaseGroup['artist-credit'][0]?.name.toLowerCase().includes(artistName.toLowerCase())) {

            // Create a basic description from MusicBrainz data
            const artist = releaseGroup['artist-credit'][0]?.name;
            const year = releaseGroup['first-release-date']?.slice(0, 4);
            const type = releaseGroup['primary-type'];

            const description = `${releaseGroup.title} is ${year ? `a ${year} ` : ''}${type?.toLowerCase() || 'album'} by ${artist}.${
              releaseGroup.disambiguation ? ` ${releaseGroup.disambiguation}` : ''
            }`;

            if (description.length > 30) {
              console.log(`✅ Found basic info from MusicBrainz`);
              return {
                description: description,
                url: `https://musicbrainz.org/release-group/${releaseGroup.id}`,
                source: 'music-search'
              };
            }
          }
        }
      }
    } catch (mbError) {
      console.log('MusicBrainz search failed:', mbError);
    }

    // No good match found from any source
    return {
      description: null,
      url: null,
      source: 'fallback'
    };

  } catch (error) {
    console.error("Wikipedia fetch error:", error);
    return {
      description: null,
      url: null,
      source: 'fallback'
    };
  }
}
