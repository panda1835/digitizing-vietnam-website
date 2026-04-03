import { NextRequest, NextResponse } from "next/server";
import { getPage } from "@/lib/ocr-store";

/**
 * POST /api/ocr/suggest
 * Body: { slug, page, offset }
 *
 * Looks up the character at `offset` in the spatial data for the given page,
 * then asks Gemini to suggest 5 visually similar alternatives for historical
 * Chinese/Han-Nom documents.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { slug, page: pageNum, offset } = body;
  if (!slug || pageNum == null || offset == null) {
    return NextResponse.json({ error: "Missing slug, page, or offset" }, { status: 400 });
  }

  const pageData = await getPage(slug, parseInt(pageNum, 10));
  if (!pageData) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const char = pageData.spatialData.find((c) => c.offset === offset);
  if (!char || !char.text.trim()) {
    return NextResponse.json({ error: "Character not found at offset" }, { status: 404 });
  }

  const prompt = `You are an expert in Vietnamese Hán-Nôm and Classical Chinese manuscript OCR correction.

The OCR system has recognized the character "${char.text}" in a historical Vietnamese manuscript.
This may be a misrecognition due to the aged document and handwriting.

Please suggest the 5 most likely correct characters that could have been misread as "${char.text}".
Consider visually similar characters used in Hán-Nôm manuscripts.

Respond with ONLY a comma-separated list of 5 characters, no explanations, no punctuation other than commas.
Example response format: 其,真,且,直,見`;

  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  let geminiRes: Response;
  try {
    geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 50 },
      }),
    });
  } catch {
    return NextResponse.json({ error: "Failed to reach Gemini API" }, { status: 502 });
  }

  if (!geminiRes.ok) {
    return NextResponse.json(
      { error: `Gemini API error: ${geminiRes.status}` },
      { status: 502 }
    );
  }

  const geminiData = await geminiRes.json();
  const text: string =
    geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  const suggestions = text
    .split(",")
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0 && s !== char.text)
    .slice(0, 5);

  return NextResponse.json({ suggestions, originalChar: char.text });
}
