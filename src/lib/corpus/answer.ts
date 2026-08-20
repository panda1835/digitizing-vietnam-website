// src/lib/corpus/answer.ts
//
// The grounded answering pipeline, shared by /api/corpus/ask (one shot) and
// /api/corpus/answer (second half of the split flow).
//
// Order matters, and it is cheapest-first:
//
//   1. cache      an identical question costs nothing
//   2. gate       if retrieval found nothing relevant, refuse WITHOUT calling
//                 the model — checking costs $0.000003, generating ~$0.005
//   3. cap        if today's spend is used up, degrade to search-only rather
//                 than fail or overspend
//   4. generate   only now does the expensive call happen
//   5. verify     every quote must re-locate in the page it cites, or the
//                 citation is dropped and the answer assembled without it
//
// Steps 1-3 are what make this safe to expose publicly; step 5 is what makes
// the output trustworthy.

import { getPage } from "./local-store.ts";
import { verifyQuote } from "./locate-span.ts";
import type { RetrievedPassage } from "./retrieval.ts";
import {
  GATE_THRESHOLD,
  budgetExhausted,
  budgetState,
  cacheGet,
  cacheKey,
  cacheSet,
  estimateCostUsd,
  recordCacheHit,
  recordGated,
  recordSpend,
} from "./ask-state.ts";

export const DEFAULT_MODEL = process.env.CORPUS_CHAT_MODEL || "gemini-3.7-flash";

// Callers may pick a model, but only from this list — otherwise a public
// request could force the most expensive tier and run up the bill.
export const ALLOWED_MODELS = new Set([
  "gemini-3.5-flash-lite",
  "gemini-flash-lite-latest",
  "gemini-2.5-flash",
  "gemini-3.5-flash",
  "gemini-3.7-flash",
  "gemini-flash-latest",
]);

export function resolveModel(requested?: string | null) {
  return requested && ALLOWED_MODELS.has(requested) ? requested : DEFAULT_MODEL;
}

const RESPONSE_SCHEMA = {
  type: "object",
  required: ["status", "claims"],
  properties: {
    status: { type: "string", enum: ["answered", "insufficient_evidence"] },
    claims: {
      type: "array",
      items: {
        type: "object",
        required: ["text", "citations"],
        properties: {
          text: { type: "string" },
          citations: {
            type: "array",
            minItems: 1,
            items: {
              type: "object",
              required: ["ref", "quote"],
              properties: { ref: { type: "string" }, quote: { type: "string" } },
            },
          },
        },
      },
    },
    caveats: { type: "array", items: { type: "string" } },
    unsupported_note: { type: "string" },
  },
};

function systemPrompt(language: string) {
  return `You answer questions about a corpus of Vietnamese scholarship on Hán-Nôm studies.

RULES, in order of importance:
1. Use ONLY the numbered passages provided. Never use outside knowledge, and never
   infer beyond what a passage actually says.
2. Every claim must carry at least one citation, giving the passage ref (e.g. "C3")
   and a quote copied VERBATIM from that passage.
3. The passages are machine-transcribed from scanned books and contain OCR errors.
   Copy quotes exactly as given, INCLUDING their errors. Do not correct, normalise
   or modernise spelling. If a passage looks garbled, say so rather than guessing
   what it was meant to say.
4. Keep quotes short — a clause or a sentence, under 200 characters.
5. Answer whatever the passages DO support, even if they only cover part of the
   question, and note the gaps in caveats. A partial, well-cited answer is more
   useful than a refusal.
   Use "insufficient_evidence" ONLY when the passages are genuinely about a
   different subject and support no part of the question. That is then a correct
   answer, not a failure — but do not reach for it merely because the passages
   are incomplete.
6. Write in ${language === "vi" ? "Vietnamese" : "English"}.`;
}

export interface AnswerResult {
  status: "answered" | "insufficient_evidence";
  claims: { text: string; citations: string[] }[];
  citations: any[];
  caveats: string[];
  unsupportedNote: string | null;
  passages: Omit<RetrievedPassage, "text">[];
  verification: {
    claimsProposed: number;
    claimsKept: number;
    citationsDropped: number;
  };
  model: string;
  usage: { inputTokens: number | null; outputTokens: number | null };
  /** How this response was produced — surfaced so the UI can be honest. */
  served: "model" | "cache" | "gated" | "budget-exhausted";
  costUsd: number;
  latencyMs: number;
  budget: ReturnType<typeof budgetState>;
}

function emptyResult(
  served: AnswerResult["served"],
  note: string,
  model: string,
  passages: RetrievedPassage[],
  startedAt: number
): AnswerResult {
  return {
    status: "insufficient_evidence",
    claims: [],
    citations: [],
    caveats: [],
    unsupportedNote: note,
    passages: passages.map(({ text, ...rest }) => rest),
    verification: { claimsProposed: 0, claimsKept: 0, citationsDropped: 0 },
    model,
    usage: { inputTokens: null, outputTokens: null },
    served,
    costUsd: 0,
    latencyMs: Date.now() - startedAt,
    budget: budgetState(),
  };
}

