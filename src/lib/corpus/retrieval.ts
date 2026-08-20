// src/lib/corpus/retrieval.ts
//
// Search over the corpus, in four modes, plus the retrieval step the AI chat
// builds its answers from.
//
//   exact     literal substring, diacritics and case respected
//   keyword   substring over folded text, so "chu nom" finds "chữ Nôm"
//   semantic  cosine over Gemini embeddings — finds passages that say the same
//             thing in different words, and across languages
//   hybrid    reciprocal-rank fusion of keyword + semantic (the default)
//
// WHY RRF RATHER THAN BLENDING SCORES
// -----------------------------------
// Cosine similarity and substring-hit counts live on scales that cannot be
// meaningfully added, and OCR noise systematically depresses lexical scores on
// exactly the pages worth surfacing. Fusing by RANK is immune to both problems;
// normalising and adding raw scores amplifies them.
//
// Vectors are held in memory and scanned linearly. At 2,385 chunks × 768 dims
// that is ~2 ms — an index would be premature. The interface is the same one
// pgvector will serve later, so only this file changes.

import fs from "node:fs";
import path from "node:path";

import { fold } from "./fold.ts";
import { getPage, getSource, listSlugs, searchCorpus, type SearchHit } from "./local-store.ts";

const INDEX_ROOT = path.join(process.cwd(), "data", "corpus", "index");

export type SearchMode = "exact" | "keyword" | "semantic" | "hybrid";

export interface ChunkRef {
  id: string;
  slug: string;
  pageNumber: number;
  ordinal: number;
  charStart: number;
  charEnd: number;
  confidence: number | null;
}

interface VectorIndex {
  slug: string;
  title: string;
  dims: number;
  model: string | null;
  chunks: ChunkRef[];
  vectors: Float32Array | null;
}

const indexes = new Map<string, VectorIndex | null>();

