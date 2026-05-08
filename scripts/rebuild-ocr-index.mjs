// Rebuild data/ocr/_index.json from page files on disk.
//
// Background: _index.json drives the Text Lab UI but can be wiped while the
// per-document page files (data/ocr/<slug>/page_NNN.json) survive. This script
// scans those folders and reconstructs an index entry for each, preserving any
// entries already present (e.g. docs the live pipeline is currently working on).
//
// Usage:
//   node scripts/rebuild-ocr-index.mjs              # write changes
//   node scripts/rebuild-ocr-index.mjs --dry-run    # report only

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..");
const OCR_DIR = path.join(ROOT, "data", "ocr");
const INDEX_FILE = path.join(OCR_DIR, "_index.json");
const STATS_FILE = path.join(OCR_DIR, "_stats.json");
const METADATA_FILE = path.join(
  ROOT,
  "src",
  "app",
  "[locale]",
  "our-collections",
  "HanNomColumbiaDLCMetadata.ts"
);

const DRY_RUN = process.argv.includes("--dry-run");

const IIIF_BASE = "https://dlc.library.columbia.edu/iiif/3/presentation";

// ── Metadata lookup (slug → title) ──
// Parsed by reading the TS source as plain text so we don't need a TS runtime.

async function buildTitleMap() {
  const text = await fs.readFile(METADATA_FILE, "utf-8");
  const map = new Map();
  // Each record is delimited by `_doi: "doi:10.7916/d8-XXXX-YYYY",` and
  // contains a `title-1:title_sort_portion` and/or
  // `alternative_title-1:alternative_title_value`. We split on `_doi:` and
  // pull the title field out of each block.
  const blocks = text.split(/_doi:\s*"doi:/);
  for (const block of blocks.slice(1)) {
    const doiMatch = block.match(/^([^"]+)"/);
    if (!doiMatch) continue;
    const doi = doiMatch[1]; // e.g. "10.7916/d8-vfw2-4p49"
    const itemId = doi.split("/").pop();
    if (!itemId) continue;

    let title = null;
    const t1 = block.match(/"title-1:title_sort_portion":\s*"([^"]*)"/);
    if (t1 && t1[1].trim()) title = t1[1];
    if (!title) {
      const t2 = block.match(
        /"alternative_title-1:alternative_title_value":\s*"([^"]*)"/
      );
      if (t2 && t2[1].trim()) title = t2[1];
    }
    map.set(`han-nom-${itemId}`, title);
  }
  return map;
}

// ── Per-folder scan ──

async function scanFolder(slug) {
  const dir = path.join(OCR_DIR, slug);
  const entries = await fs.readdir(dir);
  const pageFiles = entries.filter((e) => /^page_\d+\.json$/.test(e));
  if (pageFiles.length === 0) return null;

  let maxPage = 0;
  let pagesWithText = 0;
  let confSum = 0;
  let confCount = 0;
  for (const f of pageFiles) {
    const n = parseInt(f.match(/^page_(\d+)\.json$/)[1], 10);
    if (n > maxPage) maxPage = n;
    try {
      const raw = await fs.readFile(path.join(dir, f), "utf-8");
      const data = JSON.parse(raw);
      if (data.rawText && data.rawText.length > 0) pagesWithText++;
      if (Array.isArray(data.spatialData)) {
        for (const c of data.spatialData) {
          if (!c.bbox) continue;
          if (typeof c.confidence !== "number") continue;
          confSum += c.confidence;
          confCount++;
        }
      }
    } catch {
      // unreadable page — count as without-text
    }
  }

  const ratio = maxPage > 0 ? pagesWithText / maxPage : 0;
  const status =
    pagesWithText === 0 ? "error" : ratio >= 0.9 ? "complete" : "partial";

  return {
    pageCount: maxPage,
    pagesWithText,
    status,
    avgConfidence: confCount > 0 ? confSum / confCount : undefined,
    confidenceCharCount: confCount,
  };
}

function manifestUrlForSlug(slug) {
  // slug shape: "han-nom-d8-XXXX-YYYY" → DOI suffix "d8-XXXX-YYYY"
  if (!slug.startsWith("han-nom-")) return undefined;
  const itemId = slug.slice("han-nom-".length);
  return `${IIIF_BASE}/10.7916/${itemId}/manifest`;
}

function itemIdFromSlug(slug) {
  if (!slug.startsWith("han-nom-")) return undefined;
  return slug.slice("han-nom-".length);
}