export async function generateAnswer(input: {
  question: string;
  language: "en" | "vi";
  slug?: string;
  model: string;
  apiKey: string;
  passages: RetrievedPassage[];
  topScore: number;
  startedAt?: number;
}): Promise<AnswerResult> {
  const { question, language, slug, model, apiKey, passages, topScore } = input;
  const startedAt = input.startedAt ?? Date.now();

  // ---- 1. cache -----------------------------------------------------------
  const key = cacheKey({ question, language, model, slug });
  const cached = cacheGet(key) as AnswerResult | null;
  if (cached) {
    recordCacheHit();
    return { ...cached, served: "cache", costUsd: 0, latencyMs: Date.now() - startedAt };
  }

  // ---- 2. relevance gate --------------------------------------------------
  if (passages.length === 0 || topScore < GATE_THRESHOLD) {
    recordGated();
    return emptyResult(
      "gated",
      language === "vi"
        ? "Không tìm thấy đoạn nào trong kho tài liệu liên quan đến câu hỏi này."
        : "Nothing in the corpus is relevant to this question.",
      model,
      passages,
      startedAt
    );
  }

  // ---- 3. daily cap -------------------------------------------------------
  if (budgetExhausted()) {
    return emptyResult(
      "budget-exhausted",
      language === "vi"
        ? "Đã đạt giới hạn chi phí AI trong ngày. Tìm kiếm vẫn hoạt động bình thường; câu trả lời AI sẽ trở lại vào ngày mai."
        : "Today's AI budget has been used up. Search still works normally, and AI answers resume tomorrow.",
      model,
      passages,
      startedAt
    );
  }

  // ---- 4. generate --------------------------------------------------------
  const context = passages
    .map((p) => `[${p.ref}] ${p.title}, page ${p.pageLabel ?? p.pageNumber}\n${p.text}`)
    .join("\n\n---\n\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt(language) }] },
        contents: [
          { role: "user", parts: [{ text: `PASSAGES:\n\n${context}\n\nQUESTION: ${question}` }] },
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    }
  );

  if (!response.ok) {
    throw Object.assign(new Error(`Model call failed (${response.status})`), {
      status: 502,
      detail: (await response.text()).slice(0, 300),
    });
  }

  const json = await response.json();
  const usageMeta = json?.usageMetadata ?? {};
  const usage = {
    inputTokens: usageMeta.promptTokenCount ?? null,
    outputTokens: usageMeta.candidatesTokenCount ?? null,
  };

  const costUsd = estimateCostUsd(model, usage.inputTokens ?? 0, usage.outputTokens ?? 0);
  recordSpend(costUsd);

  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw Object.assign(new Error("Model returned no content"), { status: 502 });

  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw Object.assign(new Error("Model returned malformed JSON"), { status: 502 });
  }

  // ---- 5. verify every quote ---------------------------------------------
  const byRef = new Map(passages.map((p) => [p.ref, p]));
  const citations: any[] = [];
  const keptClaims: AnswerResult["claims"] = [];
  let droppedCitations = 0;

  for (const claim of parsed.claims ?? []) {
    const verified: any[] = [];

    for (const citation of claim.citations ?? []) {
      const passage = byRef.get(citation.ref);
      const page = passage ? getPage(passage.slug, passage.pageNumber) : null;
      if (!passage || !page) {
        droppedCitations++;
        continue;
      }

      const located = verifyQuote(page.text, citation.quote, 0);
      if (!located) {
        droppedCitations++;
        continue;
      }

      const record = {
        id: `${passage.slug}:${passage.pageNumber}:${located.start}`,
        ref: citation.ref,
        slug: passage.slug,
        title: passage.title,
        pageNumber: passage.pageNumber,
        pageLabel: passage.pageLabel,
        confidence: passage.confidence,
        quote: citation.quote,
        start: located.start,
        end: located.end,
        spanMatch: located.match,
        spanSimilarity: Number(located.similarity.toFixed(3)),
        href:
          `/research/han-nom/corpus/${passage.slug}` +
          `?page=${passage.pageNumber}&s=${located.start}&e=${located.end}` +
          `&q=${encodeURIComponent(citation.quote.slice(0, 120))}`,
      };
      verified.push(record);
      citations.push(record);
    }

    if (verified.length > 0) {
      keptClaims.push({ text: claim.text, citations: verified.map((v) => v.id) });
    }
  }

  const claimsProposed = (parsed.claims ?? []).length;
  const dropRate = claimsProposed === 0 ? 1 : 1 - keptClaims.length / claimsProposed;
  const status =
    parsed.status === "insufficient_evidence" || keptClaims.length === 0 || dropRate > 0.3
      ? "insufficient_evidence"
      : "answered";

  const result: AnswerResult = {
    status,
    claims: keptClaims,
    citations,
    caveats: parsed.caveats ?? [],
    unsupportedNote:
      status === "insufficient_evidence"
        ? parsed.unsupported_note ||
          "The retrieved passages did not support a citable answer to this question."
        : parsed.unsupported_note || null,
    passages: passages.map(({ text, ...rest }) => rest),
    verification: {
      claimsProposed,
      claimsKept: keptClaims.length,
      citationsDropped: droppedCitations,
    },
    model,
    usage,
    served: "model",
    costUsd,
    latencyMs: Date.now() - startedAt,
    budget: budgetState(),
  };

  // Only cache real answers — a refusal may be fixed by future ingestion.
  if (status === "answered") cacheSet(key, result);

  return result;
}
