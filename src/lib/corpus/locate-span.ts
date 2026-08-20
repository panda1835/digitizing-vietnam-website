// src/lib/corpus/locate-span.ts
//
// Finds where a quoted passage actually sits inside a page of corpus text, and
// says how sure it is. Used in two places that must agree:
//
//   1. Server-side, to validate that a model-produced citation quote really
//      occurs in the chunk it claims. A quote that cannot be located here gets
//      the citation dropped before the answer is ever assembled.
//   2. Client-side, to highlight a span when a citation link is opened and the
//      stored offsets no longer line up — because the page was re-OCR'd or a
//      human correction shifted everything after it.
//
// Matching is deliberately layered, cheapest and most certain first. The result
// always reports which layer succeeded so the UI can be honest about it: an
// `exact` hit is silent, a `fuzzy` hit shows a similarity badge, and a failure
// shows a banner rather than a wrong highlight.

// Explicit .ts extension so the ingestion scripts can import this module
// directly under Node's ESM loader; see allowImportingTsExtensions in tsconfig.
import { fold } from "./fold.ts";

export type SpanMatchKind = "exact" | "folded" | "whitespace" | "fuzzy";

export interface LocatedSpan {
  /** UTF-16 offset into the ORIGINAL haystack, inclusive. */
  start: number;
  /** UTF-16 offset into the ORIGINAL haystack, exclusive. */
  end: number;
  /** Which matching layer produced this hit. */
  match: SpanMatchKind;
  /** 1 for exact; below 1 for approximate matches. */
  similarity: number;
}

export interface LocateOptions {
  /**
   * Where the span was previously believed to start. Candidates near the hint
   * win ties, which keeps a repeated quote anchored to the right occurrence.
   */
  hint?: number;
  /**
   * Maximum share of the needle that may differ before a fuzzy match is
   * rejected. 0.25 tolerates ordinary OCR noise without matching unrelated text.
   */
  maxErrorRatio?: number;
}

const DEFAULT_MAX_ERROR_RATIO = 0.25;

/** Collapses whitespace runs, returning a map from new index -> original index. */
function collapseWhitespace(input: string): { text: string; map: number[] } {
  let text = "";
  const map: number[] = [];
  let inRun = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === "­") continue; // soft hyphen, an OCR artefact of line breaks
    if (/\s/.test(ch)) {
      if (inRun) continue;
      inRun = true;
      text += " ";
      map.push(i);
      continue;
    }
    inRun = false;
    text += ch;
    map.push(i);
  }

  return { text, map };
}

/** Picks the candidate whose start is nearest the hint. */
function nearest(candidates: number[], hint: number | undefined): number {
  if (candidates.length === 0) return -1;
  if (hint === undefined) return candidates[0];
  let best = candidates[0];
  let bestDistance = Math.abs(best - hint);
  for (const candidate of candidates.slice(1)) {
    const distance = Math.abs(candidate - hint);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}

function allIndexesOf(haystack: string, needle: string, limit = 64): number[] {
  const out: number[] = [];
  let from = 0;
  while (out.length < limit) {
    const at = haystack.indexOf(needle, from);
    if (at === -1) break;
    out.push(at);
    from = at + 1;
  }
  return out;
}

/**
 * Levenshtein distance, banded to `maxDistance`. Returns Infinity as soon as the
 * whole band exceeds the budget, so hopeless windows cost almost nothing.
 */
function bandedDistance(a: string, b: string, maxDistance: number): number {
  if (Math.abs(a.length - b.length) > maxDistance) return Infinity;
  if (a === b) return 0;

  let previous = new Array<number>(b.length + 1);
  let current = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) previous[j] = j;

  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    const from = Math.max(1, i - maxDistance);
    const to = Math.min(b.length, i + maxDistance);

    if (from > 1) current[from - 1] = Infinity;

    let rowBest = Infinity;
    for (let j = from; j <= to; j++) {
      const substitution = previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      const deletion = (previous[j] ?? Infinity) + 1;
      const insertion = (current[j - 1] ?? Infinity) + 1;
      current[j] = Math.min(substitution, deletion, insertion);
      if (current[j] < rowBest) rowBest = current[j];
    }
    for (let j = to + 1; j <= b.length; j++) current[j] = Infinity;

    if (rowBest > maxDistance) return Infinity;

    const swap = previous;
    previous = current;
    current = swap;
  }

  const distance = previous[b.length];
  return distance > maxDistance ? Infinity : distance;
}

/**
 * Proposes window start positions by finding where distinctive slices of the
 * needle occur in the haystack, instead of testing every offset.
 */
