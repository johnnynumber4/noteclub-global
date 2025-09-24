import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const albumTitle = searchParams.get("album");
    const artistName = searchParams.get("artist");

    if (!albumTitle || !artistName) {
      return NextResponse.json(
        { error: "Both album and artist parameters are required" },
        { status: 400 }
      );
    }

    console.log(`Searching Wikipedia for: ${albumTitle} by ${artistName}`);

    // Try multiple Wikipedia search strategies to find the best match
    const searchTerms = [
      `${albumTitle}_album`,
      `${albumTitle}_(album)`,
      `${albumTitle}_(${artistName}_album)`,
      `${albumTitle}_${artistName}_album`,
      `${albumTitle}`,
      `${albumTitle}_by_${artistName}`,
      `${albumTitle}_(${artistName})`,
    ];

    let bestResult = null;

    for (const searchTerm of searchTerms) {
      try {
        console.log(`Trying search term: ${searchTerm}`);

        const wikiResponse = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
            searchTerm
          )}`,
          {
            headers: {
              "User-Agent": "NoteClubModern/1.0 (https://noteclub.com)",
              Accept: "application/json",
            },
          }
        );

        if (wikiResponse.ok) {
          const wikiData = await wikiResponse.json();

          // Check if this is a good result
          if (
            wikiData.extract &&
            wikiData.extract.length > 50 &&
            !wikiData.extract.includes("may refer to") &&
            !wikiData.extract.includes("is a disambiguation page") &&
            wikiData.type === "standard"
          ) {
            // Score the result based on relevance
            const extract = wikiData.extract.toLowerCase();
            const albumLower = albumTitle.toLowerCase();
            const artistLower = artistName.toLowerCase();

            let score = 0;
            if (extract.includes(albumLower)) score += 3;
            if (extract.includes(artistLower)) score += 2;
            if (extract.includes("album")) score += 1;
            if (extract.includes("studio album")) score += 2;
            if (extract.includes("debut album")) score += 2;

            // Prefer results that mention both album and artist
            if (
              score >= 4 ||
              (score >= 2 &&
                extract.includes(albumLower) &&
                extract.includes(artistLower))
            ) {
              bestResult = {
                description: wikiData.extract,
                url:
                  wikiData.content_urls?.desktop?.page ||
                  `https://en.wikipedia.org/wiki/${encodeURIComponent(
                    searchTerm
                  )}`,
                title: wikiData.title,
                score: score,
              };

              // If we found a very good match, stop searching
              if (score >= 5) {
                console.log(
                  `Found excellent match with score ${score}: ${wikiData.title}`
                );
                break;
              }
            }
          }
        }
      } catch (e) {
        console.log(`Failed to fetch for term: ${searchTerm}`, e);
        continue;
      }
    }

    if (bestResult) {
      console.log(
        `Found Wikipedia description: ${bestResult.title} (score: ${bestResult.score})`
      );
      return NextResponse.json({
        description: bestResult.description,
        url: bestResult.url,
        title: bestResult.title,
        source: "wikipedia",
      });
    }

    // If no Wikipedia result found, return a fallback
    console.log("No Wikipedia results found, returning fallback");
    return NextResponse.json({
      description: `"${albumTitle}" is an album by ${artistName}.`,
      url: null,
      title: null,
      source: "fallback",
    });
  } catch (error) {
    console.error("Wikipedia search error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Wikipedia data" },
      { status: 500 }
    );
  }
}
