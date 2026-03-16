import { NextResponse } from "next/server";
import { generateStudyMaterial } from "@/lib/language-lab/generateStudyMaterial";
import { fetchArticleText } from "@/lib/language-lab/parseRssFeed";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { text, sourceUrl, url } = body;

    if (url && !text) {
      sourceUrl = url;
      try {
        text = await fetchArticleText(url);
      } catch (scrapeErr: any) {
        return NextResponse.json(
          { error: `Could not fetch article from URL: ${scrapeErr.message}` },
          { status: 422 }
        );
      }
    }

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: "Please provide at least 50 characters of Vietnamese text." },
        { status: 400 }
      );
    }

    const studyMaterial = await generateStudyMaterial({
      text: text.slice(0, 12000),
      sourceUrl: sourceUrl ?? null,
    });

    return NextResponse.json(studyMaterial);
  } catch (err: any) {
    console.error("[language-lab/generate]", err);
    return NextResponse.json(
      { error: err.message ?? "Unexpected error generating study material." },
      { status: 500 }
    );
  }
}
