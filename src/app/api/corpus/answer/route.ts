// src/app/api/corpus/answer/route.ts
//
// Second half of the split ask flow. Takes a session created by
// /api/corpus/retrieve and produces the grounded, citation-verified answer.
//
// The cache, the relevance gate and the daily spend cap all live in
// generateAnswer, so they apply here and to the one-shot /api/corpus/ask alike.

import { NextRequest, NextResponse } from "next/server";

import { generateAnswer, resolveModel } from "@/lib/corpus/answer";
import { getSession } from "@/lib/corpus/ask-state";
import type { RetrievedPassage } from "@/lib/corpus/retrieval";

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

  const sessionId = body?.sessionId ? String(body.sessionId) : null;
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
  }

  const session = getSession(sessionId);
  if (!session) {
    // Sessions are short-lived; the client should just retrieve again.
    return NextResponse.json(
      { error: "This search has expired — please ask again.", expired: true },
      { status: 410 }
    );
  }

  try {
    const result = await generateAnswer({
      question: session.question,
      language: session.language as "en" | "vi",
      slug: session.slug,
      model: resolveModel(body?.model),
      apiKey,
      passages: session.passages as RetrievedPassage[],
      topScore: session.topScore,
    });
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? "The assistant could not answer", detail: error?.detail },
      { status: error?.status ?? 500 }
    );
  }
}
