/**
 * Hán-Nôm → Quốc Ngữ conversion via the Nôm Na Việt converter API.
 *
 * Faithful port of nom-ocr-training/src/lib/quocngu-converter.ts (the
 * canonical implementation; text-search's quocngu.py was itself ported
 * from it). Only the editor-internal fetch path differs: DVN proxies the
 * converter through /api/admin/ocr/transliterate (admin-namespaced).
 *
 * Workflow:
 *   1. For each confirmed column on the page, take its non-blank chars in
 *      reading order and join their `text` into a single string.
 *   2. POST that string to /api/admin/ocr/transliterate. The API may
 *      return one segment per char (most common) OR a multi-char segment
 *      when the dictionary matched a compound (e.g. "國語" → one segment
 *      with reading "quốc ngữ"). We send columns rather than the whole
 *      page so compounds can't accidentally span a column boundary.
 *   3. Map segments back to per-char readings using length matching:
 *        - segment.nom is N chars long
 *        - segment.vietnamese splits into M space-separated tokens
 *        - if M === N, assign one token per char (preserves alignment for
 *          compounds with one Quốc Ngữ word per glyph — the common case)
 *        - otherwise, assign the whole segment reading to every char in
 *          the segment and stash ranked alternates in `quocNguChoices`.
 *
 * The converter doesn't see image pixels — it operates purely on the
 * already-corrected Hán-Nôm characters. So Step 3 quality depends on
 * Step 2 being clean.
 */

import type { SpatialCharacter } from "./ocr-store";
import type { Column } from "@/components/ocr-editor/useColumnDetection";

/** One prior human Quốc Ngữ reading of a glyph (qn-suggestions API). */
export interface QnSuggestion {
  qn: string;
  count: number;
  uncertainCount: number;
  scope: "text" | "global";
}
/** glyph → ranked prior readings, as returned by /api/admin/ocr/qn-suggestions. */
export type QnSuggestionMap = Record<string, QnSuggestion[]>;

export interface ConverterSegment {
  nom: string;
  vietnamese: string;
  matched: boolean;
  meaning?: string;
  alternatives: Array<{
    pronunciation: string;
    finalScore?: number;
    meaning?: string;
  }>;
}

export interface QuocNguResult {
  /** Per-char primary reading, keyed by SpatialCharacter.offset. */
  readings: Map<number, string>;
  /** Per-char ranked alternates (excluding primary), keyed by offset. */
  alternates: Map<number, string[]>;
  /**
   * Per-segment debug info for the run log: which chars were grouped, how
   * many alternates were returned, whether the segment was a dictionary
   * match. Surfaced in a collapsible log similar to the NNV re-OCR table.
   */
  segmentLog: Array<{
    nom: string;
    vietnamese: string;
    matched: boolean;
    charOffsets: number[];
    splitMode: "per-char" | "whole-segment";
  }>;
}

export interface RunOptions {
  /** Max alternates per char (excludes primary). Default 8. */
  maxAlternatives?: number;
  /** Pause between column requests in ms, to stay below the rate limit. */
  slotMs?: number;
  /** Called after each column completes so the UI can render progress. */
  onProgress?: (done: number, total: number) => void;
  /** Called when a column converts successfully — for incremental updates. */
  onColumnComplete?: (
    columnIndex: number,
    partial: { readings: Map<number, string>; alternates: Map<number, string[]> }
  ) => void;
  /** AbortSignal — stops further column requests when triggered. */
  signal?: AbortSignal;
}

interface CharTextPair {
  char: SpatialCharacter;
  text: string;
}

/**
 * Run the converter over all chars in the supplied columns. Columns
 * should be in reading order (the same order the editor stores them).
 * Skips chars whose `text` is blank or a layout sentinel (newlines,
 * whitespace) — they wouldn't survive the API round-trip anyway.
 */
