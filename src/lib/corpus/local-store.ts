// src/lib/corpus/local-store.ts
//
// Server-side reader for the corpus working store on local disk.
//
// This is the prototype's data layer. It deliberately mirrors the shape the
// Supabase `corpus` schema will expose (sources -> pages -> spans with char
// offsets), so the API routes and UI built against it keep working unchanged
// when the backend moves. Only this file gets swapped.
//
// Layout it reads (written by scripts/corpus/20-import-hub-ocr.mjs and
// scripts/corpus/10-render-pages.py):
//
//   data/corpus/ocr/<slug>/manifest.json
//   data/corpus/ocr/<slug>/pages/NNNN.json     { pageNumber, text, confidence }
//   data/corpus/pages/<slug>/NNNN.webp         rendered page image
//
// No embeddings yet, so search here is exact + accent-insensitive substring
// over page text. That is genuinely useful on its own — and because fold()
// preserves UTF-16 length, every hit carries real character offsets that the
// reader can highlight without any remapping.

import fs from "node:fs";
import path from "node:path";

import { fold, toStorageForm } from "./fold.ts";

const OCR_ROOT = path.join(process.cwd(), "data", "corpus", "ocr");

export interface CorpusPage {
  pageNumber: number;
  /** Printed page label, e.g. "80–81" for a double-page spread. */
  pageLabel: string | null;
  text: string;
  textNorm: string;
  confidence: number | null;
  method: string | null;
}

export interface CorpusSource {
  slug: string;
  title: string;
  author: string | null;
  year: number | null;
  sourceType: string;
  provenance: string;
  pageCount: number;
  meanConfidence: number | null;
  totalChars: number;
  /** True when pages are double-page spreads, i.e. one image = two printed pages. */
  isSpread: boolean;
}

export interface SearchHit {
  slug: string;
  title: string;
  pageNumber: number;
  pageLabel: string | null;
  confidence: number | null;
  /** Character offsets into the page text — directly usable by the reader. */
  start: number;
  end: number;
  snippetBefore: string;
  snippetMatch: string;
  snippetAfter: string;
}

interface LoadedSource extends CorpusSource {
  pages: CorpusPage[];
}

const cache = new Map<string, LoadedSource>();
let slugsCache: string[] | null = null;

/** Page-number footers sit alone on a line, e.g. "-80-". */
const PAGE_MARKER = /^[ \t]*[-‐-―−][ \t]*(\d{1,4})[ \t]*[-‐-―−][ \t]*$/gm;

function markersOf(text: string): number[] {
  const out: number[] = [];
  PAGE_MARKER.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PAGE_MARKER.exec(text)) !== null) {
    const value = Number(match[1]);
    if (value >= 1 && value <= 5000) out.push(value);
  }
  return out;
}

/**
 * Works out how physical page index maps to printed page numbers.
 *
 * These scans are double-page spreads, so a physical page shows two printed
 * pages: printed = 2·physical + offset. The offset varies per book with the
 * amount of front matter, so it is measured rather than assumed — the modal
 * value across every page that prints its own number. Measured 99.8% agreement
 * on Diễn ca lịch sử Nôm.
 */
function deriveLabels(pages: { pageNumber: number; text: string }[]) {
  const spreadVotes = new Map<number, number>();
  const singleVotes = new Map<number, number>();

  for (const page of pages) {
    const markers = markersOf(page.text);
    if (markers.length === 2 && markers[1] === markers[0] + 1) {
      const offset = markers[0] - 2 * page.pageNumber;
      spreadVotes.set(offset, (spreadVotes.get(offset) ?? 0) + 1);
    } else if (markers.length === 1) {
      const offset = markers[0] - page.pageNumber;
      singleVotes.set(offset, (singleVotes.get(offset) ?? 0) + 1);
    }
  }

  const best = (votes: Map<number, number>) => {
    let offset: number | null = null;
    let count = 0;
    votes.forEach((value, key) => {
      if (value > count) {
        count = value;
        offset = key;
      }
    });
    return { offset, count };
  };

  const spread = best(spreadVotes);
  const single = best(singleVotes);

  // Require real agreement before trusting a mapping — a wrong page label is
  // worse than no page label, because a citation would name the wrong page.
  const enough = Math.max(5, Math.floor(pages.length * 0.2));

  if (spread.count >= enough && spread.offset !== null) {
    const offset = spread.offset;
    return {
      isSpread: true,
      label: (pageNumber: number) =>
        `${2 * pageNumber + offset}–${2 * pageNumber + offset + 1}`,
    };
  }
  if (single.count >= enough && single.offset !== null) {
    const offset = single.offset;
    return { isSpread: false, label: (pageNumber: number) => String(pageNumber + offset) };
  }
  return { isSpread: false, label: () => null as string | null };
}

