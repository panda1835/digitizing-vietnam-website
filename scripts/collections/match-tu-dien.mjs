#!/usr/bin/env node
// scripts/collections/match-tu-dien.mjs
//
// Regenerates the Từ điển Matches: which Proverb Entries of Kho tàng tục ngữ
// carry the same saying as a Từ điển Entry on the site's Từ điển page.
// Vocabulary: GLOSSARY.md.
//
// Usage:
//   node scripts/collections/match-tu-dien.mjs
//
// Also writes a report of the approximate matches and the unmatched
// candidates to .scratch/kho-tang-tu-dien-matches/report.md, for checking
// SIMILARITY_THRESHOLD by hand before committing the matches file.
//
// Tests: node --test scripts/collections/*.test.mjs

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** Lowercase, without tone marks, diacritics or punctuation: "Đầu, cành!" → "dau canh". */
function foldText(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Kho's abbreviations for the two volumes of the book the Từ điển page publishes. */
const VC_ABBREVIATIONS = ["VC I", "VC II"];

function citationsIncludeVc(citations) {
  return citations.some((c) => VC_ABBREVIATIONS.includes(c.abbreviation));
}

/** The texts of a Proverb Entry that cite VC: the proverb itself and/or its Variants. */
function candidates(entry) {
  const texts = [];
  if (citationsIncludeVc(entry.citations)) texts.push(entry.proverb);
  for (const variant of entry.variants) {
    if (citationsIncludeVc(variant.citations)) {
      texts.push(variant.text.map((run) => run.text).join(""));
    }
  }
  return texts;
}

/**
 * The folded texts a Từ điển Entry matches exactly: the whole entry, and each
 * of its lines when it has several (e.g. a parenthesised alternative wording
 * on its own line). Words in parentheses inside a line, as in "Ai chết
 * trước (thì) được ấm mồ.", are optional: each text matches with and
 * without them.
 */
function tuDienKeys(tuDienEntry) {
  const lines = tuDienEntry.poem.split("\n");
  return [tuDienEntry.poem, ...(lines.length > 1 ? lines : [])]
    .flatMap((text) => [text, text.replace(/\([^()\n]*\)/g, " ")])
    .map(foldText)
    .filter(Boolean);
}

/** Folded text → ids of the Từ điển Entries it matches, in their order. */
function indexByKey(tuDienEntries) {
  const index = new Map();
  for (const t of tuDienEntries) {
    for (const key of new Set(tuDienKeys(t))) {
      if (!index.has(key)) index.set(key, []);
      index.get(key).push(t.id);
    }
  }
  return index;
}

/**
 * The least similarity an approximate match needs, from 0 (nothing in
 * common) to 1 (the same folded text). Tuned by reading the report.
 */
const SIMILARITY_THRESHOLD = 0.85;

/** Levenshtein distance: the fewest character edits turning `a` into `b`. */
function editDistance(a, b) {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    previous = current;
  }
  return previous[b.length];
}

/**
 * How alike two folded texts are, by characters rather than whole words, so
 * that one changed word in a short saying ("lấn cành" / "lấn ngành") still
 * counts as close. Below the threshold returns 0 without the full comparison.
 */
function similarity(a, b) {
  const longest = Math.max(a.length, b.length);
  // The distance is at least the difference in length.
  if (1 - Math.abs(a.length - b.length) / longest < SIMILARITY_THRESHOLD) return 0;
  return 1 - editDistance(a, b) / longest;
}

/** The Từ điển Entry most like the folded text, if any reaches the threshold. */
function closest(key, keyedEntries) {
  let best = null;
  for (const { entry, keys } of keyedEntries) {
    for (const tuDienKey of keys) {
      const score = similarity(key, tuDienKey);
      if (score >= SIMILARITY_THRESHOLD && (!best || score > best.similarity)) {
        best = { entry, similarity: score };
      }
    }
  }
  return best;
}

/**
 * Each candidate text of the Proverb Entries, in book order, with the Từ điển
 * Entries it matches: every exact match, or else the closest approximate one.
 */
function matchCandidates(proverbEntries, tuDienByLetter) {
  const all = Object.values(tuDienByLetter).flat();
  const byId = new Map(all.map((t) => [t.id, t]));
  const letterById = new Map(
    Object.entries(tuDienByLetter).flatMap(([letter, entries]) =>
      entries.map((t) => [t.id, letter])
    )
  );
  const searchable = (entries) => ({
    index: indexByKey(entries),
    keyed: entries.map((entry) => ({ entry, keys: tuDienKeys(entry) })),
  });
  const byLetter = Object.fromEntries(
    Object.entries(tuDienByLetter).map(([letter, entries]) => [letter, searchable(entries)])
  );
  const everywhere = searchable(all);

  /** Searches the candidate's letter first, then every Từ điển Entry. */
  const search = (key, find) => {
    // The Từ điển page files Đ under D, as folding does.
    const scope = byLetter[key.charAt(0).toUpperCase()];
    return (scope && find(scope)) ?? find(everywhere);
  };

  const results = [];
  for (const entry of proverbEntries) {
    for (const text of candidates(entry)) {
      const key = foldText(text);
      const exact = search(key, ({ index }) => index.get(key));
      const nearest = exact ? null : search(key, ({ keyed }) => closest(key, keyed));
      const matches = exact
        ? exact.map((id) => ({ tuDienEntry: byId.get(id), kind: "exact" }))
        : nearest
          ? [{ tuDienEntry: nearest.entry, kind: "approximate", similarity: nearest.similarity }]
          : [];
      for (const match of matches) match.letter = letterById.get(match.tuDienEntry.id);
      results.push({ anchor: entry.anchor, text, matches });
    }
  }
  return results;
}

