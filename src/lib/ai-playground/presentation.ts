import type {
  InspectEvidenceInput,
  PresentationWarning,
  ReportBlock,
  ResearchEvidence,
} from "./agent-contracts";
import {
  evidenceCounts,
  evidenceRowSources,
  evidenceSources,
  evidenceTable,
  type Cell,
} from "./evidence";

export type Dataset = {
  id: string;
  evidenceId: string;
  fields: { key: string; type: "number" | "string" }[];
  rows: Record<string, Cell>[];
  totalRows: number;
  paginated: boolean;
};
function dataset(
  id: string,
  evidenceId: string,
  columns: string[],
  rows: Record<string, Cell>[],
  totalRows = rows.length,
  paginated = false
): Dataset {
  return {
    id,
    evidenceId,
    fields: columns.map((key) => ({
      key,
      type:
        rows.some((r) => typeof r[key] === "number") &&
        rows.every(
          (r) =>
            r[key] === null ||
            (typeof r[key] === "number" && Number.isFinite(r[key]))
        )
          ? "number"
          : "string",
    })),
    rows,
    totalRows,
    paginated,
  };
}
export function evidenceDatasets(evidence: ResearchEvidence): Dataset[] {
  const data = evidence.result,
    table = evidenceTable(evidence);
  let columns = table.columns,
    rows = table.rows;
  if (evidence.request.operation === "nom_variants") {
    columns = [...columns, "label"];
    rows = rows.map((r) => ({
      ...r,
      label: `${r.syllable}: ${r.leftNom} → ${r.rightNom}`,
    }));
  }
  if (evidence.request.operation === "editions") {
    columns = [...columns, "year"];
    rows = rows.map((r) => ({ ...r, year: Number(r.edition) }));
  }
  const total =
    data.totalVariantGroups ??
    data.totalOccurrences ??
    data.totalForms ??
    rows.length;
  const datasets = columns.length
    ? [
        dataset(
          `${evidence.id}.rows`,
          evidence.id,
          columns,
          rows,
          total,
          !!data.nextCursor
        ),
      ]
    : [];
  const counts = evidenceCounts(evidence);
  if (Object.keys(counts).length)
    datasets.push(
      dataset(
        `${evidence.id}.counts`,
        evidence.id,
        ["metric", "value"],
        Object.entries(counts).map(([metric, value]) => ({ metric, value }))
      )
    );
  if (data.byEdition)
    datasets.push(
      dataset(
        `${evidence.id}.editions`,
        evidence.id,
        ["edition", "occurrences", "matchingVerses", "year"],
        Object.entries(data.byEdition).map(([edition, c]: [string, any]) => ({
          edition,
          occurrences: c.occurrences,
          matchingVerses: c.matchingVerses,
          year: Number(edition),
        }))
      )
    );
  return datasets;
}
export function findDataset(evidence: ResearchEvidence[], id: string) {
  const entry = evidence.find((e) => e.id === id.split(".")[0]);
  const result = entry && evidenceDatasets(entry).find((d) => d.id === id);
  if (!result) throw new Error("Unresolved evidence dataset");
  return result;
}
export function blockRows(
  block: Extract<ReportBlock, { type: "table" | "chart" }>,
  data: Dataset,
  limit = block.limit
) {
  let rows = [...data.rows];
  const sorting =
    block.sort ??
    (block.type === "chart" && block.chartType === "line"
      ? { field: block.x, direction: "asc" as const }
      : null);
  if (sorting)
    rows.sort((a, b) => {
      const av = a[sorting.field],
        bv = b[sorting.field];
      if (av === null) return bv === null ? 0 : 1;
      if (bv === null) return -1;
      const order =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv), "vi");
      return sorting.direction === "asc" ? order : -order;
    });
  return rows.slice(0, limit);
}
export function validatePresentation(
  blocks: ReportBlock[],
  evidence: ResearchEvidence[]
) {
  const ids = new Set(evidence.map((e) => e.id)),
    presentationWarnings: PresentationWarning[] = [];
  const validated = blocks.map((block, index): ReportBlock => {
    if (block.type === "section" || block.type === "note") {
      if (block.evidenceIds.some((id) => !ids.has(id)))
        throw new Error("Unresolved evidence reference");
      return block;
    }
    if (block.type === "passage") {
      const entry = evidence.find((e) => e.id === block.evidenceId);
      if (
        !entry ||
        block.sourceIds.some(
          (id) => !evidenceSources(entry).some((s) => s.id === id)
        )
      )
        throw new Error("Unresolved source passage");
      return block;
    }
    const data = findDataset(evidence, block.dataset),
      keys = new Set(data.fields.map((f) => f.key));
    let reason: PresentationWarning["reason"] | null = null;
    const requested =
      block.type === "table" ? block.columns : [block.x, block.y];
    if (
      requested.some((k) => !keys.has(k)) ||
      (block.sort && !keys.has(block.sort.field))
    )
      reason = "invalid-fields";
    else if (block.type === "chart") {
      const numeric = (key: string) =>
        data.fields.find((f) => f.key === key)?.type === "number";
      if (!data.rows.length) reason = "empty-chart";
      else if (
        !numeric(block.y) ||
        (block.chartType !== "bar" && !numeric(block.x))
      )
        reason = "numeric-chart-required";
      else if (
        (block.chartType === "line" || block.chartType === "bar") &&
        new Set(
          data.rows
            .filter((row) => row[block.x] !== null)
            .map((row) => row[block.x])
        ).size !== data.rows.filter((row) => row[block.x] !== null).length
      )
        reason = "ambiguous-axis";
    }
    if (reason) {
      presentationWarnings.push({ block: index, reason });
      return {
        type: "table",
        title: block.title,
        dataset: block.dataset,
        columns: data.fields.map((f) => f.key).slice(0, 12),
        sort: null,
        limit: Math.min(block.limit, 100),
      };
    }
    return block;
  });
  return { blocks: validated, presentationWarnings };
}
export function compactEvidence(evidence: ResearchEvidence) {
  const result = evidence.result;
  return {
    evidenceId: evidence.id,
    operation: evidence.request.operation,
    settings: result.settings ?? evidence.request,
    counts: evidenceCounts(evidence),
    corpusRevision: result.provenance?.corpusRevision,
    method:
      result.method ??
      result.alignment ??
      result.matchingPolicy ??
      result.tokenization ??
      null,
    nextCursor: result.nextCursor ?? null,
    datasets: evidenceDatasets(evidence).map(({ rows, ...description }) => ({
      ...description,
      loadedRows: rows.length,
      sample: rows.slice(0, 5),
    })),
    sourceCount: evidenceSources(evidence).length,
    sources: evidenceSources(evidence)
      .slice(0, 3)
      .map(({ notes, ...source }) => ({
        ...source,
        noteCount: notes?.length ?? 0,
      })),
    coverage:
      "Only the first five loaded rows per dataset and three source passages are included here. Counts describe the full analysis. Full loaded rows remain available to the report renderer. Use inspect_evidence to inspect more rows or source notes before making claims about them.",
  };
}
export function inspectEvidence(
  evidence: ResearchEvidence[],
  input: InspectEvidenceInput
) {
  const entry = evidence.find((e) => e.id === input.evidenceId);
  if (!entry) throw new Error("Unresolved evidence reference");
  if (input.dataset && !input.dataset.startsWith(`${entry.id}.`))
    throw new Error("Mismatched evidence dataset");
  const data = input.dataset ? findDataset(evidence, input.dataset) : null;
  const sources = evidenceSources(entry);
  if (input.sourceIds.some((id) => !sources.some((s) => s.id === id)))
    throw new Error("Unresolved source passage");
  return {
    evidenceId: entry.id,
    dataset: data?.id ?? null,
    offset: input.offset,
    rows: data?.rows.slice(input.offset, input.offset + input.limit) ?? [],
    loadedRows: data?.rows.length ?? 0,
    totalRows: data?.totalRows ?? 0,
    sources: input.sourceIds.length
      ? input.sourceIds.map((id) => sources.find((s) => s.id === id))
      : Array.from(
          new Map(
            (data?.id.endsWith(".rows")
              ? evidenceRowSources(entry)
                  .slice(input.offset, input.offset + input.limit)
                  .flat()
              : !data
              ? sources.slice(input.offset, input.offset + input.limit)
              : []
            ).map((source) => [source.id, source])
          ).values()
        )
          .slice(0, 6)
          .map(({ notes, ...source }) => ({
            ...source,
            noteCount: notes?.length ?? 0,
          })),
    availableSourceCount: sources.length,
    sourceCoverage: input.sourceIds.length
      ? "Exact requested sources, including linked notes."
      : "Up to six sources associated with these loaded rows (or a source-list slice). Request their IDs explicitly for full notes.",
  };
}

