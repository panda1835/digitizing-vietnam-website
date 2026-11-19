import { createHash } from "crypto";
import { getCorpus, provenance, type Verse } from "./corpus";
import {
  editions,
  type Edition,
  type ConcordanceInput,
  type FrequencyInput,
  type CompareInput,
  type NomVariantsInput,
  type ResearchRequest,
} from "./schemas";

export class ResearchError extends Error {
  constructor(public code: string, public status = 400) {
    super(code);
  }
}
const hash = (value: unknown) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
type Normalization = {
  caseSensitive: boolean;
  diacriticSensitive: boolean;
  script: "nom" | "quocNgu";
};
export function normalize(value: string, settings: Normalization) {
  let result = value.normalize("NFC");
  if (!settings.caseSensitive) result = result.toLocaleLowerCase("vi");
  if (!settings.diacriticSensitive && settings.script === "quocNgu")
    result = result
      .normalize("NFD")
      .replace(new RegExp("\\p{M}", "gu"), "")
      .replace(/đ/g, "d")
      .replace(/Đ/g, "D");
  return result;
}
// Map normalized matches back to original UTF-16 offsets, including combining accents
// and supplementary-plane Nôm characters. No normalized text replaces source text.
function searchable(value: string, settings: Normalization) {
  let normalized = "";
  const starts: number[] = [],
    ends: number[] = [];
  for (const part of Array.from(
    new Intl.Segmenter("vi", { granularity: "grapheme" }).segment(value)
  )) {
    const folded = normalize(part.segment, settings);
    normalized += folded;
    for (let i = 0; i < folded.length; i++) {
      starts.push(part.index);
      ends.push(part.index + part.segment.length);
    }
  }
  return { normalized, starts, ends };
}
const word = (value: string | undefined) =>
  !!value && new RegExp("[\\p{L}\\p{M}\\p{N}]", "u").test(value);
