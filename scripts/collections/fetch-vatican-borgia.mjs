#!/usr/bin/env node
// scripts/collections/fetch-vatican-borgia.mjs
//
// Snapshots the Vatican Library's "Borgia Tonchinensis" fond (Borg.tonch) into
// a committed TypeScript file, mirroring scripts/collections/fetch-pennstate-edicts.mjs.
//
// WHAT THE VATICAN ACTUALLY PUBLISHES
// -----------------------------------
// Very little. Every catalogue record in this fond is "(Shelfmark Only)", and
// the IIIF manifests carry a shelfmark and `Language: ["und"]` and nothing
// else. So this script captures the shape of each manuscript — how many pages,
// where the scans live, what the first leaves are called — and DVN supplies the
// descriptive layer by hand in src/lib/vatican-borgia-descriptions.ts.
//
// Images are NOT mirrored: item pages point Mirador straight at the Vatican's
// IIIF, which keeps the scans authoritative and the Vatican the host of record.
// Their manifests send `Access-Control-Allow-Origin: *`, so the browser can
// load them directly.
//
// Rights: the Vatican asserts copyright over these images ("Images Copyright
// Biblioteca Apostolica Vaticana"; the site's terms forbid reproduction without
// authorisation). DVN presents them by permission of the Vatican Digital
// Library — see the credit on the collection page.
//
// Usage:
//   node scripts/collections/fetch-vatican-borgia.mjs [--out <path>] [--dry-run]

import fs from "node:fs";
import path from "node:path";

const HOST = "https://digi.vatlib.it";
const FOND = "Borg.tonch";
const LIST_URL = `${HOST}/mss/${FOND}`;

const DEFAULT_OUT = path.resolve(
  process.cwd(),
  "src/app/[locale]/our-collections/VaticanBorgiaMetadata.ts"
);

/** Manifests here run to hundreds of canvases; be a polite client. */
const DELAY_MS = 400;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function get(url, as = "json") {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, {
      headers: { Accept: as === "json" ? "application/json" : "text/html" },
    });
    if (response.ok) return as === "json" ? response.json() : response.text();
    if (response.status >= 500 || response.status === 429) {
      await sleep(2 ** attempt * 800);
      continue;
    }
    throw new Error(`${response.status} for ${url}`);
  }
  throw new Error(`gave up on ${url}`);
}

/**
 * Existence check for a static file.
 *
 * Their server drops connections under a run's request rate often enough that a
 * single failed probe is meaningless — an early version of this script reported
 * "0 covers" for all 41 because of it. So: retry, and fall back to a one-byte
 * ranged GET for the case where HEAD itself is refused.
 */
async function exists(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    for (const init of [{ method: "HEAD" }, { headers: { Range: "bytes=0-0" } }]) {
      try {
        const response = await fetch(url, init);
        if (response.ok) return true;
        // A definite "no" — don't keep asking.
        if (response.status === 404 || response.status === 410) return false;
      } catch {
        // Connection-level failure; fall through to the next attempt.
      }
    }
    await sleep(500 * (attempt + 1));
  }
  return false;
}

/**
 * The fond's browse page lists every digitised item as a link to
 * /mss/edition/MSS_Borg.tonch.N. Parsing it rather than counting 1..41 means a
 * later addition to the fond is picked up by re-running this script.
 */
function parseShelfmarks(html) {
  const pattern = new RegExp(
    `/mss/edition/MSS_${FOND.replace(/\./g, "\\.")}\\.([0-9]+[A-Za-z]?)`,
    "g"
  );
  const seen = new Set();
  for (const match of html.matchAll(pattern)) seen.add(match[1]);

  return [...seen].sort((a, b) => {
    const [an, bn] = [Number.parseInt(a, 10), Number.parseInt(b, 10)];
    return an - bn || a.localeCompare(b);
  });
}

/** IIIF Presentation 2 puts a plain string, or {"@value": …}, in these slots. */
function plain(value) {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) return plain(value[0]);
  if (typeof value === "object") return plain(value["@value"] ?? "");
  return String(value).trim();
}

function metadataValue(manifest, label) {
  const row = (manifest.metadata ?? []).find(
    (entry) => plain(entry.label).toLowerCase() === label.toLowerCase()
  );
  if (!row) return [];
  const value = row.value;
  return (Array.isArray(value) ? value : [value]).map(plain).filter(Boolean);
}

