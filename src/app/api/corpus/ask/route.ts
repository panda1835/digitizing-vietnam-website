// src/app/api/corpus/ask/route.ts
//
// One-shot ask: retrieve and answer in a single call.
//
// Kept for scripting, evaluation and any client that would rather make one
// request. The UI uses the split /retrieve + /answer pair instead, which shows
// the evidence first and leaves more headroom under Netlify's ~10s function
// limit. All the guards (cache, relevance gate, daily cap, citation
// verification) live in generateAnswer, so both paths behave identically.

import { NextRequest, NextResponse } from "next/server";

import { generateAnswer, resolveModel } from "@/lib/corpus/answer";
import { retrieveForAnswer } from "@/lib/corpus/retrieval";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const question = (body?.question ?? "").toString().trim();
  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }
  if (question.length > 500) {
    return NextResponse.json({ error: "Question is too long (500 characters max)" }, { status: 400 });
  }

  const language = body?.language === "vi" ? "vi" : "en";
  const slug = body?.slug ? String(body.slug) : undefined;
  const model = resolveModel(body?.model);
  const startedAt = Date.now();

  try {
    const { passages, topScore } = await retrieveForAnswer(question, { slug, k: 10, apiKey });
    const result = await generateAnswer({
      question,
      language,
      slug,
      model,
      apiKey,
      passages,
      topScore,
      startedAt,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "The assistant could not answer", detail: error?.detail },
      { status: error?.status ?? 500 }
    );
  }
}
