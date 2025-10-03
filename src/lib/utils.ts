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
    // First, try Wikipedia search API to find the best matching article
    try {
      const searchResponse = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(`${albumTitle} ${artistName} album`)}&format=json&origin=*&srlimit=5`,
        {
          headers: {
            'User-Agent': 'NoteClubModern/1.0 (https://noteclub.com)',
            'Accept': 'application/json'
          }
        }
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        const searchResults = searchData.query?.search || [];

        // Try each search result
        for (const result of searchResults) {
          const pageTitle = result.title;

          try {
            const summaryResponse = await fetch(
              `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`,
              {
                headers: {
                  'User-Agent': 'NoteClubModern/1.0 (https://noteclub.com)',
                  'Accept': 'application/json'
                }
              }
            );

            if (summaryResponse.ok) {
              const wikiData = await summaryResponse.json();

              // Check if this is a good result
              if (wikiData.extract &&
                  wikiData.extract.length > 100 &&
                  !wikiData.extract.includes('may refer to') &&
                  !wikiData.extract.includes('is a disambiguation page') &&
                  wikiData.type === 'standard') {

                const extract = wikiData.extract.toLowerCase();
                const albumLower = albumTitle.toLowerCase();
                const artistLower = artistName.toLowerCase();

                // Check if it's actually about the album
                if (extract.includes('album') &&
                    (extract.includes(artistLower) || extract.includes(albumLower))) {
                  console.log(`✅ Found Wikipedia article: ${pageTitle}`);
                  return {
                    description: wikiData.extract,
                    url: wikiData.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`,
                    source: 'wikipedia'
                  };
                }
              }
            }
          } catch {
            continue;
          }
        }
      }
    } catch (searchError) {
      console.log('Wikipedia search API failed:', searchError);
    }

    // Fallback: Try direct URL patterns
    const searchTerms = [
      `${albumTitle}_(album)`,
      `${albumTitle}_album`,
      `${albumTitle}_(${artistName}_album)`,
      `${albumTitle}`,
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

          if (wikiData.extract &&
              wikiData.extract.length > 100 &&
              !wikiData.extract.includes('may refer to') &&
              wikiData.type === 'standard') {

            const extract = wikiData.extract.toLowerCase();
            if (extract.includes('album')) {
              console.log(`✅ Found Wikipedia via direct URL: ${searchTerm}`);
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