export async function transliterateColumns(
  columns: Column[],
  opts: RunOptions = {}
): Promise<QuocNguResult> {
  const result: QuocNguResult = {
    readings: new Map(),
    alternates: new Map(),
    segmentLog: [],
  };

  const slotMs = opts.slotMs ?? 250;
  const maxAlt = opts.maxAlternatives ?? 8;

  let done = 0;
  const total = columns.length;
  opts.onProgress?.(done, total);

  for (let ci = 0; ci < columns.length; ci++) {
    if (opts.signal?.aborted) break;

    const col = columns[ci];
    const eligible: CharTextPair[] = col.chars
      .map((c) => ({ char: c, text: (c.text ?? "").trim() }))
      .filter((p) => p.text.length > 0);
    if (eligible.length === 0) {
      done++;
      opts.onProgress?.(done, total);
      continue;
    }

    const text = eligible.map((p) => p.text).join("");
    const partialReadings = new Map<number, string>();
    const partialAlts = new Map<number, string[]>();

    try {
      const res = await fetch("/api/admin/ocr/transliterate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          options: {
            showAlternatives: true,
            // +1 because we'll drop the primary from the alternates list,
            // and the user sees `maxAlt` items in the picker.
            maxAlternatives: maxAlt + 1,
            useLLMSelection: false,
          },
        }),
        signal: opts.signal,
      });

      if (!res.ok) {
        // Surface the column-level failure in the log so the user sees
        // *which* column didn't convert, but keep going — a single column
        // failing shouldn't poison the whole page.
        result.segmentLog.push({
          nom: text,
          vietnamese: "",
          matched: false,
          charOffsets: eligible.map((p) => p.char.offset),
          splitMode: "whole-segment",
        });
      } else {
        const data = (await res.json()) as { segments?: ConverterSegment[] };
        const segments = Array.isArray(data.segments) ? data.segments : [];
        mapSegmentsToChars(
          segments,
          eligible,
          partialReadings,
          partialAlts,
          result.segmentLog,
          maxAlt
        );
      }
    } catch (e: any) {
      // Network error / abort — log and continue.
      result.segmentLog.push({
        nom: text,
        vietnamese: `(error: ${e?.message ?? "unknown"})`,
        matched: false,
        charOffsets: eligible.map((p) => p.char.offset),
        splitMode: "whole-segment",
      });
    }

    for (const [k, v] of partialReadings) result.readings.set(k, v);
    for (const [k, v] of partialAlts) result.alternates.set(k, v);
    opts.onColumnComplete?.(ci, {
      readings: partialReadings,
      alternates: partialAlts,
    });

    done++;
    opts.onProgress?.(done, total);

    // Pause between columns so we stay under the upstream's rate limit
    // (500 req / 15 min). With slotMs default of 250 ms we can sustain
    // ~4 req/s, well below the limit even on a long doc.
    if (ci < columns.length - 1 && slotMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, slotMs));
    }
  }

  return result;
}

/**
 * Walk segments and the source char list together. The converter consumes
 * source chars in order, so we maintain a cursor `i` over `eligible`.
 *
 * For each segment:
 *   - peel `segment.nom.length` Unicode code points off the cursor
 *     (segment.nom is composed of these source chars in the same order)
 *   - try to split `segment.vietnamese` into N tokens; if so, one token
 *     per char. Otherwise, assign the whole reading to every char in the
 *     compound.
 *   - alternates: each alternate gets its own per-char split with the
 *     same rule. If alternates can't split cleanly, they're attached to
 *     every char in the compound.
 */
