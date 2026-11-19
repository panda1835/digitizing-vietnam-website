import type { ResearchReport } from "./agent-contracts";
import { evidenceCounts, evidenceSources } from "./evidence";
import { blockRows, findDataset } from "./presentation";
export * from "./evidence";

export function reportSummary(report: ResearchReport) {
  return report.blocks
    .map((block) =>
      block.type === "section" || block.type === "note"
        ? [block.title, block.text].filter(Boolean).join("\n")
        : block.title
    )
    .join("\n\n");
}
export function reportMarkdown(report: ResearchReport) {
  const lines = [`# ${report.title}`, ""];
  const escape = (v: unknown) =>
    String(v ?? "")
      .replace(/\|/g, "\\|")
      .replace(/[\r\n]/g, " ");
  for (const [index, block] of Array.from(report.blocks.entries())) {
    if (block.title) lines.push(`## ${block.title}`, "");
    if (block.type === "section" || block.type === "note") {
      lines.push(block.text, "", block.evidenceIds.join(", "), "");
    } else if (block.type === "passage") {
      const entry = report.evidence.find((e) => e.id === block.evidenceId)!;
      const sources = evidenceSources(entry);
      for (const id of block.sourceIds) {
        const source = sources.find((s) => s.id === id)!;
        if (block.script !== "quocNgu") lines.push(`> ${source.nom}`, "");
        if (block.script !== "nom") lines.push(`> ${source.quocNgu}`, "");
        lines.push(`${source.id}: ${source.sourceUrl}`, "");
      }
    } else {
      const data = findDataset(report.evidence, block.dataset),
        rows = blockRows(block, data);
      const columns =
        block.type === "table"
          ? block.columns
          : Array.from(new Set([block.x, block.y]));
      if (block.type === "chart")
        lines.push(
          `Chart: ${block.chartType}. The underlying plotted values follow.`,
          ""
        );
      lines.push(
        `| ${columns.join(" | ")} |`,
        `| ${columns.map(() => "---").join(" | ")} |`,
        ...rows.map(
          (row) => `| ${columns.map((k) => escape(row[k])).join(" | ")} |`
        ),
        ""
      );
      lines.push(
        `Displayed ${rows.length} of ${data.rows.length} loaded rows; ${data.totalRows} rows in the query.`,
        ""
      );
      if (data.paginated)
        lines.push(
          "Displayed result page only; additional results are available. Counts describe the full query.",
          ""
        );
    }
    if (report.presentationWarnings?.some((w) => w.block === index))
      lines.push(
        "The requested view was incompatible with this dataset; the source table is shown instead.",
        ""
      );
  }
  lines.push("## Evidence and methods", "");
  for (const e of report.evidence) {
    lines.push(
      `### ${e.id}: ${e.request.operation}`,
      "",
      `Settings: ${JSON.stringify(e.request)}`,
      "",
      `Corpus revision: ${e.result.provenance?.corpusRevision ?? ""}`,
      "",
      `Counts: ${JSON.stringify(evidenceCounts(e))}`,
      ""
    );
    if (e.result.method) lines.push(JSON.stringify(e.result.method), "");
    if (e.result.alignment) lines.push(JSON.stringify(e.result.alignment), "");
    for (const source of evidenceSources(e))
      lines.push(
        `- ${source.id}: ${source.sourceUrl}`,
        `  - Nôm: ${source.nom}`,
        `  - Quốc ngữ: ${source.quocNgu}`
      );
    lines.push("");
  }
  return lines.join("\n");
}
export function reportFollowupContext(report: ResearchReport) {
  return JSON.stringify(
    report.evidence.map((e) => ({
      request: e.request,
      nextCursor: e.result.nextCursor ?? null,
      counts: evidenceCounts(e),
      corpusRevision: e.result.provenance?.corpusRevision,
    }))
  );
}
