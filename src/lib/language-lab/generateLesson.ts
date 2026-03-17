/**
 * generateLesson.ts
 * Calls the Gemini API to generate a structured beginner Vietnamese lesson
 * from a topic description, then builds annotatedHtml server-side.
 */

import { buildAnnotatedHtml } from "./buildAnnotatedHtml";

const LESSON_SYSTEM_PROMPT = `You are a Vietnamese language pedagogy expert creating structured beginner lessons for English-speaking learners of Vietnamese.

Given a lesson topic, you will:
1. Write a short, natural Vietnamese dialogue or narrative (150–200 words) appropriate for absolute beginners. Use simple, common vocabulary and short sentences.
2. Select 10–14 key vocabulary items that appear in the text.
3. Identify 2–3 grammar patterns demonstrated in the text.
4. Include 1–2 cultural notes relevant to the topic.
5. Write 3–4 comprehension questions.

Always respond with ONLY valid JSON — no preamble, no markdown fences.

The JSON must match this exact shape:
{
  "title": "string — e.g. 'Lesson 1: Greetings & Introductions'",
  "titleVi": "string — Vietnamese title, e.g. 'Chào Hỏi và Giới Thiệu'",
  "difficulty": "beginner",
  "summary": "string — 2–3 sentence English description of what the learner will practice",
  "text": "string — the full Vietnamese dialogue or narrative as plain text, with newlines between paragraphs or speaker turns",
  "vocabulary": [
    {
      "id": "string — unique kebab-case slug, e.g. 'xin-chao'",
      "word": "string — Vietnamese word or phrase EXACTLY as it appears in the text",
      "pronunciation": "string — IPA or simplified pronunciation guide",
      "partOfSpeech": "noun | verb | adjective | adverb | conjunction | particle | classifier | other",
      "definition": "string — clear English definition",
      "exampleSentence": "string — the sentence from the text where this word appears",
      "exampleTranslation": "string — English translation of that sentence"
    }
  ],
  "grammarPoints": [
    {
      "id": "string",
      "pattern": "string — the grammatical construction, e.g. 'Subject + là + Noun'",
      "explanation": "string — clear English explanation for beginners",
      "exampleFromText": "string — direct quote from the lesson text showing this pattern",
      "additionalExample": "string — one more example sentence"
    }
  ],
  "culturalNotes": [
    {
      "id": "string",
      "term": "string — the word, phrase, or concept",
      "note": "string — cultural/contextual explanation in English"
    }
  ],
  "comprehensionQuestions": [
    {
      "id": "string",
      "question": "string — question in Vietnamese",
      "questionTranslation": "string — English translation",
      "type": "multiple-choice | short-answer",
      "options": ["string"],
      "answer": "string"
    }
  ]
}

Guidelines:
- The text must be genuinely beginner-level: short sentences, present tense, minimal particles, common vocabulary only
- Vocabulary words must be the EXACT string as written in the text (same capitalisation, same diacritics)
- For dialogues, use speaker labels like "A:" and "B:" on separate lines
- Comprehension questions should be answerable from the text alone
- Cultural notes should give useful real-world context (e.g. how Vietnamese greetings reflect social hierarchy)`;

export interface LessonTopic {
  lessonNumber: number;
  id: string;          // slug, e.g. "01-chao-hoi"
  topicEn: string;     // e.g. "Greetings & Introductions"
  topicVi: string;     // e.g. "Chào Hỏi và Giới Thiệu"
  prompt: string;      // short description for Gemini
}

export async function generateLesson(topic: LessonTopic) {
  const model = "gemini-2.0-flash";
  const apiKey = process.env.GEMINI_API_KEY ?? "";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const userMessage = `Generate Lesson ${topic.lessonNumber}: ${topic.topicEn} (${topic.topicVi}).

Topic description: ${topic.prompt}

The lesson ID will be "${topic.id}". Make sure all vocabulary IDs are unique slugs prefixed with "${topic.id}-", e.g. "${topic.id}-xin-chao".`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: LESSON_SYSTEM_PROMPT }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: { maxOutputTokens: 4096, temperature: 0.3 },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e: any) {
    throw new Error(
      `Failed to parse Gemini response as JSON: ${e.message}\n\nRaw: ${raw.slice(0, 500)}`
    );
  }

  // Build annotated HTML server-side
  parsed.annotatedHtml = buildAnnotatedHtml(parsed.text ?? "", parsed.vocabulary ?? []);

  return {
    id: topic.id,
    lessonNumber: topic.lessonNumber,
    level: "beginner" as const,
    studyMaterial: parsed,
  };
}