function mapSegmentsToChars(
  segments: ConverterSegment[],
  eligible: CharTextPair[],
  outReadings: Map<number, string>,
  outAlts: Map<number, string[]>,
  log: QuocNguResult["segmentLog"],
  maxAlt: number
) {
  let i = 0;
  for (const seg of segments) {
    const nomChars = Array.from(seg.nom);
    if (nomChars.length === 0) continue;

    // Defensive cursor advance: if the segment doesn't start at our
    // cursor (rare — only happens when the API drops a char or punctuation
    // sneaks in), skip ahead past any orphans until we find an alignment.
    // This way an upstream hiccup just leaves a few chars without readings
    // rather than corrupting every later column.
    while (
      i < eligible.length &&
      nomChars[0] !== eligible[i].text &&
      // Don't search forever — give up if the rest of the column doesn't
      // contain this segment's first char at all.
      eligible.slice(i).some((p) => p.text === nomChars[0])
    ) {
      i++;
    }
    if (i + nomChars.length > eligible.length) {
      // Not enough source chars left for this segment. Bail on the rest
      // of this column to avoid cross-attribution.
      break;
    }

    const chars = eligible.slice(i, i + nomChars.length);
    const offsets = chars.map((p) => p.char.offset);
    const tokens = seg.vietnamese.trim().split(/\s+/).filter(Boolean);
    const splitMode: "per-char" | "whole-segment" =
      tokens.length === nomChars.length ? "per-char" : "whole-segment";

    if (splitMode === "per-char") {
      tokens.forEach((tok, k) => outReadings.set(offsets[k], tok));
    } else {
      // Compound reading that doesn't decompose cleanly. Repeat the whole
      // reading on every char so the user sees something consistent.
      for (const off of offsets) outReadings.set(off, seg.vietnamese);
    }

    // Alternates: try to apply the same split to each alternate. When an
    // alternate decomposes char-by-char, attach the kth token to the kth
    // char. When it doesn't, attach the whole alternate to every char in
    // the compound.
    const perCharAlts: string[][] = chars.map(() => []);
    for (const alt of seg.alternatives) {
      const altTokens = alt.pronunciation.trim().split(/\s+/).filter(Boolean);
      if (altTokens.length === nomChars.length) {
        altTokens.forEach((tok, k) => {
          if (tok && tok !== outReadings.get(offsets[k])) {
            perCharAlts[k].push(tok);
          }
        });
      } else if (alt.pronunciation && alt.pronunciation !== seg.vietnamese) {
        for (let k = 0; k < chars.length; k++) {
          perCharAlts[k].push(alt.pronunciation);
        }
      }
    }
    for (let k = 0; k < chars.length; k++) {
      const seen = new Set<string>();
      const dedup: string[] = [];
      for (const a of perCharAlts[k]) {
        if (!a || seen.has(a)) continue;
        seen.add(a);
        dedup.push(a);
        if (dedup.length >= maxAlt) break;
      }
      if (dedup.length > 0) outAlts.set(offsets[k], dedup);
    }

    log.push({
      nom: seg.nom,
      vietnamese: seg.vietnamese,
      matched: seg.matched,
      charOffsets: offsets,
      splitMode,
    });

    i += nomChars.length;
  }
}

/**
 * Single-character transliteration. Sends one Hán-Nôm glyph to the
 * converter proxy and returns its primary Quốc Ngữ reading plus ranked
 * alternates. Used by the focused-char editor panel (Step 2) — the
 * per-char counterpart to `transliterateColumns`, using the same
 * segment/alternate semantics for a 1-char "segment".
 *
 * Returns `{ primary: undefined, alternates: [] }` when the dictionary
 * has no entry for the glyph (caller decides how to surface that).
 */
export async function transliterateChar(
  glyph: string,
  opts: { maxAlternatives?: number; signal?: AbortSignal } = {}
): Promise<{ primary?: string; alternates: string[] }> {
  const g = (glyph ?? "").trim();
  if (!g) return { alternates: [] };
  const maxAlt = opts.maxAlternatives ?? 8;

  const res = await fetch("/api/admin/ocr/transliterate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: g,
      options: {
        showAlternatives: true,
        maxAlternatives: maxAlt + 1,
        useLLMSelection: false,
      },
    }),
    signal: opts.signal,
  });
  if (!res.ok) throw new Error(`Transliterate HTTP ${res.status}`);

  const data = (await res.json()) as { segments?: ConverterSegment[] };
  const segments = Array.isArray(data.segments) ? data.segments : [];
  // The glyph itself is one "eligible" char; reuse the faithful
  // segment→char mapper so single-char behaviour matches column runs.
  const eligible: CharTextPair[] = [
    { char: { text: g, bbox: null, confidence: 0, offset: 0 }, text: g },
  ];
  const readings = new Map<number, string>();
  const alternates = new Map<number, string[]>();
  mapSegmentsToChars(segments, eligible, readings, alternates, [], maxAlt);

  return {
    primary: readings.get(0),
    alternates: alternates.get(0) ?? [],
  };
}

/**
 * Apply a converter result to a spatialData array, returning a new array
 * with `quocNgu` and `quocNguChoices` populated. Chars not covered by the
 * result keep their existing fields untouched (so partial / re-run results
 * don't wipe earlier work).
 */
export function applyQuocNguResult(
  spatialData: SpatialCharacter[],
  result: QuocNguResult
): SpatialCharacter[] {
  return spatialData.map((c) => {
    const reading = result.readings.get(c.offset);
    const alts = result.alternates.get(c.offset);
    if (reading === undefined && alts === undefined) return c;
    const next: SpatialCharacter = { ...c };
    if (reading !== undefined) next.quocNgu = reading;
    if (alts !== undefined) next.quocNguChoices = alts;
    return next;
  });
}
