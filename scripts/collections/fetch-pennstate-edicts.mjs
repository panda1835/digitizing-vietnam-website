#!/usr/bin/env node
// scripts/collections/fetch-pennstate-edicts.mjs
//
// Snapshots Penn State's "Collection of Vietnamese Edicts and Official Documents"
// out of CONTENTdm into a committed TypeScript file, mirroring the approach
// already used for HanNomColumbiaDLCMetadata.ts.
//
// WHY A SNAPSHOT RATHER THAN A LIVE FETCH
// ---------------------------------------
// The metadata is small (32 records) and effectively static — these are
// catalogue records for physical documents held since digitisation in 2026. A
// snapshot means the collection renders instantly, works offline, and cannot
// break because PSU changed an API. Re-run this script to refresh it.
//
// Images are NOT mirrored: the item pages point Mirador straight at PSU's IIIF,
// which both credits them as host and keeps the scans authoritative. Their IIIF
// sends `Access-Control-Allow-Origin: *`, so the browser can load it directly.
// (A HEAD request to that host returns 403 — a method quirk, not a block.)
//
// Rights: the collection is http://rightsstatements.org/vocab/NoC-US/1.0/
// (No Copyright – United States).
//
// Usage:
//   node scripts/collections/fetch-pennstate-edicts.mjs [--out <path>] [--dry-run]

import fs from "node:fs";
import path from "node:path";

const HOST = "https://digital.libraries.psu.edu";
const ALIAS = "vietscrolls";
const DMWS = `${HOST}/digital/bl/dmwebservices/index.php`;

const DEFAULT_OUT = path.resolve(
  process.cwd(),
  "src/app/[locale]/our-collections/vietnamese-edicts/_data/PennStateEdictsMetadata.ts"
);

/** CONTENTdm returns `{}` for empty fields rather than an empty string. */
function clean(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return "";
  return String(value).trim();
}

async function getJson(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (response.ok) return response.json();
    if (response.status >= 500 || response.status === 429) {
      await new Promise((r) => setTimeout(r, 2 ** attempt * 800));
      continue;
    }
    throw new Error(`${response.status} for ${url}`);
  }
  throw new Error(`gave up on ${url}`);
}

/**
 * Dynasty, reign era and document type are derived here rather than in the UI,
 * so the browse facets filter on real fields instead of re-parsing titles on
 * every render.
 *
 * Titles are uniformly shaped: "<Type> from the <Era> (<hán>) era of the
 * <Dynasty> dynasty".
 */
const LE_ERAS = new Set(["Dương Hòa", "Cảnh Hưng", "Chiêu Thống"]);