/** Slugified shelfmark: "Borg.tonch.1" -> "borg-tonch-1". Used in DVN URLs. */
const toItemId = (shelfmark) =>
  shelfmark.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const outIndex = args.indexOf("--out");
  const outPath = outIndex !== -1 ? path.resolve(args[outIndex + 1]) : DEFAULT_OUT;

  console.log(`fetching ${FOND} from ${HOST}`);

  const shelfmarkNumbers = parseShelfmarks(await get(LIST_URL, "html"));
  console.log(`  ${shelfmarkNumbers.length} items listed\n`);
  if (shelfmarkNumbers.length === 0) {
    throw new Error(`no items found at ${LIST_URL} — did their markup change?`);
  }

  const items = [];

  for (const number of shelfmarkNumbers) {
    const shelfmark = `${FOND}.${number}`;
    const manifestUrl = `${HOST}/iiif/MSS_${shelfmark}/manifest.json`;
    const manifest = await get(manifestUrl);

    const canvases = manifest.sequences?.[0]?.canvases ?? [];
    const firstService = canvases[0]?.images?.[0]?.resource?.service?.["@id"] ?? "";

    // Prefer the Vatican's own cover image over the first canvas. The first
    // canvas is always "piatto.anteriore" — the bare binding, which looks the
    // same on all 41 and tells a reader nothing. The cover their own catalogue
    // shows is a curator's choice of a representative page, usually one with
    // legible text on it. Fall back to the first canvas if a volume has none.
    const coverUrl = `${HOST}/pub/digit/MSS_${shelfmark}/cover/cover.jpg`;
    const hasCover = await exists(coverUrl);
    const iiifThumbnail = firstService
      ? `${firstService}/full/!400,400/0/default.jpg`
      : "";

    // seeAlso is the catalogue record; fall back to the predictable detail URL.
    const seeAlso = Array.isArray(manifest.seeAlso)
      ? plain(manifest.seeAlso[0])
      : plain(manifest.seeAlso);

    items.push({
      itemId: toItemId(shelfmark),
      shelfmark: plain(metadataValue(manifest, "Shelfmark")[0]) || shelfmark,
      /** Numeric part, kept for ordering without re-parsing the shelfmark. */
      sequence: Number.parseInt(number, 10),
      label: plain(manifest.label) || shelfmark,
      /** The Vatican records "und" for every item in this fond. */
      languageCodes: metadataValue(manifest, "Language"),
      pageCount: canvases.length,
      /**
       * The opening leaves, e.g. "piatto.anteriore", "1r", "1v" — enough to
       * show how a volume is structured. The full list would be ~15k strings
       * across the fond and would ship to the browser for nothing.
       */
      firstPageLabels: canvases.slice(0, 6).map((canvas) => plain(canvas.label)),
      attribution: plain(manifest.attribution),
      manifestUrl,
      thumbnailUrl: hasCover ? coverUrl : iiifThumbnail,
      /** True when the thumbnail is the Vatican's curated cover, not canvas 1. */
      thumbnailIsCuratedCover: hasCover,
      /** The first canvas, kept as the fallback the cover replaced. */
      firstCanvasThumbnailUrl: iiifThumbnail,
      permalinkUrl: seeAlso || `${HOST}/mss/detail/${shelfmark}`,
      viewerUrl: `${HOST}/view/MSS_${shelfmark}`,
    });

    process.stdout.write(
      `\r  ${items.length}/${shelfmarkNumbers.length}  ${shelfmark.padEnd(18)} ${String(
        canvases.length
      ).padStart(4)} pages`
    );
    await sleep(DELAY_MS);
  }

  process.stdout.write("\n\n");

  const missing = items.filter(
    (item) => !item.manifestUrl || !item.thumbnailUrl || !item.permalinkUrl
  );
  if (missing.length) {
    throw new Error(
      `${missing.length} item(s) missing a manifest, thumbnail or permalink: ${missing
        .map((item) => item.shelfmark)
        .join(", ")}`
    );
  }

  const pages = items.map((item) => item.pageCount);
  console.log(`  ${items.length} items, ${pages.reduce((a, b) => a + b, 0)} pages total`);
  console.log(`  pages per item: ${Math.min(...pages)}–${Math.max(...pages)}`);
  console.log(
    `  thumbnails: ${items.filter((item) => item.thumbnailIsCuratedCover).length} curated covers, ` +
      `${items.filter((item) => !item.thumbnailIsCuratedCover).length} falling back to canvas 1`
  );

  const file = `// ${path.relative(process.cwd(), outPath).replace(/\\/g, "/")}
//
// GENERATED FILE — do not edit by hand.
// Run: node scripts/collections/fetch-vatican-borgia.mjs
//
// Snapshot of the Biblioteca Apostolica Vaticana's "Borgia Tonchinensis" fond
// (${FOND}) as published by the Vatican Digital Library — Vietnamese Catholic
// manuscripts and early printed works of the 17th–19th centuries.
//
// The Vatican catalogues these as shelfmark-only records, so there are no
// titles, dates or descriptions to snapshot. DVN supplies those by hand in
// src/lib/vatican-borgia-descriptions.ts; this file holds only what the
// Vatican itself publishes.
//
// Rights: images are copyright Biblioteca Apostolica Vaticana and are NOT
// mirrored — item pages load the Vatican's IIIF directly, and DVN presents
// them by permission of the Vatican Digital Library.
//
// Snapshot taken: ${new Date().toISOString().slice(0, 10)}

export interface VaticanBorgiaRecord {
  /** Slugified shelfmark, e.g. "borg-tonch-1" — the id used in DVN URLs. */
  itemId: string;
  /** The Vatican's own shelfmark, e.g. "Borg.tonch.1". */
  shelfmark: string;
  /** Numeric part of the shelfmark, for ordering. */
  sequence: number;
  /** Manifest label; the Vatican repeats the shelfmark here. */
  label: string;
  /** ISO codes as catalogued — "und" (undetermined) throughout this fond. */
  languageCodes: string[];
  /** Number of IIIF canvases, i.e. digitised pages including covers. */
  pageCount: number;
  /** Opening leaf labels, e.g. "piatto.anteriore", "1r", "1v". */
  firstPageLabels: string[];
  /** The Vatican's own attribution string, shown in the credit. */
  attribution: string;
  manifestUrl: string;
  /** The Vatican's curated cover where they publish one, else the first canvas. */
  thumbnailUrl: string;
  thumbnailIsCuratedCover: boolean;
  firstCanvasThumbnailUrl: string;
  /** The catalogue record on DigiVatLib. */
  permalinkUrl: string;
  /** The Vatican's own page-turner, offered alongside DVN's viewer. */
  viewerUrl: string;
}

export const VATICAN_BORGIA_ITEMS: ReadonlyArray<VaticanBorgiaRecord> = ${JSON.stringify(
    items,
    null,
    2
  )};
`;

  if (dryRun) {
    console.log(`\n  (dry run — would write ${outPath})`);
    return;
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, file, "utf8");
  console.log(`\n  wrote ${path.relative(process.cwd(), outPath)}`);
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exitCode = 1;
});