export function listSlugs(): string[] {
  if (slugsCache) return slugsCache;
  if (!fs.existsSync(OCR_ROOT)) return (slugsCache = []);
  slugsCache = fs
    .readdirSync(OCR_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((slug) => fs.existsSync(path.join(OCR_ROOT, slug, "manifest.json")))
    .sort();
  return slugsCache;
}

function load(slug: string): LoadedSource | null {
  const cached = cache.get(slug);
  if (cached) return cached;

  const bookDir = path.join(OCR_ROOT, slug);
  const manifestPath = path.join(bookDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) return null;

  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const pagesDir = path.join(bookDir, "pages");
  const files = fs.existsSync(pagesDir)
    ? fs.readdirSync(pagesDir).filter((name) => name.endsWith(".json")).sort()
    : [];

  const raw = files.map((name) => {
    const page = JSON.parse(fs.readFileSync(path.join(pagesDir, name), "utf8"));
    return {
      pageNumber: page.pageNumber as number,
      text: toStorageForm(page.text ?? ""),
      confidence: (page.confidence ?? null) as number | null,
      method: (page.method ?? null) as string | null,
    };
  });

  const labelling = deriveLabels(raw);

  const loaded: LoadedSource = {
    slug,
    title: manifest.title ?? slug,
    author: manifest.author ?? null,
    year: manifest.year ?? null,
    sourceType: manifest.sourceType ?? "secondary",
    provenance: manifest.provenance ?? "documentai",
    pageCount: raw.length,
    meanConfidence: manifest.meanConfidence ?? null,
    totalChars: manifest.totalChars ?? raw.reduce((sum, p) => sum + p.text.length, 0),
    isSpread: labelling.isSpread,
    pages: raw.map((page) => ({
      ...page,
      pageLabel: labelling.label(page.pageNumber),
      textNorm: fold(page.text),
    })),
  };

  cache.set(slug, loaded);
  return loaded;
}

export function getSources(): CorpusSource[] {
  return listSlugs()
    .map((slug) => load(slug))
    .filter((source): source is LoadedSource => source !== null)
    .map(({ pages, ...source }) => source);
}

export function getSource(slug: string): CorpusSource | null {
  const loaded = load(slug);
  if (!loaded) return null;
  const { pages, ...source } = loaded;
  return source;
}

export function getPage(slug: string, pageNumber: number): CorpusPage | null {
  const loaded = load(slug);
  if (!loaded) return null;
  return loaded.pages.find((page) => page.pageNumber === pageNumber) ?? null;
}

export interface SearchOptions {
  slug?: string;
  limit?: number;
  /** When true, match diacritics and case exactly. */
  strict?: boolean;
}

const SNIPPET_RADIUS = 90;

/**
 * Substring search across page text.
 *
 * Recall comes from the folded column so a query typed without Vietnamese tone
 * marks still matches; because folding preserves length, the offsets returned
 * index straight into the original page text and the reader can highlight the
 * accented original.
 */
export function searchCorpus(query: string, options: SearchOptions = {}): SearchHit[] {
  const trimmed = (query ?? "").trim();
  if (!trimmed) return [];

  const { slug, limit = 200, strict = false } = options;
  const needle = strict ? toStorageForm(trimmed) : fold(trimmed);
  if (!needle) return [];

  const slugs = slug ? [slug] : listSlugs();
  const hits: SearchHit[] = [];

  for (const candidate of slugs) {
    const source = load(candidate);
    if (!source) continue;

    for (const page of source.pages) {
      const haystack = strict ? page.text : page.textNorm;
      let from = 0;

      while (hits.length < limit) {
        const at = haystack.indexOf(needle, from);
        if (at === -1) break;

        const end = at + needle.length;
        hits.push({
          slug: source.slug,
          title: source.title,
          pageNumber: page.pageNumber,
          pageLabel: page.pageLabel,
          confidence: page.confidence,
          start: at,
          end,
          // Snippets come from the ORIGINAL text, so the reader sees real
          // Vietnamese with its diacritics even for an unaccented query.
          snippetBefore: page.text.slice(Math.max(0, at - SNIPPET_RADIUS), at),
          snippetMatch: page.text.slice(at, end),
          snippetAfter: page.text.slice(end, end + SNIPPET_RADIUS),
        });
        from = end;
      }
      if (hits.length >= limit) break;
    }
    if (hits.length >= limit) break;
  }

  return hits;
}

/** Clears the in-memory cache; used after a re-ingest during development. */
export function resetCorpusCache() {
  cache.clear();
  slugsCache = null;
}