/**
 * The matches file's contract: Từ điển Matches keyed by anchor, only matched
 * anchors, each naming the letter file its Từ điển Entry is filed under.
 */
function toMatchesFile(results) {
  const byAnchor = {};
  for (const { anchor, matches } of results) {
    for (const { tuDienEntry, kind, letter } of matches) {
      const list = (byAnchor[anchor] ??= []);
      const existing = list.find((m) => m.id === tuDienEntry.id);
      // An exact match wins when another candidate found the same entry approximately.
      if (!existing) list.push({ id: tuDienEntry.id, kind, letter });
      else if (kind === "exact") existing.kind = "exact";
    }
  }
  return byAnchor;
}

/**
 * The Từ điển Matches of the Proverb Entries, keyed by anchor. Only matched
 * anchors appear.
 *
 * @param proverbEntries Proverb Entries, in book order.
 * @param tuDienByLetter Từ điển Entries, keyed by the letter file they're filed under.
 */
export function matchTuDien(proverbEntries, tuDienByLetter) {
  return toMatchesFile(matchCandidates(proverbEntries, tuDienByLetter));
}

/**
 * The report for checking the threshold by hand: every approximate match side
 * by side, then every candidate left unmatched.
 */
function formatReport(results) {
  const approximate = results.flatMap(({ anchor, text, matches }) =>
    matches
      .filter((m) => m.kind === "approximate")
      .map((m) => ({ anchor, text, ...m }))
  );
  const unmatched = results.filter((r) => r.matches.length === 0);
  const oneLine = (text) => text.replace(/\s*\n\s*/g, " / ");

  return [
    "# Từ điển Matches: report",
    "",
    `Written by scripts/collections/match-tu-dien.mjs. Similarity threshold: ${SIMILARITY_THRESHOLD}.`,
    "",
    `## Approximate matches (${approximate.length})`,
    "",
    "Kho text, then the Từ điển Entry it was matched to. Lowest similarity first.",
    "",
    ...approximate
      .sort((a, b) => a.similarity - b.similarity)
      .flatMap((m) => [
        `- ${m.anchor} (${m.similarity.toFixed(3)})`,
        `  - Kho:     ${oneLine(m.text)}`,
        `  - Từ điển: ${oneLine(m.tuDienEntry.poem)} [${m.tuDienEntry.id}]`,
      ]),
    "",
    `## Unmatched candidates (${unmatched.length})`,
    "",
    ...unmatched.map((r) => `- ${r.anchor}: ${oneLine(r.text)}`),
    "",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// The command: reads both exports and writes the matches file and the report.
// The Kho export's folder is only read, since it is replaced wholesale on
// each export.

const KHO_LETTERS = "public/data/kho-tang-tuc-ngu/letters";
const TU_DIEN_LETTERS = "public/data/ca-dao-tuc-ngu/letters";
const OUT = "public/data/ca-dao-tuc-ngu-links/tu-dien-matches.json";
/** Git-ignored, next to the spec. */
const REPORT = ".scratch/kho-tang-tu-dien-matches/report.md";

/** The book's letters, in its order, as in the Kho data module's ALPHABET. */
const KHO_ALPHABET = [
  "A", "Ă", "Â", "B", "C", "D", "Đ", "E", "Ê", "G", "H", "I", "K", "L", "M",
  "N", "O", "Ô", "Ơ", "P", "Q", "R", "S", "T", "U", "Ư", "V", "X", "Y",
];

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function main() {
  const proverbEntries = KHO_ALPHABET.flatMap((letter) => {
    const file = path.join(KHO_LETTERS, `${letter}.json`);
    return fs.existsSync(file) ? readJson(file) : [];
  });
  const tuDienByLetter = Object.fromEntries(
    fs
      .readdirSync(TU_DIEN_LETTERS)
      .filter((f) => f.endsWith(".json"))
      .map((f) => [
        path.basename(f, ".json").normalize("NFC"),
        readJson(path.join(TU_DIEN_LETTERS, f)),
      ])
  );

  const results = matchCandidates(proverbEntries, tuDienByLetter);
  const matches = toMatchesFile(results);

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(matches, null, 2) + "\n");
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, formatReport(results));

  const citing = proverbEntries.filter((e) => candidates(e).length > 0);
  const linked = Object.values(matches).flat().length;
  console.log(
    `${Object.keys(matches).length} of ${citing.length} Proverb Entries citing VC matched ` +
      `(${linked} Từ điển Matches); wrote ${OUT} and ${REPORT}`
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