function loadIndex(slug: string): VectorIndex | null {
  if (indexes.has(slug)) return indexes.get(slug) ?? null;

  const metaPath = path.join(INDEX_ROOT, `${slug}.chunks.json`);
  if (!fs.existsSync(metaPath)) {
    indexes.set(slug, null);
    return null;
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  const vectorPath = path.join(INDEX_ROOT, `${slug}.vectors.bin`);
  let vectors: Float32Array | null = null;

  if (fs.existsSync(vectorPath)) {
    const buffer = fs.readFileSync(vectorPath);
    vectors = new Float32Array(
      buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    );
  }

  const index: VectorIndex = {
    slug,
    title: meta.title ?? slug,
    dims: meta.dims ?? 768,
    model: meta.model ?? null,
    chunks: (meta.chunks ?? []).map((chunk: any) => ({ ...chunk, slug })),
    vectors,
  };

  indexes.set(slug, index);
  return index;
}

export function embeddingModel(): string | null {
  for (const slug of listSlugs()) {
    const index = loadIndex(slug);
    if (index?.model) return index.model;
  }
  return null;
}

/** Text of a chunk, sliced back out of the page it belongs to. */
export function chunkText(chunk: ChunkRef): string {
  const page = getPage(chunk.slug, chunk.pageNumber);
  if (!page) return "";
  return page.text.slice(chunk.charStart, chunk.charEnd);
}

async function embedQuery(query: string, apiKey: string, model: string, dims: number) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: `models/${model}`,
        content: { parts: [{ text: query }] },
        taskType: "RETRIEVAL_QUERY",
        outputDimensionality: dims,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Query embedding failed (${response.status})`);
  }
  const json = await response.json();
  return json.embedding.values as number[];
}

export interface SemanticHit {
  chunk: ChunkRef;
  score: number;
}

/**
 * Cosine similarity across every chunk. Vectors from gemini-embedding-2 arrive
 * L2-normalised, so a dot product is already the cosine — no division needed.
 * (gemini-embedding-001 does NOT normalise at reduced dimensions; if the index
 * is ever rebuilt with it, normalise at write time.)
 */
export async function semanticSearch(
  query: string,
  options: { slug?: string; limit?: number; apiKey: string }
): Promise<SemanticHit[]> {
  const { slug, limit = 40, apiKey } = options;
  const slugs = slug ? [slug] : listSlugs();

  const first = slugs.map(loadIndex).find((index) => index?.vectors);
  if (!first) return [];

  const queryVector = await embedQuery(query, apiKey, first.model ?? "gemini-embedding-2", first.dims);
  const hits: SemanticHit[] = [];

  for (const candidate of slugs) {
    const index = loadIndex(candidate);
    if (!index?.vectors) continue;
    const { dims, vectors, chunks } = index;

    for (let i = 0; i < chunks.length; i++) {
      const offset = i * dims;
      let dot = 0;
      for (let d = 0; d < dims; d++) dot += queryVector[d] * vectors[offset + d];
      hits.push({ chunk: chunks[i], score: dot });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  return hits.slice(0, limit);
}

export interface CorpusResult {
  slug: string;
  title: string;
  pageNumber: number;
  pageLabel: string | null;
  confidence: number | null;
  /** Offsets into the page text; null for a whole-chunk semantic hit. */
  start: number | null;
  end: number | null;
  snippetBefore: string;
  snippetMatch: string;
  snippetAfter: string;
  score: number;
  /** Which leg(s) produced this result — shown as a badge in the UI. */
  via: SearchMode[];
}

function fromLexical(hit: SearchHit, score: number): CorpusResult {
  return {
    slug: hit.slug,
    title: hit.title,
    pageNumber: hit.pageNumber,
    pageLabel: hit.pageLabel,
    confidence: hit.confidence,
    start: hit.start,
    end: hit.end,
    snippetBefore: hit.snippetBefore,
    snippetMatch: hit.snippetMatch,
    snippetAfter: hit.snippetAfter,
    score,
    via: [],
  };
}

function fromSemantic(hit: SemanticHit): CorpusResult | null {
  const page = getPage(hit.chunk.slug, hit.chunk.pageNumber);
  const source = getSource(hit.chunk.slug);
  if (!page || !source) return null;

  const text = page.text.slice(hit.chunk.charStart, hit.chunk.charEnd);
  return {
    slug: hit.chunk.slug,
    title: source.title,
    pageNumber: hit.chunk.pageNumber,
    pageLabel: page.pageLabel,
    confidence: page.confidence,
    start: hit.chunk.charStart,
    end: hit.chunk.charEnd,
    snippetBefore: "",
    snippetMatch: text.slice(0, 260),
    snippetAfter: text.length > 260 ? "…" : "",
    score: hit.score,
    via: [],
  };
}

const RRF_K = 60;

function keyOf(result: CorpusResult) {
  return `${result.slug}:${result.pageNumber}:${result.start ?? "x"}`;
}

export interface SearchRequest {
  query: string;
  mode?: SearchMode;
  slug?: string;
  limit?: number;
  apiKey?: string | null;
}

export async function runSearch(request: SearchRequest): Promise<CorpusResult[]> {
  const { query, mode = "hybrid", slug, limit = 50, apiKey } = request;
  const trimmed = (query ?? "").trim();
  if (!trimmed) return [];

  if (mode === "exact" || mode === "keyword") {
    return searchCorpus(trimmed, { slug, limit, strict: mode === "exact" }).map((hit, i) => ({
      ...fromLexical(hit, 1 / (i + 1)),
      via: [mode],
    }));
  }

  if (mode === "semantic") {
    if (!apiKey) throw new Error("Semantic search needs GEMINI_API_KEY");
    const hits = await semanticSearch(trimmed, { slug, limit, apiKey });
    return hits.map((hit) => ({ ...fromSemantic(hit)!, via: ["semantic" as const] })).filter(Boolean);
  }

  // hybrid — fuse the keyword and semantic rankings by reciprocal rank.
  const lexical = searchCorpus(trimmed, { slug, limit: limit * 2, strict: false });
  const semantic = apiKey
    ? await semanticSearch(trimmed, { slug, limit: limit * 2, apiKey }).catch(() => [])
    : [];

  const fused = new Map<string, CorpusResult>();

  lexical.forEach((hit, rank) => {
    const result = fromLexical(hit, 0);
    const key = keyOf(result);
    const existing = fused.get(key) ?? { ...result, score: 0, via: [] };
    existing.score += 1 / (RRF_K + rank + 1);
    if (!existing.via.includes("keyword")) existing.via.push("keyword");
    fused.set(key, existing);
  });

  semantic.forEach((hit, rank) => {
    const result = fromSemantic(hit);
    if (!result) return;
    // A semantic hit covering a page a keyword hit already landed on should
    // reinforce it rather than appear twice.
    const overlapping = Array.from(fused.values()).find(
      (candidate) =>
        candidate.slug === result.slug &&
        candidate.pageNumber === result.pageNumber &&
        candidate.start !== null &&
        result.start !== null &&
        candidate.start >= result.start &&
        candidate.start < result.end!
    );

    const target = overlapping ?? fused.get(keyOf(result)) ?? { ...result, score: 0, via: [] };
    target.score += 1 / (RRF_K + rank + 1);
    if (!target.via.includes("semantic")) target.via.push("semantic");
    fused.set(overlapping ? keyOf(overlapping) : keyOf(result), target);
  });

  return Array.from(fused.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export interface RetrievedPassage {
  ref: string;
  slug: string;
  title: string;
  pageNumber: number;
  pageLabel: string | null;
  confidence: number | null;
  text: string;
}

/**
 * Retrieval for the AI chat: top chunks with their text, ready for grounding.
 *
 * Also reports `topScore` — the best raw semantic similarity — which the answer
 * pipeline uses to decide whether calling the model is worth it at all. That
 * score has to come from the semantic leg rather than the fused hybrid ranking,
 * because RRF scores are positional (1/(60+rank)) and say nothing about whether
 * the corpus actually contains anything relevant.
 */
export async function retrieveForAnswer(
  query: string,
  options: { slug?: string; k?: number; apiKey: string }
): Promise<{ passages: RetrievedPassage[]; topScore: number }> {
  const { slug, k = 10, apiKey } = options;

  const [results, semantic] = await Promise.all([
    runSearch({ query, mode: "hybrid", slug, limit: k, apiKey }),
    semanticSearch(query, { slug, limit: 1, apiKey }).catch(() => [] as SemanticHit[]),
  ]);

  const topScore = semantic.length > 0 ? semantic[0].score : 0;

  const passages = results.map((result, index) => {
    const page = getPage(result.slug, result.pageNumber);
    const text =
      result.start !== null && result.end !== null && page
        ? page.text.slice(Math.max(0, result.start - 200), Math.min(page.text.length, result.end + 200))
        : result.snippetMatch;

    return {
      ref: `C${index + 1}`,
      slug: result.slug,
      title: result.title,
      pageNumber: result.pageNumber,
      pageLabel: result.pageLabel,
      confidence: result.confidence,
      text,
    };
  });

  return { passages, topScore };
}

export { fold };
