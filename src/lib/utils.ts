import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Fetches Wikipedia description for an album
 */
export async function fetchWikipediaDescription(albumTitle: string, artistName: string): Promise<{
  description: string | null;
  url: string | null;
  source: 'wikipedia' | 'fallback';
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
      } catch (e) {
        continue;
      }
    }

    // No good match found
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