export function findMatches(value: string, settings: ConcordanceInput) {
  const { normalized, starts, ends } = searchable(value, settings);
  const needles = Array.from(
    new Set(
      [settings.query, ...settings.variants].map((q) => normalize(q, settings))
    )
  );
  const matches = new Map<
    string,
    { start: number; end: number; text: string; forms: string[] }
  >();
  for (const needle of needles) {
    if (!needle) continue;
    let offset = 0;
    while (offset <= normalized.length - needle.length) {
      const index = normalized.indexOf(needle, offset);
      if (index < 0) break;
      const end = index + needle.length;
      const before = Array.from(normalized.slice(0, index)).pop();
      const after = Array.from(normalized.slice(end))[0];
      if (settings.match === "substring" || (!word(before) && !word(after))) {
        const startOffset = starts[index],
          endOffset = ends[end - 1];
        const key = `${startOffset}:${endOffset}`;
        const found = matches.get(key);
        if (found) found.forms.push(needle);
        else
          matches.set(key, {
            start: startOffset,
            end: endOffset,
            text: value.slice(startOffset, endOffset),
            forms: [needle],
          });
      }
      // Include overlapping occurrences; identical spans from variant queries count once.
      offset = index + (normalized.codePointAt(index)! > 0xffff ? 2 : 1);
    }
  }
  return Array.from(matches.values()).sort(
    (a, b) => a.start - b.start || a.end - b.end
  );
}
export function paginate<T>(
  rows: T[],
  settings: { pageSize: number; cursor: string | null },
  fingerprint: string
) {
  let offset = 0;
  if (settings.cursor) {
    try {
      const cursor = JSON.parse(
        Buffer.from(settings.cursor, "base64url").toString("utf8")
      );
      if (
        cursor.fingerprint !== fingerprint ||
        !Number.isSafeInteger(cursor.offset) ||
        cursor.offset < 1 ||
        cursor.offset >= rows.length
      )
        throw new Error();
      offset = cursor.offset;
    } catch {
      throw new ResearchError("invalid-cursor");
    }
  }
  const end = offset + settings.pageSize;
  return {
    results: rows.slice(offset, end),
    nextCursor:
      end < rows.length
        ? Buffer.from(JSON.stringify({ offset: end, fingerprint })).toString(
            "base64url"
          )
        : null,
  };
}
export async function listEditions() {
  return {
    provenance: await provenance(),
    editions: await Promise.all(
      editions.map(async (edition) => {
        const corpus = await getCorpus(edition);
        return {
          edition,
          title: corpus.title,
          publicationDate: corpus.publicationDate,
          totalPages: corpus.totalPages,
          totalVerses: corpus.verses.length,
          scripts: ["nom", "quocNgu"],
          revision: corpus.revision,
          sourceUrl: `/en/our-collections/truyen-kieu/truyen-kieu-${edition}`,
          transcriptionResponsibility: null,
          license: null,
          metadataNotice:
            "Bibliography is limited to the supplied TEI header; missing attribution and rights are unknown.",
        };
      })
    ),
  };
}
export async function getVerses(
  edition: Edition,
  input: { from: number; to: number }
) {
  const corpus = await getCorpus(edition);
  const verses = corpus.verses.filter(
    (v) =>
      v.numericNumber !== null &&
      v.numericNumber >= input.from &&
      v.numericNumber <= input.to
  );
  return {
    provenance: await provenance([edition]),
    settings: { edition, ...input },
    verses,
    pageNotes: corpus.pageNotes.filter((p) =>
      verses.some((v) => v.page === p.page)
    ),
    numbering:
      "Source labels are preserved. Numeric ranges include suffixed labels (534 includes 534b). Missing labels are not reconstructed.",
  };
}
export async function concordance(input: ConcordanceInput, complete = false) {
  const meta = await provenance(input.editions);
  const settings = { ...input, cursor: null };
  const occurrences: {
    verse: Verse;
    index: number;
    match: ReturnType<typeof findMatches>[number];
  }[] = [];
  const byEdition: Record<
    string,
    { occurrences: number; matchingVerses: number }
  > = {};
  for (const edition of input.editions) {
    const corpus = await getCorpus(edition);
    const counts = { occurrences: 0, matchingVerses: 0 };
    byEdition[edition] = counts;
    for (const [index, verse] of Array.from(corpus.verses.entries())) {
      const matches = findMatches(verse[input.script], input);
      if (matches.length) counts.matchingVerses++;
      counts.occurrences += matches.length;
      for (const match of matches) occurrences.push({ verse, index, match });
    }
  }
  if (complete && occurrences.length > 10000)
    throw new ResearchError("export-too-large-narrow-query", 413);
  const fingerprint = hash({ meta, settings });
  const page = complete
    ? { results: occurrences, nextCursor: null }
    : paginate(occurrences, input, fingerprint);
  const results = await Promise.all(
    page.results.map(async ({ verse, index, match }) => {
      const corpus = await getCorpus(verse.edition);
      return {
        ...verse,
        match,
        kwic: {
          left: verse[input.script].slice(0, match.start),
          keyword: match.text,
          right: verse[input.script].slice(match.end),
        },
        context: {
          before: corpus.verses.slice(
            Math.max(0, index - input.contextVerses),
            index
          ),
          after: corpus.verses.slice(
            index + 1,
            index + 1 + input.contextVerses
          ),
        },
      };
    })
  );
  return {
    provenance: meta,
    settings,
    totalOccurrences: occurrences.length,
    totalMatchingVerses: Object.values(byEdition).reduce(
      (sum, c) => sum + c.matchingVerses,
      0
    ),
    byEdition,
    results,
    nextCursor: page.nextCursor,
    matchingPolicy:
      "Literal, NFC-normalized, within individual verses; overlapping occurrences included. Phrase/token boundaries use Unicode letters, marks and numbers. Context can cross pages; phrases do not cross verses. Variant queries with identical spans count once. Counts across editions are separate witnesses, not unique passages.",
  };
}
export async function frequencies(
  edition: Edition,
  input: FrequencyInput,
  complete = false
) {
  const corpus = await getCorpus(edition),
    meta = await provenance([edition]);
  const counts = new Map<
    string,
    {
      form: string;
      count: number;
      verseIds: Set<string>;
      originals: Map<string, number>;
    }
  >();
  let totalUnits = 0;
  for (const verse of corpus.verses) {
    const original = verse[input.script];
    const units =
      input.unit === "character"
        ? Array.from(
            new Intl.Segmenter("vi", { granularity: "grapheme" }).segment(
              original
            )
          )
            .map((s) => s.segment)
            .filter((s) => new RegExp("[\\p{L}\\p{N}]", "u").test(s))
        : original.match(new RegExp("[\\p{L}\\p{M}\\p{N}]+", "gu")) ?? [];
    for (const unit of units) {
      const form = normalize(unit, input);
      const entry = counts.get(form) ?? {
        form,
        count: 0,
        verseIds: new Set<string>(),
        originals: new Map<string, number>(),
      };
      entry.count++;
      totalUnits++;
      entry.verseIds.add(verse.id);
      entry.originals.set(unit, (entry.originals.get(unit) ?? 0) + 1);
      counts.set(form, entry);
    }
  }
  const rows = Array.from(counts.values())
    .filter((e) => e.count >= input.minCount)
    .sort(
      (a, b) =>
        b.count - a.count || (a.form < b.form ? -1 : a.form > b.form ? 1 : 0)
    )
    .map((e) => ({
      form: e.form,
      count: e.count,
      matchingVerses: e.verseIds.size,
      originals: Array.from(e.originals).map(([form, count]) => ({
        form,
        count,
      })),
    }));
  const settings = { edition, ...input, cursor: null };
  const page = complete
    ? { results: rows, nextCursor: null }
    : paginate(rows, input, hash({ meta, settings }));
  return {
    provenance: meta,
    settings,
    totalUnits,
    totalForms: rows.length,
    ...page,
    tokenization:
      input.unit === "character"
        ? "Unicode grapheme clusters containing letters or numbers; punctuation and spaces excluded"
        : "Contiguous Unicode letters, marks and numbers; punctuation separates syllables. No linguistic word segmentation is claimed.",
  };
}
// LCS over Unicode code points, preserving whitespace and supplementary characters.
export function diffText(before: string, after: string) {
  const a = Array.from(before),
    b = Array.from(after);
  const table = Array.from(
    { length: a.length + 1 },
    () => new Uint16Array(b.length + 1)
  );
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      table[i][j] =
        a[i] === b[j]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
  const result: { operation: "equal" | "delete" | "insert"; text: string }[] =
    [];
  const push = (operation: "equal" | "delete" | "insert", text: string) => {
    const last = result[result.length - 1];
    if (last?.operation === operation) last.text += text;
    else result.push({ operation, text });
  };
  let i = 0,
    j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      push("equal", a[i++]);
      j++;
    } else if (
      i < a.length &&
      (j === b.length || table[i + 1][j] >= table[i][j + 1])
    )
      push("delete", a[i++]);
    else push("insert", b[j++]);
  }
  return result;
}
export async function compare(input: CompareInput) {
  const corpora = await Promise.all(input.editions.map(getCorpus));
  const selected = corpora.map((c) =>
    c.verses.filter(
      (v) =>
        v.numericNumber !== null &&
        v.numericNumber >= input.from &&
        v.numericNumber <= input.to
    )
  );
  const labels = Array.from(
    new Set(selected.flatMap((v) => v.map((l) => l.number)))
  ).sort((a, b) => parseInt(a) - parseInt(b) || (a < b ? -1 : a > b ? 1 : 0));
  return {
    provenance: await provenance(input.editions),
    settings: input,
    alignment: {
      method: "source-verse-label",
      verified: false,
      notice:
        "Matching source labels are provisional correspondences, not verified textual alignments. Missing readings are null. Insertions, omissions and renumbering require editorial review.",
    },
    baselineEdition: input.editions[0],
    rows: labels.map((number) => {
      const readings = selected.map((verses, index) => ({
        edition: input.editions[index],
        verse: verses.find((v) => v.number === number) ?? null,
      }));
      const baseline = readings[0].verse;
      return {
        number,
        readings: readings.map(({ edition, verse }) => ({
          edition,
          verse,
          status: !verse
            ? "missing"
            : !baseline
            ? "no-baseline"
            : verse[input.script] === baseline[input.script]
            ? "identical"
            : "different",
          diff:
            baseline && verse
              ? diffText(baseline[input.script], verse[input.script])
              : null,
        })),
      };
    }),
  };
}
export async function executeResearch(
  request: ResearchRequest
): Promise<unknown> {
  switch (request.operation) {
    case "editions":
      return listEditions();
    case "verses":
      return getVerses(request.edition, request.input);
    case "concordance":
      return concordance(request.input);
    case "frequencies":
      return frequencies(request.edition, request.input);
    case "compare":
      return compare(request.input);
    case "nom_variants":
      return nomVariants(request.input);
  }
}

