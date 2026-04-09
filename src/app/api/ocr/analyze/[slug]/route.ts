import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { getIndex, getPage } from "@/lib/ocr-store";
import { getHanNomManifestEntryByItemId } from "@/lib/han-nom-collection";

const ANALYSES_DIR = path.join(process.cwd(), "data", "ocr");

function analysisPath(slug: string) {
  return path.join(ANALYSES_DIR, slug, "_analysis.json");
}

interface SavedAnalysis {
  analysis: string;
  title: string;
  pageCount: number;
  textLength: number;
  truncated: boolean;
  focus?: string;
  createdAt: string;
}

/**
 * GET /api/ocr/analyze/[slug]
 *
 * Returns the saved analysis if one exists.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const raw = await fs.readFile(analysisPath(params.slug), "utf-8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ analysis: null });
  }
}

/**
 * POST /api/ocr/analyze/[slug]
 *
 * Uses Gemini to analyze the full OCR text of a document.
 * Saves the result for later viewing.
 *
 * Body (optional): { focus?: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const index = await getIndex();
  const entry = index[params.slug];
  if (!entry) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  if (entry.pageCount <= 0) {
    return NextResponse.json({ error: "No OCR pages available" }, { status: 400 });
  }

  // Collect full text
  const pages: string[] = [];
  for (let i = 1; i <= entry.pageCount; i++) {
    const page = await getPage(params.slug, i);
    if (page?.rawText) pages.push(page.rawText);
  }
  const fullText = pages.join("\n\n");

  if (!fullText.trim()) {
    return NextResponse.json({ error: "Document has no text content" }, { status: 400 });
  }

  // Get metadata from han-nom collection if available
  const manifest = entry.itemId ? getHanNomManifestEntryByItemId(entry.itemId) : null;

  const body = await req.json().catch(() => ({}));
  const focus = body.focus ?? "";

  // Build metadata context
  const metadataLines: string[] = [];
  metadataLines.push(`Title: ${entry.title ?? params.slug}`);
  if (manifest) {
    if (manifest.otherTitles?.length) metadataLines.push(`Other titles: ${manifest.otherTitles.join("; ")}`);
    if (manifest.names?.length) metadataLines.push(`Named persons: ${manifest.names.join("; ")}`);
    if (manifest.languages?.length) metadataLines.push(`Languages: ${manifest.languages.join(", ")}`);
    if (manifest.formats?.length) metadataLines.push(`Formats: ${manifest.formats.join(", ")}`);
    if (manifest.yearStart) {
      metadataLines.push(`Year: ${manifest.yearStart}${manifest.yearEnd && manifest.yearEnd !== manifest.yearStart ? `–${manifest.yearEnd}` : ""}`);
    }
  }
  metadataLines.push(`Pages: ${entry.pageCount}`);
  metadataLines.push(`OCR Status: ${entry.status}`);

  const prompt = `You are a scholar of Vietnamese Hán-Nôm and classical Chinese texts. You are analyzing an OCR'd historical document.

## Document Metadata
${metadataLines.join("\n")}

## Full OCR Text (may contain OCR errors)
${fullText.substring(0, 80000)}
${fullText.length > 80000 ? "\n[Text truncated — document continues beyond this point]" : ""}

## Task
Analyze this document thoroughly and provide the following sections. Write in English but include the original characters where relevant for precision.

### 1. General Description
What is this document? What kind of text is it (religious, literary, historical, administrative, medical, etc.)? Give a clear summary of what the document is about in 2-3 paragraphs.

### 2. Content Outline
Provide a structured outline of the document's contents. List the main sections, chapters, or topics you can identify, with page numbers if discernible from the text structure.

### 3. Dating & Attributions
Based on the text content (colophons, internal references, style, etc.), what can you say about:
- When was this text likely written or copied?
- Who wrote, compiled, or commissioned it?
- Are there any named persons, reign periods, or dates mentioned?
- Does the catalog metadata match what the text itself says?

### 4. Historical Significance
Why is this document historically valuable? What does it tell us about Vietnamese culture, religion, politics, or society? How does it fit into the broader literary or intellectual tradition?

### 5. Notable Features
Any interesting aspects: unusual characters, rare vocabulary, textual variants, illustrations described, seals or stamps mentioned, damage patterns, or scribal notes visible in the OCR.

${focus ? `### 6. Specific Focus\nThe user has a specific question or area of interest: "${focus}"\nPlease address this directly.` : ""}

Be specific and cite page numbers or quote characters from the text where possible. If the OCR quality makes certain sections unreadable, note that.`;

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
      }),
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini API error ${geminiRes.status}: ${errText}`);
    }

    const geminiData = await geminiRes.json();
    const text: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!text) {
      throw new Error("Gemini returned empty response");
    }

    const resultData: SavedAnalysis = {
      analysis: text,
      title: entry.title ?? params.slug,
      pageCount: entry.pageCount,
      textLength: fullText.length,
      truncated: fullText.length > 80000,
      focus: focus || undefined,
      createdAt: new Date().toISOString(),
    };

    // Save to disk
    await fs.mkdir(path.dirname(analysisPath(params.slug)), { recursive: true });
    await fs.writeFile(analysisPath(params.slug), JSON.stringify(resultData, null, 2), "utf-8");

    return NextResponse.json(resultData);
  } catch (e: any) {
    return NextResponse.json(
      { error: `Analysis failed: ${e.message}` },
      { status: 502 }
    );
  }
}