function anchorCandidates(haystack: string, needle: string): number[] {
  const probeLength = Math.min(12, Math.max(4, Math.floor(needle.length / 6)));
  const probeCount = Math.min(6, Math.max(2, Math.floor(needle.length / probeLength)));
  const candidates = new Set<number>();

  for (let p = 0; p < probeCount; p++) {
    const at = Math.floor((needle.length - probeLength) * (p / Math.max(1, probeCount - 1)));
    const probe = needle.slice(at, at + probeLength);
    if (!probe.trim()) continue;
    for (const hit of allIndexesOf(haystack, probe, 32)) {
      const start = hit - at;
      if (start >= 0 && start < haystack.length) candidates.add(start);
    }
  }

  return Array.from(candidates);
}

/**
 * Locates `needle` inside `haystack`, returning offsets into the original
 * haystack, or null when no acceptable match exists.
 *
 * Returning null is a valid, expected outcome — the corpus is correctable, so a
 * quote captured against an older revision genuinely may not be present any
 * more. Callers should say so rather than highlighting something else.
 */
export function locateSpan(
  haystack: string,
  needle: string,
  options: LocateOptions = {}
): LocatedSpan | null {
  if (!haystack || !needle) return null;

  const { hint, maxErrorRatio = DEFAULT_MAX_ERROR_RATIO } = options;

  // Layer 1 — exact. The common case, and the only one that is beyond doubt.
  const exact = nearest(allIndexesOf(haystack, needle), hint);
  if (exact !== -1) {
    return { start: exact, end: exact + needle.length, match: "exact", similarity: 1 };
  }

  // Layer 2 — folded. fold() preserves UTF-16 length, so an offset in the
  // folded haystack is already an offset in the original. No remapping needed.
  const foldedHaystack = fold(haystack);
  const foldedNeedle = fold(needle);
  const folded = nearest(allIndexesOf(foldedHaystack, foldedNeedle), hint);
  if (folded !== -1) {
    return {
      start: folded,
      end: folded + foldedNeedle.length,
      match: "folded",
      similarity: 1,
    };
  }

  // Layer 3 — whitespace-insensitive. OCR line breaks land in different places
  // than the model's quote, which otherwise matches character for character.
  const collapsedHay = collapseWhitespace(foldedHaystack);
  const collapsedNeedle = collapseWhitespace(foldedNeedle).text.trim();
  if (collapsedNeedle) {
    const hits = allIndexesOf(collapsedHay.text, collapsedNeedle);
    const hit = nearest(
      hits.map((h) => collapsedHay.map[h] ?? 0),
      hint
    );
    if (hit !== -1) {
      const index = hits.find((h) => collapsedHay.map[h] === hit);
      if (index !== undefined) {
        const lastIndex = Math.min(
          collapsedHay.map.length - 1,
          index + collapsedNeedle.length - 1
        );
        return {
          start: collapsedHay.map[index],
          end: collapsedHay.map[lastIndex] + 1,
          match: "whitespace",
          similarity: 1,
        };
      }
    }
  }

  // Layer 4 — bounded approximate match around anchor positions.
  const budget = Math.floor(collapsedNeedle.length * maxErrorRatio);
  if (budget < 1 || collapsedNeedle.length < 8) return null;

  let best: { start: number; end: number; distance: number } | null = null;

  for (const candidate of anchorCandidates(collapsedHay.text, collapsedNeedle)) {
    // Let the window flex by the error budget in each direction.
    for (const widthDelta of [0, budget, -budget]) {
      const width = collapsedNeedle.length + widthDelta;
      if (width < 1) continue;
      const end = Math.min(collapsedHay.text.length, candidate + width);
      const window = collapsedHay.text.slice(candidate, end);
      if (!window) continue;

      const distance = bandedDistance(window, collapsedNeedle, budget);
      if (distance === Infinity) continue;

      if (
        !best ||
        distance < best.distance ||
        (distance === best.distance &&
          hint !== undefined &&
          Math.abs(collapsedHay.map[candidate] - hint) <
            Math.abs(collapsedHay.map[best.start] - hint))
      ) {
        best = { start: candidate, end, distance };
      }
    }
  }

  if (!best) return null;

  const lastIndex = Math.min(collapsedHay.map.length - 1, best.end - 1);
  return {
    start: collapsedHay.map[best.start],
    end: collapsedHay.map[lastIndex] + 1,
    match: "fuzzy",
    similarity: 1 - best.distance / collapsedNeedle.length,
  };
}

/**
 * Server-side citation gate: does this quote actually occur in this chunk?
 * A null result means the citation must be dropped, not softened.
 */
export function verifyQuote(
  chunkText: string,
  quote: string,
  chunkCharStart = 0
): (LocatedSpan & { pageStart: number; pageEnd: number }) | null {
  const located = locateSpan(chunkText, quote);
  if (!located) return null;
  return {
    ...located,
    pageStart: chunkCharStart + located.start,
    pageEnd: chunkCharStart + located.end,
  };
}