async function getMtime(p) {
  try {
    return (await fs.stat(p)).mtime.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// ── Main ──

async function main() {
  let existing = {};
  try {
    existing = JSON.parse(await fs.readFile(INDEX_FILE, "utf-8"));
  } catch {
    // no current index — that's fine
  }

  const folders = (await fs.readdir(OCR_DIR, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  console.log(`Found ${folders.length} folders in ${OCR_DIR}`);
  console.log(`Existing _index.json entries: ${Object.keys(existing).length}`);

  const titleMap = await buildTitleMap();
  console.log(`Loaded ${titleMap.size} titles from Han-Nôm metadata`);

  const next = { ...existing };
  const summary = {
    added: 0,
    skipped_already: 0,
    skipped_empty: 0,
    by_status: {},
    confidence_backfilled: 0,
  };

  for (const slug of folders) {
    if (next[slug]) {
      summary.skipped_already++;
      // Backfill avgConfidence for pre-existing entries that don't have it yet.
      if (next[slug].avgConfidence == null) {
        try {
          const scan = await scanFolder(slug);
          if (scan && scan.confidenceCharCount > 0) {
            next[slug] = {
              ...next[slug],
              avgConfidence: scan.avgConfidence,
              confidenceCharCount: scan.confidenceCharCount,
            };
            summary.confidence_backfilled++;
          }
        } catch {
          // non-critical — skip
        }
      }
      continue;
    }
    const scan = await scanFolder(slug);
    if (!scan) {
      summary.skipped_empty++;
      continue;
    }
    const updatedAt = await getMtime(path.join(OCR_DIR, slug));
    next[slug] = {
      status: scan.status,
      pageCount: scan.pageCount,
      collectionSlug: "han-nom-collection",
      source: "iiif",
      manifestUrl: manifestUrlForSlug(slug),
      title: titleMap.get(slug) ?? slug,
      itemId: itemIdFromSlug(slug),
      updatedAt,
      ...(scan.confidenceCharCount > 0 && {
        avgConfidence: scan.avgConfidence,
        confidenceCharCount: scan.confidenceCharCount,
      }),
    };
    summary.added++;
    summary.by_status[scan.status] = (summary.by_status[scan.status] ?? 0) + 1;
  }

  console.log("\nSummary:");
  console.log("  added new entries:", summary.added);
  console.log("  by status:", summary.by_status);
  console.log("  skipped (already in index):", summary.skipped_already);
  console.log("  skipped (no page files):", summary.skipped_empty);
  console.log("  confidence backfilled:", summary.confidence_backfilled);
  console.log("  total entries after:", Object.keys(next).length);

  if (DRY_RUN) {
    console.log("\n[dry-run] No changes written.");
    return;
  }

  // Backup before overwriting
  try {
    await fs.access(INDEX_FILE);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backup = `${INDEX_FILE}.bak.${stamp}`;
    await fs.copyFile(INDEX_FILE, backup);
    console.log(`Backed up existing index to ${path.basename(backup)}`);
  } catch {
    // no existing file to back up
  }

  await fs.writeFile(INDEX_FILE, JSON.stringify(next, null, 2), "utf-8");
  console.log(`Wrote ${INDEX_FILE}`);

  // Corpus-wide stats — weighted average across all docs that have confidence.
  let docsWithConfidence = 0;
  let weightedSum = 0;
  let totalCharCount = 0;
  for (const entry of Object.values(next)) {
    if (entry.avgConfidence == null || !entry.confidenceCharCount) continue;
    docsWithConfidence++;
    weightedSum += entry.avgConfidence * entry.confidenceCharCount;
    totalCharCount += entry.confidenceCharCount;
  }
  const stats = {
    updatedAt: new Date().toISOString(),
    docCount: Object.keys(next).length,
    docsWithConfidence,
    overallAvgConfidence: totalCharCount > 0 ? weightedSum / totalCharCount : null,
    totalCharCount,
  };
  await fs.writeFile(STATS_FILE, JSON.stringify(stats, null, 2), "utf-8");
  console.log(
    `Wrote ${STATS_FILE} — overall avg confidence:`,
    stats.overallAvgConfidence != null
      ? `${(stats.overallAvgConfidence * 100).toFixed(2)}% across ${stats.totalCharCount.toLocaleString()} chars in ${stats.docsWithConfidence} docs`
      : "(no data)"
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
