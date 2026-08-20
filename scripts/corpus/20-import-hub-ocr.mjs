#!/usr/bin/env node
// scripts/corpus/20-import-hub-ocr.mjs
//
// Exports already-OCR'd secondary sources out of the dissertation-hub SQLite
// database into the corpus's on-disk page format. These books were transcribed
// with Google Document AI months ago, so reusing them costs nothing and skips
// a large slice of the OCR budget.
//
// WHAT IT READS, AND WHAT IT DELIBERATELY IGNORES
// -----------------------------------------------
// Source of truth is `hub_ocr_pages` — one row per physical page, carrying the
// page number, the Document AI text and a per-page confidence. That is exactly
// the shape corpus.pages needs.
//
// It does NOT read `hub_document_chunks`. Those chunks have NULL page_start /
// page_end, and their char offsets no longer line up with the stored document
// text (measured on doc 67: 1,605 of 1,656 chunks fail a slice check). Chunking
// is cheap to redo and offsets are the foundation of every citation, so the
// corpus rebuilds them from page text with its own verified invariant instead
// of importing offsets it cannot trust.
//
// The hub's live hub_database.db is 0 bytes; the newest complete data is in the
// dated .bak files, so this defaults to the newest backup it can find.
//
// Usage:
//   node scripts/corpus/20-import-hub-ocr.mjs --list
//   node scripts/corpus/20-import-hub-ocr.mjs --doc 67
//   node scripts/corpus/20-import-hub-ocr.mjs --all [--dest <dir>] [--dry-run]

import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const HUB_DIR = "C:/Users/alber/OneDrive/Desktop/Coding/dissertation-hub";
const DEFAULT_DEST = path.resolve(process.cwd(), "data/corpus/ocr");

function parseArgs(argv) {
  const args = {
    docs: [],
    dest: DEFAULT_DEST,
    list: false,
    all: false,
    dryRun: false,
    db: null,
    // hub document id -> corpus slug, so imported sources carry the same slug
    // as the catalogue entry on /our-collections/nghien-cuu-han-nom
    slugFor: new Map(),
  };
  for (let i = 2; i < argv.length; i++) {
    const flag = argv[i];
    if (flag === "--list") args.list = true;
    else if (flag === "--all") args.all = true;
    else if (flag === "--dry-run") args.dryRun = true;
    else if (flag === "--doc") args.docs.push(Number(argv[++i]));
    else if (flag === "--dest") args.dest = path.resolve(argv[++i]);
    else if (flag === "--db") args.db = argv[++i];
    else if (flag === "--map") {
      // JSON array of { slug, docId } — the reviewed catalogue match.
      const entries = JSON.parse(fs.readFileSync(argv[++i], "utf8"));
      for (const entry of entries) {
        args.docs.push(Number(entry.docId));
        args.slugFor.set(Number(entry.docId), entry.slug);
      }
    } else if (flag === "--help" || flag === "-h") args.list = args.help = true;
    else throw new Error(`Unknown flag: ${flag}`);
  }
  return args;
}

/** The live DB is empty; pick the newest dated backup instead. */
function resolveDatabase(explicit) {
  if (explicit) return explicit;

  const live = path.join(HUB_DIR, "hub_database.db");
  if (fs.existsSync(live) && fs.statSync(live).size > 0) return live;

  const backups = fs
    .readdirSync(HUB_DIR)
    .filter((name) => /^hub_database\.bak-.*\.db$/.test(name))
    .map((name) => ({ name, size: fs.statSync(path.join(HUB_DIR, name)).size }))
    .filter((entry) => entry.size > 0)
    .sort((a, b) => b.name.localeCompare(a.name));

  if (backups.length === 0) {
    throw new Error(`No usable hub database found in ${HUB_DIR}`);
  }
  return path.join(HUB_DIR, backups[0].name);
}