function derive(title) {
  const eraMatch = /from the\s+(.+?)\s*\(/u.exec(title || "");
  const era = eraMatch ? eraMatch[1].trim() : "";

  const dynastyMatch = /era of the\s+(.+?)\s+dynasty/u.exec(title || "");
  let dynasty = dynastyMatch ? dynastyMatch[1].trim() : "";
  if (!dynasty && era) dynasty = LE_ERAS.has(era) ? "Lê" : "Nguyễn";

  // Everything before " from the " is the document type.
  const typeMatch = /^(.+?)\s+from the\s/u.exec(title || "");
  const documentType = typeMatch ? typeMatch[1].trim() : "Document";

  return { era, dynasty, documentType };
}

function parseYear(iso, date) {
  const source = clean(iso) || clean(date);
  const match = /(\d{4})/.exec(source);
  return match ? Number(match[1]) : null;
}

/** Subjects arrive as a single "a; b; c" string. */
function splitList(value) {
  return clean(value)
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const outIndex = args.indexOf("--out");
  const outPath = outIndex !== -1 ? path.resolve(args[outIndex + 1]) : DEFAULT_OUT;

  console.log(`fetching ${ALIAS} from ${HOST}`);

  const query = await getJson(
    `${DMWS}?q=dmQuery/${ALIAS}/0/dmrecord/dmrecord/1000/0/1/0/0/0/json`
  );
  const pointers = query.records.map((record) => Number(record.dmrecord));
  console.log(`  ${query.pager.total} records\n`);

  const items = [];

  for (const pointer of pointers) {
    const [info, compound] = await Promise.all([
      getJson(`${DMWS}?q=dmGetItemInfo/${ALIAS}/${pointer}/json`),
      getJson(`${DMWS}?q=dmGetCompoundObjectInfo/${ALIAS}/${pointer}/json`).catch(() => null),
    ]);

    // Compound objects hold their scans as child pages; the IIIF image service
    // is keyed on the CHILD pointer while the manifest is keyed on the parent.
    const rawPages = compound?.page;
    const pages = Array.isArray(rawPages) ? rawPages : rawPages ? [rawPages] : [];
    const imagePointers = pages.map((page) => Number(page.pageptr)).filter(Number.isFinite);
    const firstImage = imagePointers[0] ?? pointer;

    const title = clean(info.title);
    const { era, dynasty, documentType } = derive(title);

    items.push({
      dmrecord: pointer,
      title,
      documentType,
      dynasty,
      era,
      date: clean(info.date),
      year: parseYear(info.iso, info.date),
      vietnameseDate: clean(info.vietna),
      dateNotes: clean(info.datea),
      creator: clean(info.creato),
      contributor: clean(info.contri),
      description: clean(info.descri),
      notes: clean(info.notes),
      physical: clean(info.physic),
      subjects: splitList(info.subjec),
      place: clean(info.place),
      language: clean(info.langua),
      repository: clean(info.reposi),
      container: clean(info.contai),
      rights: clean(info.rights),
      identifier: clean(info.dog),
      transcript: clean(info.transc),
      transcriptNotes: clean(info.transa),
      imagePointers,
      manifestUrl: `${HOST}/iiif/2/${ALIAS}:${pointer}/manifest.json`,
      thumbnailUrl: `${HOST}/iiif/2/${ALIAS}:${firstImage}/full/!400,400/0/default.jpg`,
      permalinkUrl: `${HOST}/digital/collection/${ALIAS}/id/${pointer}`,
    });

    process.stdout.write(
      `\r  ${items.length}/${pointers.length}  ${title.slice(0, 52).padEnd(52)}`
    );
  }

  process.stdout.write("\n\n");

  items.sort((a, b) => (a.year ?? 0) - (b.year ?? 0) || a.dmrecord - b.dmrecord);

  const withTranscript = items.filter((item) => item.transcript).length;
  const years = items.map((item) => item.year).filter(Boolean);
  console.log(`  ${items.length} items, ${withTranscript} with transcripts`);
  console.log(`  years ${Math.min(...years)}–${Math.max(...years)}`);
  console.log(
    `  dynasties: ${Object.entries(
      items.reduce((acc, item) => ({ ...acc, [item.dynasty]: (acc[item.dynasty] ?? 0) + 1 }), {})
    )
      .map(([k, v]) => `${k}=${v}`)
      .join(", ")}`
  );

  const file = `// ${path.relative(process.cwd(), outPath).replace(/\\\\/g, "/")}
//
// GENERATED FILE — do not edit by hand.
// Run: node scripts/collections/fetch-pennstate-edicts.mjs
//
// Snapshot of Penn State University Libraries' "Collection of Vietnamese Edicts
// and Official Documents" (CONTENTdm collection "${ALIAS}"), held by the Eberly
// Family Special Collections Library.
//
// Rights: http://rightsstatements.org/vocab/NoC-US/1.0/ (No Copyright – US).
// Scans are not mirrored; item pages load PSU's IIIF directly.
//
// Snapshot taken: ${new Date().toISOString().slice(0, 10)}

export interface PennStateEdictRecord {
  /** CONTENTdm parent record id — the stable identifier used in DVN URLs. */
  dmrecord: number;
  title: string;
  /** Derived from the title: Edict, Promotion, Military, Appointment, … */
  documentType: string;
  /** Derived: "Lê" or "Nguyễn". */
  dynasty: string;
  /** Derived reign era, e.g. "Tự Đức". */
  era: string;
  date: string;
  year: number | null;
  /** Date as counted in the Vietnamese calendar, e.g. "1-3-22". */
  vietnameseDate: string;
  dateNotes: string;
  creator: string;
  contributor: string;
  description: string;
  notes: string;
  physical: string;
  subjects: string[];
  place: string;
  language: string;
  repository: string;
  container: string;
  rights: string;
  identifier: string;
  /** Full Hán transcript of the document, where PSU recorded one. */
  transcript: string;
  /** PSU's notes on damage or illegible characters. */
  transcriptNotes: string;
  /** CONTENTdm child pointers — the IIIF image service is keyed on these. */
  imagePointers: number[];
  manifestUrl: string;
  thumbnailUrl: string;
  permalinkUrl: string;
}

export const PENN_STATE_EDICTS: ReadonlyArray<PennStateEdictRecord> = ${JSON.stringify(
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
