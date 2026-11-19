import fs from "fs/promises";
import path from "path";
import { createHash } from "crypto";
import { parseStringPromise } from "xml2js";
import { editions, editionSchema, type Edition } from "./schemas";

export type Annotation = {
  id: string | null;
  noteIds: string[];
  text: string;
  start: number;
  end: number;
};
export type Note = { id: string | null; targets: string[]; text: string };
export type Verse = {
  id: string;
  edition: Edition;
  number: string;
  numericNumber: number | null;
  page: number;
  pageLabel: string;
  nom: string;
  quocNgu: string;
  annotations: { nom: Annotation[]; quocNgu: Annotation[] };
  notes: Note[];
  sourceUrl: string;
  scanUrl: string | null;
};
const cache = new Map<Edition, Promise<Corpus>>();
function text(node: any): string {
  if (typeof node === "string") return node;
  if (node?.$$) return node.$$.map(text).join("");
  return node?._ ?? "";
}
const refs = (value = "") =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s.replace(/^#/, ""));
function annotations(node: any): Annotation[] {
  const result: Annotation[] = [];
  const leading = text(node).length - text(node).trimStart().length;
  let offset = 0;
  function visit(n: any) {
    const start = offset;
    if (n?.$$) n.$$.forEach(visit);
    else offset += text(n).length;
    if (n?.["#name"] === "seg")
      result.push({
        id: n.$?.id ?? null,
        noteIds: refs(n.$?.corresp),
        text: text(n),
        start: Math.max(0, start - leading),
        end: Math.max(0, offset - leading),
      });
  }
  visit(node);
  return result;
}
export type Corpus = Awaited<ReturnType<typeof parseEdition>>;
async function parseEdition(edition: Edition) {
  const xml = await fs.readFile(
    path.join(process.cwd(), "data/truyen-kieu", `Kieu${edition}.xml`),
    "utf8"
  );
  const revision = createHash("sha256").update(xml).digest("hex");
  const parsed = await parseStringPromise(xml, {
    explicitChildren: true,
    preserveChildrenOrder: true,
    charsAsChildren: true,
    includeWhiteChars: true,
  });
  const header = parsed.TEI.teiHeader?.[0]?.fileDesc?.[0];
  const pages = parsed.TEI.text[0].body[0].page;
  const verses: Verse[] = [];
  const pageNotes: { page: number; notes: Note[] }[] = [];
  for (const [index, page] of pages.entries()) {
    const notes: Note[] = (page.noteg ?? []).flatMap((g: any) =>
      (g.note ?? []).map((n: any) => ({
        id: n.$?.id ?? null,
        targets: refs(n.$?.target),
        text: text(n).trim(),
      }))
    );
    pageNotes.push({ page: index + 1, notes });
    const lines = (type: string): any[] =>
      (page.div ?? [])
        .filter((d: any) => d.$?.type === type)
        .flatMap((d: any) => (d.lg ?? []).flatMap((g: any) => g.l ?? []));
    const nom = lines("text"),
      latin = lines("transliteration");
    const numbers = Array.from(
      new Set<string>(
        [...nom, ...latin].map((l: any) => l.$?.n).filter(Boolean)
      )
    );
    for (const number of numbers) {
      const n = nom.find((l) => l.$?.n === number),
        q = latin.find((l) => l.$?.n === number);
      const a = { nom: annotations(n), quocNgu: annotations(q) };
      const segments = [...a.nom, ...a.quocNgu];
      verses.push({
        id: `kieu:${edition}:page:${index + 1}:verse:${number}`,
        edition,
        number,
        numericNumber: /^\d+[a-z]*$/i.test(number)
          ? parseInt(number, 10)
          : null,
        page: index + 1,
        pageLabel: page.$?.n ?? String(index + 1),
        nom: text(n).trim(),
        quocNgu: text(q).trim(),
        annotations: a,
        notes: notes.filter((note) =>
          segments.some(
            (s) =>
              (note.id !== null && s.noteIds.includes(note.id)) ||
              (s.id !== null && note.targets.includes(s.id))
          )
        ),
        sourceUrl: `/en/our-collections/truyen-kieu/truyen-kieu-${edition}?page=${
          index + 1
        }`,
        scanUrl:
          page.$?.pi && page.$.pi !== "NA"
            ? `https://iiif.digitizingvietnam.com/iiif/2/truyen-kieu-${edition}/${encodeURIComponent(
                page.$.pi
              )}/full/full/0/default.jpg`
            : null,
      });
    }
  }
  return {
    edition,
    revision,
    xml,
    verses,
    pageNotes,
    totalPages: pages.length,
    title:
      text(header?.titleStmt?.[0]?.title?.[0]).trim() ||
      `Truyện Kiều ${edition}`,
    publicationDate:
      text(header?.publicationStmt?.[0]?.date?.[0]).trim() || null,
  };
}
export function getCorpus(edition: Edition) {
  editionSchema.parse(edition);
  if (!cache.has(edition)) {
    const pending = parseEdition(edition);
    cache.set(edition, pending);
    pending.catch(() => cache.delete(edition));
  }
  return cache.get(edition)!;
}
export async function provenance(selected: Edition[] = [...editions]) {
  const corpora = await Promise.all(selected.map(getCorpus));
  return {
    schemaVersion: "1",
    corpusRevision: createHash("sha256")
      .update(
        corpora
          .map((c) => `${c.edition}:${c.revision}`)
          .sort()
          .join("\n")
      )
      .digest("hex"),
    editions: Object.fromEntries(corpora.map((c) => [c.edition, c.revision])),
    offsets:
      "UTF-16 code units in the original returned text; end is exclusive",
  };
}
