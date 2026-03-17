import { NextResponse } from "next/server";

const LOOKUP_PROMPT = `You are a Vietnamese linguistics expert. Given a Vietnamese word or short phrase, return a JSON object with these fields:

{
  "word": "the input word, normalised",
  "ipaHanoi": "IPA transcription in standard Northern Vietnamese (Hanoi) pronunciation",
  "ipaSaigon": "IPA transcription in Southern Vietnamese (Ho Chi Minh City / Saigon) pronunciation — note key differences such as merged tones (hỏi/ngã), different consonant initials (d/gi/v), and final consonant mergers",
  "partOfSpeech": "noun | verb | adjective | adverb | particle | classifier | conjunction | phrase | other",
  "definition": "clear, concise English definition (1–2 sentences)",
  "toneInfo": "name and description of the tone(s) used, e.g. 'sắc — high rising' — omit if it's a phrase with multiple tones",
  "example": "a short natural Vietnamese example sentence using the word",
  "exampleTranslation": "English translation of the example"
}

Rules:
- If the input is not Vietnamese, set definition to "Not a Vietnamese word." and leave other fields as empty strings.
- If it is a multi-word phrase, skip toneInfo.
- For ipaSaigon, if the pronunciation is identical to Hanoi, return an empty string.
- Always respond with ONLY valid JSON — no preamble, no markdown fences.`;

// Simple in-process cache so repeated lookups of the same word don't hit the API
const cache = new Map<string, any>();

export async function POST(request: Request) {
  const { word } = await request.json();

  if (!word || typeof word !== "string" || word.trim().length === 0) {
    return NextResponse.json({ error: "Missing word" }, { status: 400 });
  }

  const key = word.trim().toLowerCase();

  if (cache.has(key)) {
    return NextResponse.json(cache.get(key));
  }

  const apiKey = process.env.GEMINI_API_KEY ?? "";
  const model = "gemini-2.0-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: LOOKUP_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: `Look up: "${word.trim()}"` }] }],
      generationConfig: { maxOutputTokens: 512, temperature: 0.1 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: `Gemini error: ${res.status}` }, { status: 502 });
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

  try {
    const result = JSON.parse(cleaned);
    cache.set(key, result);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Failed to parse response" }, { status: 500 });
  }
}
