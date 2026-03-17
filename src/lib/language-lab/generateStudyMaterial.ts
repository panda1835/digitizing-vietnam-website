/**
 * generateStudyMaterial.js
 * Calls the Gemini API to transform Vietnamese text into structured study material,
 * then builds annotatedHtml server-side from the returned vocabulary list.
 */

import { buildAnnotatedHtml } from "./buildAnnotatedHtml";

const SYSTEM_PROMPT = `You are an expert Vietnamese language pedagogy assistant.
You will receive Vietnamese text (from a news article, essay, or other source) and produce structured study material for learners.

Always respond with ONLY valid JSON — no preamble, no markdown fences.

The JSON must match this exact shape:
{
  "title": "string — inferred title of the source text",
  "sourceUrl": "string or null",
  "difficulty": "beginner | intermediate | advanced",
  "summary": "string — 2-3 sentence summary in English",
  "vocabulary": [
    {
      "id": "string — unique slug, e.g. 'nguoi-dan'",
      "word": "string — Vietnamese word or phrase exactly as it appears in the text",
      "pronunciation": "string — tone-marked pronunciation if different from spelling",
      "partOfSpeech": "string — noun | verb | adjective | adverb | conjunction | particle | classifier | other",
      "definition": "string — clear English definition",
      "exampleSentence": "string — example sentence in Vietnamese",
      "exampleTranslation": "string — English translation of example"
    }
  ],
  "grammarPoints": [
    {
      "id": "string",
      "pattern": "string — the grammatical construction, e.g. 'mặc dù... nhưng...'",
      "explanation": "string — clear English explanation",
      "exampleFromText": "string — direct quote from the article showing this pattern",
      "additionalExample": "string — another example sentence"
    }
  ],
  "culturalNotes": [
    {
      "id": "string",
      "term": "string — the word, name, or concept",
      "note": "string — cultural/contextual explanation in English"
    }
  ],
  "comprehensionQuestions": [
    {
      "id": "string",
      "question": "string — question in Vietnamese",
      "questionTranslation": "string — English translation",
      "type": "multiple-choice | short-answer",
      "options": ["string"] ,
      "answer": "string"
    }
  ]
}

Guidelines:
- Select 10-20 vocabulary items appropriate to the difficulty level
- Vocabulary selection — INCLUDE: multi-syllable words or compounds that a learner at this level would find challenging; domain-specific or formal register terms; words that appear more than once in the text; useful particles, conjunctions, or adverbs that carry grammatical meaning
- Vocabulary selection — EXCLUDE: proper nouns (people's names, place names, organisation names, brand names); numbers and dates; abbreviations/acronyms; single common particles or pronouns a learner at this level already knows (e.g. "là", "và", "của" for intermediate/advanced); words whose meaning is transparent from their component characters and require no explanation
- Each vocabulary "word" field must be the exact string as it appears in the source text (same capitalisation, same diacritics)
- Identify 3-5 key grammar patterns actually present in the text
- Include 1-3 cultural notes for proper nouns, idioms, or implied cultural knowledge
- Write 3-5 comprehension questions
- For difficulty: beginner = common words, simple sentences; intermediate = news-level vocab, compound sentences; advanced = formal register, complex syntax, specialized vocabulary`;


export async function generateStudyMaterial({ text, sourceUrl = null }) {
  const userMessage = sourceUrl
    ? `Source URL: ${sourceUrl}\n\nVietnamese text:\n\n${text}`
    : `Vietnamese text:\n\n${text}`;

  const model = "gemini-2.0-flash";
  const apiKey = process.env.GEMINI_API_KEY ?? "";
  console.log("[language-lab] GEMINI_API_KEY in use:", apiKey.slice(0, 12) + "...");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: { maxOutputTokens: 8192, temperature: 0.2 },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  // Strip accidental markdown fences if present
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e: any) {
    throw new Error(
      `Failed to parse Gemini response as JSON: ${e.message}\n\nRaw: ${raw.slice(0, 500)}`
    );
  }

  // Build annotated HTML from the original text + returned vocab
  parsed.annotatedHtml = buildAnnotatedHtml(text, parsed.vocabulary ?? []);

  return parsed;
}