export type NomVariantExample = { position: number; left: Verse; right: Verse };
export async function nomVariants(input: NomVariantsInput) {
  const [left, right] = await Promise.all([
    getCorpus(input.left),
    getCorpus(input.right),
  ]);
  const meta = await provenance([input.left, input.right]);
  const inRange = (v: Verse) =>
    v.numericNumber !== null &&
    v.numericNumber >= input.from &&
    v.numericNumber <= input.to;
  const leftVerses = left.verses.filter(inRange),
    rightVerses = right.verses.filter(inRange);
  const rightByLabel = new Map(rightVerses.map((v) => [v.number, v]));
  const leftLabels = new Set(leftVerses.map((v) => v.number));
  const counts = {
    leftVerses: leftVerses.length,
    rightVerses: rightVerses.length,
    sharedLabels: 0,
    missingInRight: 0,
    missingInLeft: rightVerses.filter((v) => !leftLabels.has(v.number)).length,
    differentTranscriptions: 0,
    unalignableGlyphCounts: 0,
    eligibleVersePairs: 0,
    comparedSyllablePairs: 0,
    differingSyllablePairs: 0,
  };
  const groups = new Map<
    string,
    {
      syllable: string;
      leftNom: string;
      rightNom: string;
      count: number;
      examples: NomVariantExample[];
    }
  >();
  const fold = (s: string) => s.normalize("NFC").toLocaleLowerCase("vi");
  const syllables = (s: string) =>
    s.match(new RegExp("[\\p{L}\\p{M}]+", "gu")) ?? [];
  const glyphs = (s: string) =>
    Array.from(new Intl.Segmenter("vi", { granularity: "grapheme" }).segment(s))
      .map((g) => g.segment)
      .filter((g) => new RegExp("[\\p{L}\\p{N}]", "u").test(g));
  for (const a of leftVerses) {
    const b = rightByLabel.get(a.number);
    if (!b) {
      counts.missingInRight++;
      continue;
    }
    counts.sharedLabels++;
    const av = syllables(a.quocNgu).map(fold),
      bv = syllables(b.quocNgu).map(fold);
    if (
      !av.length ||
      av.length !== bv.length ||
      av.some((v, i) => v !== bv[i])
    ) {
      counts.differentTranscriptions++;
      continue;
    }
    const an = glyphs(a.nom),
      bn = glyphs(b.nom);
    if (an.length !== av.length || bn.length !== bv.length) {
      counts.unalignableGlyphCounts++;
      continue;
    }
    counts.eligibleVersePairs++;
    for (let i = 0; i < av.length; i++) {
      if (input.term !== null && av[i] !== fold(input.term)) continue;
      counts.comparedSyllablePairs++;
      if (an[i].normalize("NFC") === bn[i].normalize("NFC")) continue;
      counts.differingSyllablePairs++;
      const key = JSON.stringify([av[i], an[i], bn[i]]);
      const group = groups.get(key) ?? {
        syllable: av[i],
        leftNom: an[i],
        rightNom: bn[i],
        count: 0,
        examples: [],
      };
      group.count++;
      if (group.examples.length < input.examplesPerVariant)
        group.examples.push({ position: i + 1, left: a, right: b });
      groups.set(key, group);
    }
  }
  const rows = Array.from(groups.values())
    .filter((g) => g.count >= input.minOccurrences)
    .sort(
      (a, b) =>
        b.count - a.count ||
        (JSON.stringify([a.syllable, a.leftNom, a.rightNom]) <
        JSON.stringify([b.syllable, b.leftNom, b.rightNom])
          ? -1
          : 1)
    );
  const settings = { ...input, cursor: null };
  return {
    provenance: meta,
    settings,
    counts,
    totalVariantGroups: rows.length,
    totalSyllablesWithVariants: new Set(rows.map((g) => g.syllable)).size,
    ...paginate(rows, input, hash({ meta, settings })),
    method: {
      verified: false,
      alignment:
        "Exact source verse label, identical NFC/case-normalized quốc ngữ syllable sequences, then positional pairing only when each script has the same number of units.",
      limitations: [
        "These are candidate orthographic syllable correspondences, not verified word readings or semantic equivalence.",
        "Verses with different transcriptions, missing labels, or unequal Nôm/syllable counts are excluded and reported in counts.",
        "Differences are encoded Unicode graphemes, not proof of distinct historical glyph shapes; verify source scans.",
        "Results cover only the available transcriptions and the chosen range; displayed groups and examples can be paginated or sampled.",
      ],
    },
  };
}