/** Stable, filesystem- and URL-safe slug from a Vietnamese title. */
export function slugify(title) {
  return (title || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function attachmentKeyOf(notes) {
  const match = /zotero:[^:]+:(\w+)/.exec(notes || "");
  return match ? match[1] : null;
}

function loadDocuments(db) {
  const pageStats = new Map();
  for (const row of db
    .prepare(
      `select attachment_key, count(*) n, avg(confidence) conf, sum(length(text)) chars
       from hub_ocr_pages group by attachment_key`
    )
    .all()) {
    pageStats.set(row.attachment_key, row);
  }

  return db
    .prepare(
      `select id, title, author, year, notes, ocr_method, filename, original_path
       from hub_documents order by id`
    )
    .all()
    .map((doc) => {
      const attachmentKey = attachmentKeyOf(doc.notes);
      const stats = attachmentKey ? pageStats.get(attachmentKey) : null;
      return {
        ...doc,
        attachmentKey,
        pageCount: stats?.n ?? 0,
        meanConfidence: stats?.conf ?? null,
        chars: stats?.chars ?? 0,
      };
    })
    .filter((doc) => doc.pageCount > 0);
}

function exportDocument(db, doc, dest, dryRun, slugOverride) {
  const slug = slugOverride || slugify(doc.title);
  const bookDir = path.join(dest, slug);
  const pagesDir = path.join(bookDir, "pages");

  const rows = db
    .prepare(
      `select page_number, text, confidence, method
       from hub_ocr_pages where attachment_key = ? order by page_number`
    )
    .all(doc.attachmentKey);

  // hub page numbers are 0-based; the corpus is 1-based throughout.
  const pages = rows.map((row, index) => ({
    pageNumber: index + 1,
    hubPageNumber: row.page_number,
    text: (row.text ?? "").normalize("NFC"),
    confidence: row.confidence ?? null,
    method: row.method ?? doc.ocr_method ?? "documentai",
  }));

  const nonEmpty = pages.filter((page) => page.text.trim().length > 0).length;
  const manifest = {
    slug,
    title: doc.title,
    author: doc.author || null,
    year: doc.year || null,
    sourceType: "secondary",
    provenance: "documentai",
    pageCount: pages.length,
    pagesWithText: nonEmpty,
    meanConfidence: doc.meanConfidence,
    totalChars: pages.reduce((sum, page) => sum + page.text.length, 0),
    origin: {
      hubDocumentId: doc.id,
      zoteroAttachmentKey: doc.attachmentKey,
      pdfPath: doc.original_path || null,
      pdfFilename: doc.filename || null,
    },
    exportedAt: new Date().toISOString(),
  };

  if (dryRun) return { slug, manifest, written: 0 };

  fs.mkdirSync(pagesDir, { recursive: true });
  for (const page of pages) {
    const file = path.join(pagesDir, `${String(page.pageNumber).padStart(4, "0")}.json`);
    fs.writeFileSync(file, JSON.stringify(page, null, 1));
  }
  fs.writeFileSync(path.join(bookDir, "manifest.json"), JSON.stringify(manifest, null, 2));

  return { slug, manifest, written: pages.length };
}

function main() {
  const args = parseArgs(process.argv);
  const dbPath = resolveDatabase(args.db);
  const db = new DatabaseSync(dbPath, { readOnly: true });

  console.log(`hub database: ${path.basename(dbPath)}`);
  const documents = loadDocuments(db);

  if (args.list || (!args.all && args.docs.length === 0)) {
    console.log(`\n${documents.length} documents have per-page OCR:\n`);
    let total = 0;
    for (const doc of documents) {
      total += doc.pageCount;
      const confidence = doc.meanConfidence ? doc.meanConfidence.toFixed(3) : "  —  ";
      console.log(
        `  ${String(doc.id).padStart(3)}  ${String(doc.pageCount).padStart(4)} pg  ` +
          `conf ${confidence}  ${(doc.title || "").slice(0, 58)}`
      );
    }
    console.log(`\n  ${total} pages total`);
    if (!args.list) console.log("\nPass --doc <id> or --all to export.");
    return;
  }

  const selected = args.all
    ? documents
    : documents.filter((doc) => args.docs.includes(doc.id));

  if (selected.length === 0) {
    console.error(`No document matched ${args.docs.join(", ")} (try --list)`);
    process.exitCode = 1;
    return;
  }

  console.log(`\nexporting ${selected.length} document(s) to ${args.dest}${args.dryRun ? " (dry run)" : ""}\n`);
  let pagesWritten = 0;
  for (const doc of selected) {
    const result = exportDocument(db, doc, args.dest, args.dryRun, args.slugFor.get(doc.id));
    pagesWritten += result.written;
    console.log(
      `  ${result.slug}\n` +
        `    ${result.manifest.pageCount} pages, ${result.manifest.pagesWithText} with text, ` +
        `${result.manifest.totalChars.toLocaleString()} chars, conf ${
          result.manifest.meanConfidence?.toFixed(3) ?? "—"
        }`
    );
  }
  console.log(`\ndone — ${pagesWritten} page files written`);
}

main();
