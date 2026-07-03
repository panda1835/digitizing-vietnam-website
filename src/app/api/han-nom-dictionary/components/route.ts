import { NextResponse } from "next/server";
import {
  findCharsByComponents,
  isCJKChar,
} from "@/lib/han-nom/componentsIndex";

const MAX_SUGGESTIONS = 20;

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  const queryCharacters = Array.from(query);

  if (
    queryCharacters.length < 2 ||
    !queryCharacters.every((char) => isCJKChar(char))
  ) {
    return NextResponse.json({ matches: [] });
  }

  return NextResponse.json(
    {
      matches: findCharsByComponents(query).slice(0, MAX_SUGGESTIONS),
    },
    {
      headers: {
        "Cache-Control": "public, max-age=86400",
        "CDN-Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
        "Vercel-CDN-Cache-Control":
          "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