export function viewCsv(
  block: Extract<ReportBlock, { type: "table" | "chart" }>,
  data: Dataset,
  evidence: ResearchEvidence,
  rows: Dataset["rows"]
) {
  const columns =
    block.type === "table"
      ? block.columns
      : Array.from(new Set([block.x, block.y]));
  const metadata = {
    evidenceId: evidence.id,
    dataset: data.id,
    corpusRevision: evidence.result.provenance?.corpusRevision ?? "",
    request: JSON.stringify(evidence.request),
    view: JSON.stringify(block),
    loadedRows: data.rows.length,
    totalRows: data.totalRows,
    exportedRows: rows.length,
    counts: JSON.stringify(evidenceCounts(evidence)),
    sources: JSON.stringify(
      evidenceSources(evidence).map(({ id, sourceUrl }) => ({ id, sourceUrl }))
    ),
  };
  const keys = [...Object.keys(metadata), ...columns];
  const cell = (value: unknown) => {
    let text = value == null ? "" : String(value);
    if (/^[\s\uFEFF]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  return (
    "\uFEFF" +
    [
      keys.map(cell).join(","),
      ...(rows.length ? rows : [{}]).map((row) =>
        keys
          .map((key) => cell(key in metadata ? metadata[key] : row[key]))
          .join(",")
      ),
    ].join("\r\n")
  );
}
