import type { ResearchEvidence } from "./agent-contracts";

export type Cell = string | number | null;
export type EvidenceTable = { columns: string[]; rows: Record<string, Cell>[] };
export type EvidenceSource = {
  id: string;
  edition: string;
  number: string;
  page: number;
  nom: string;
  quocNgu: string;
  sourceUrl: string;
  scanUrl?: string | null;
  notes?: { id?: string | null; text: string }[];
};
export function evidenceTable(evidence: ResearchEvidence): EvidenceTable {
  const data = evidence.result;
  switch (evidence.request.operation) {
    case "nom_variants":
      return {
        columns: ["syllable", "leftNom", "rightNom", "count", "verses"],
        rows: (data.results ?? []).map((r: any) => ({
          syllable: r.syllable,
          leftNom: r.leftNom,
          rightNom: r.rightNom,
          count: r.count,
          verses: r.examples
            .map(
              (e: any) =>
                `${e.left.number} (${e.left.edition}/${e.right.edition})`
            )
            .join(", "),
        })),
      };
    case "concordance":
      return {
        columns: ["edition", "verse", "left", "match", "right"],
        rows: (data.results ?? []).map((r: any) => ({
          edition: r.edition,
          verse: r.number,
          left: r.kwic.left,
          match: r.kwic.keyword,
          right: r.kwic.right,
        })),
      };
    case "frequencies":
      return {
        columns: ["form", "count", "matchingVerses"],
        rows: (data.results ?? []).map((r: any) => ({
          form: r.form,
          count: r.count,
          matchingVerses: r.matchingVerses,
        })),
      };
    case "verses":
      return {
        columns: ["edition", "verse", "nom", "quocNgu"],
        rows: (data.verses ?? []).map((r: any) => ({
          edition: r.edition,
          verse: r.number,
          nom: r.nom,
          quocNgu: r.quocNgu,
        })),
      };
    case "compare":
      return {
        columns: ["verse", "edition", "nom", "quocNgu", "status"],
        rows: (data.rows ?? []).flatMap((r: any) =>
          r.readings.map((reading: any) => ({
            verse: r.number,
            edition: reading.edition,
            nom: reading.verse?.nom ?? null,
            quocNgu: reading.verse?.quocNgu ?? null,
            status: reading.status,
          }))
        ),
      };
    case "editions":
      return {
        columns: ["edition", "title", "totalPages", "totalVerses"],
        rows: (data.editions ?? []).map((r: any) => ({
          edition: r.edition,
          title: r.title,
          totalPages: r.totalPages,
          totalVerses: r.totalVerses,
        })),
      };
    default:
      return { columns: [], rows: [] };
  }
}
export function evidenceSources(evidence: ResearchEvidence): EvidenceSource[] {
  const data = evidence.result;
  const candidates =
    evidence.request.operation === "nom_variants"
      ? (data.results ?? []).flatMap((r: any) =>
          r.examples.flatMap((e: any) => [e.left, e.right])
        )
      : evidence.request.operation === "compare"
      ? (data.rows ?? []).flatMap((r: any) =>
          r.readings.map((e: any) => e.verse)
        )
      : evidence.request.operation === "verses"
      ? data.verses ?? []
      : evidence.request.operation === "concordance"
      ? data.results ?? []
      : [];
  return Array.from(
    new Map<string, EvidenceSource>(
      candidates.filter(Boolean).map((v: any) => [
        v.id,
        {
          id: v.id,
          edition: v.edition,
          number: v.number,
          page: v.page,
          nom: v.nom,
          quocNgu: v.quocNgu,
          sourceUrl: v.sourceUrl,
          scanUrl: v.scanUrl,
          notes: v.notes ?? [],
        },
      ])
    ).values()
  );
}
export function evidenceCounts(
  evidence: ResearchEvidence
): Record<string, number> {
  const d = evidence.result;
  if (d.counts)
    return Object.fromEntries(
      Object.entries({
        ...d.counts,
        totalVariantGroups: d.totalVariantGroups,
        totalSyllablesWithVariants: d.totalSyllablesWithVariants,
      }).filter(
        ([, value]) => typeof value === "number" && Number.isFinite(value)
      )
    ) as Record<string, number>;
  return Object.fromEntries(
    ["totalOccurrences", "totalMatchingVerses", "totalUnits", "totalForms"]
      .filter((k) => typeof d[k] === "number")
      .map((k) => [k, d[k]])
  );
}
export function tableCsv(evidence: ResearchEvidence) {
  const { columns, rows } = evidenceTable(evidence);
  const meta = {
    evidenceId: evidence.id,
    request: JSON.stringify(evidence.request),
    corpusRevision: evidence.result.provenance?.corpusRevision ?? "",
    counts: JSON.stringify(evidenceCounts(evidence)),
    method: JSON.stringify(
      evidence.result.method ??
        evidence.result.alignment ??
        evidence.result.matchingPolicy ??
        evidence.result.tokenization ??
        null
    ),
    hasMoreResults: String(!!evidence.result.nextCursor),
  };
  const keys = [...Object.keys(meta), ...columns, "sourceReferences"];
  const sourceGroups =
    evidence.request.operation === "nom_variants"
      ? (evidence.result.results ?? []).map((r: any) =>
          r.examples.flatMap((e: any) => [e.left, e.right])
        )
      : evidence.request.operation === "compare"
      ? (evidence.result.rows ?? []).flatMap((r: any) =>
          r.readings.map((e: any) => (e.verse ? [e.verse] : []))
        )
      : evidence.request.operation === "verses"
      ? (evidence.result.verses ?? []).map((v: any) => [v])
      : evidence.request.operation === "concordance"
      ? (evidence.result.results ?? []).map((v: any) => [v])
      : [];
  const csvRows = rows.map((row, index) => ({
    ...row,
    sourceReferences: JSON.stringify(
      (sourceGroups[index] ?? []).map((v: any) => ({
        id: v.id,
        sourceUrl: v.sourceUrl,
      }))
    ),
  }));
  const cell = (v: unknown) => {
    let text = v == null ? "" : String(v);
    if (/^[\s\uFEFF]*[=+@-]/.test(text)) text = "'" + text;
    return `"${text.replace(/"/g, '""')}"`;
  };
  return (
    "\uFEFF" +
    [
      keys.map(cell).join(","),
      ...(csvRows.length ? csvRows : [{}]).map((row) =>
        keys.map((k) => cell(k in meta ? meta[k] : row[k])).join(",")
      ),
    ].join("\r\n")
  );
}

