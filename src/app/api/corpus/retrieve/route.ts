// src/app/api/corpus/retrieve/route.ts
//
// First half of the split ask flow: find the evidence, fast, and hand back a
// session the answer step can pick up.
//
// Two reasons this is separate from generation. Netlify functions cap at ~10s
// and generation alone runs 4-7s, so keeping them in one call leaves no
// headroom under load. And for a tool whose whole claim is "check my work",
// showing the sources before the prose is the honest ordering, not a
// workaround — the reader sees what the answer will be built from.
//
// Retrieval is effectively free (~$0.000003 per query), so this endpoint needs
// no budget guard of its own.

import { NextRequest, NextResponse } from "next/server";

import { resolveModel } from "@/lib/corpus/answer";
import { GATE_THRESHOLD, budgetState, createSession } from "@/lib/corpus/ask-state";
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
  const started = Date.now();

  const { passages, topScore } = await retrieveForAnswer(question, { slug, k: 10, apiKey });

  const relevant = passages.length > 0 && topScore >= GATE_THRESHOLD;
  const sessionId = createSession({ question, language, slug, passages, topScore });

  return NextResponse.json({
    sessionId,
    question,
    language,
    model,
    // Passage text is included so the evidence panel can render immediately.
    passages,
    topScore: Number(topScore.toFixed(4)),
    // Tells the client whether calling /answer is worth it at all.
    relevant,
    gateThreshold: GATE_THRESHOLD,
    budget: budgetState(),
    latencyMs: Date.now() - started,
  });
}