export function evidenceScope(evidence: ResearchEvidence) {
  const settings = evidence.result.settings ?? evidence.request.input ?? {};
  return {
    editions:
      settings.editions?.join(", ") ??
      (settings.left && settings.right
        ? `${settings.left} / ${settings.right}`
        : settings.edition ??
          evidence.request.edition ??
          "1866, 1870, 1871, 1872, 1902"),
    range:
      typeof settings.from === "number"
        ? settings.from === 1 && settings.to === 10000
          ? "all"
          : `${settings.from}–${settings.to}`
        : null,
    query: settings.query ?? settings.term ?? null,
    script: settings.script ?? null,
    unit: settings.unit ?? null,
  };
}

export function evidenceRowSources(
  evidence: ResearchEvidence
): EvidenceSource[][] {
  const data = evidence.result,
    sources = new Map(evidenceSources(evidence).map((s) => [s.id, s]));
  const groups =
    evidence.request.operation === "nom_variants"
      ? (data.results ?? []).map((r: any) =>
          r.examples.flatMap((e: any) => [e.left, e.right])
        )
      : evidence.request.operation === "compare"
      ? (data.rows ?? []).flatMap((r: any) =>
          r.readings.map((e: any) => (e.verse ? [e.verse] : []))
        )
      : evidence.request.operation === "verses"
      ? (data.verses ?? []).map((v: any) => [v])
      : evidence.request.operation === "concordance"
      ? (data.results ?? []).map((v: any) => [v])
      : [];
  return groups.map((group: any[]) =>
    group.map((v) => sources.get(v.id)).filter(Boolean)
  );
}
