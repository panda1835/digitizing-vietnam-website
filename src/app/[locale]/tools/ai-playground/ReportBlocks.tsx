"use client";

import { Fragment, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type {
  ReportBlock,
  ResearchEvidence,
} from "@/lib/ai-playground/agent-contracts";
import {
  blockRows,
  viewCsv,
  findDataset,
  type Dataset,
} from "@/lib/ai-playground/presentation";
import { saveResearchFile } from "@/lib/ai-playground/download";
import { evidenceSources } from "@/lib/ai-playground/evidence";
import styles from "./playground.module.css";

function inline(text: string) {
  return text
    .split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g)
    .map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : part.startsWith("`") && part.endsWith("`") ? (
        <code key={i}>{part.slice(1, -1)}</code>
      ) : part.startsWith("*") && part.endsWith("*") ? (
        <em key={i}>{part.slice(1, -1)}</em>
      ) : (
        <Fragment key={i}>{part}</Fragment>
      )
    );
}
// A deliberately small Markdown subset. Raw HTML and model-authored links are text.
export function ReportText({ text }: { text: string }) {
  return (
    <div className={styles.reportText}>
      {text.split(/\n\s*\n/).map((paragraph, index) => {
        const lines = paragraph.split("\n");
        if (lines.every((line) => /^\s*[-*] /.test(line)))
          return (
            <ul key={index}>
              {lines.map((line, i) => (
                <li key={i}>{inline(line.replace(/^\s*[-*] /, ""))}</li>
              ))}
            </ul>
          );
        if (lines.every((line) => /^\s*\d+\. /.test(line)))
          return (
            <ol key={index}>
              {lines.map((line, i) => (
                <li key={i}>{inline(line.replace(/^\s*\d+\. /, ""))}</li>
              ))}
            </ol>
          );
        return <p key={index}>{inline(paragraph)}</p>;
      })}
    </div>
  );
}
function DataTable({
  columns,
  rows,
  caption,
}: {
  columns: string[];
  rows: Dataset["rows"];
  caption: string;
}) {
  const t = useTranslations("AIPlayground");
  return (
    <div
      className={styles.researchTableScroll}
      role="region"
      aria-label={caption}
      tabIndex={0}
    >
      <table className={styles.researchTable}>
        <caption>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col">
                {t(`research.columns.${column}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, i) => (
              <tr key={i}>
                {columns.map((column) => (
                  <td
                    key={column}
                    className={
                      column === "nom" || column.endsWith("Nom")
                        ? styles.nomCell
                        : undefined
                    }
                  >
                    {row[column] ?? "—"}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>{t("research.noRows")}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
export function ReportTable({
  block,
  data,
  evidence,
  onError,
}: {
  block: Extract<ReportBlock, { type: "table" }>;
  data: Dataset;
  evidence: ResearchEvidence;
  onError: () => void;
}) {
  const t = useTranslations("AIPlayground"),
    [page, setPage] = useState(0);
  const sorted = blockRows(block, data, data.rows.length),
    pages = Math.max(1, Math.ceil(sorted.length / block.limit));
  const rows = sorted.slice(page * block.limit, (page + 1) * block.limit);
  return (
    <>
      <DataTable columns={block.columns} rows={rows} caption={block.title} />
      <div className={styles.reportDataControls}>
        <button
          type="button"
          onClick={() => {
            try {
              saveResearchFile(
                viewCsv(block, data, evidence, rows),
                `truyen-kieu-${data.id}-view.csv`,
                "text/csv;charset=utf-8"
              );
            } catch {
              onError();
            }
          }}
        >
          {t("research.downloadView")}
        </button>
        <p>
          {t("research.loadedRows")}: {data.rows.length} ·{" "}
          {t("research.queryRows")}: {data.totalRows}
        </p>
        {pages > 1 && (
          <div>
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              {t("research.previousRows")}
            </button>
            <span>
              {page + 1} / {pages}
            </span>
            <button
              type="button"
              disabled={page + 1 >= pages}
              onClick={() => setPage(page + 1)}
            >
              {t("research.nextRows")}
            </button>
          </div>
        )}
      </div>
      {data.paginated && (
        <p className={styles.help}>{t("research.moreResults")}</p>
      )}
    </>
  );
}
function ResearchChart({
  block,
  data,
  id,
  evidence,
  onError,
}: {
  block: Extract<ReportBlock, { type: "chart" }>;
  data: Dataset;
  id: string;
  evidence: ResearchEvidence;
  onError: () => void;
}) {
  const t = useTranslations("AIPlayground"),
    locale = useLocale(),
    [pointLimit, setPointLimit] = useState(block.limit),
    [active, setActive] = useState<number | null>(null);
  const selected = blockRows(block, data, pointLimit);
  const rows = selected.filter(
    (row) =>
      typeof row[block.y] === "number" &&
      Number.isFinite(row[block.y]) &&
      (block.chartType === "bar"
        ? row[block.x] !== null
        : typeof row[block.x] === "number" && Number.isFinite(row[block.x]))
  );
  const width = 640,
    height = 360,
    left = 68,
    right = 24,
    top = 28,
    bottom = 88,
    plotWidth = width - left - right,
    plotHeight = height - top - bottom;
  const values = rows.map((r) => Number(r[block.y])),
    xs = rows.map((r) => Number(r[block.x]));
  let ymin = Math.min(0, ...values),
    ymax = Math.max(0, ...values);
  if (ymin === ymax) ymax = ymin + 1;
  let xmin = Math.min(...xs),
    xmax = Math.max(...xs);
  if (xmin === xmax) {
    xmin -= 0.5;
    xmax += 0.5;
  }
  const sy = (value: number) =>
    top + plotHeight - ((value - ymin) / (ymax - ymin)) * plotHeight;
  const sx = (value: number) =>
    left + ((value - xmin) / (xmax - xmin)) * plotWidth;
  const number = (value: number) =>
    value.toLocaleString(locale, { maximumFractionDigits: 2 });
  const points = rows.map((row, i) => ({
    row,
    x:
      block.chartType === "bar"
        ? left + ((i + 0.5) * plotWidth) / Math.max(1, rows.length)
        : sx(Number(row[block.x])),
    y: sy(Number(row[block.y])),
  }));
  const options = Array.from(
    new Set(
      [block.limit, 10, 20, 50].filter(
        (n) => n <= Math.max(block.limit, data.rows.length)
      )
    )
  ).sort((a, b) => a - b);
  return (
    <figure className={styles.reportChart}>
      <div className={styles.reportChartControls}>
        <button
          type="button"
          onClick={() => {
            try {
              saveResearchFile(
                viewCsv(block, data, evidence, rows),
                `truyen-kieu-${data.id}-chart.csv`,
                "text/csv;charset=utf-8"
              );
            } catch {
              onError();
            }
          }}
        >
          {t("research.downloadView")}
        </button>
        <label>
          {t("research.chartPoints")}{" "}
          <select
            id={`${id}-points`}
            value={pointLimit}
            onChange={(event) => {
              setPointLimit(Number(event.target.value));
              setActive(null);
            }}
          >
            {options.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      {rows.length ? (
        <div
          className={styles.reportChartScroll}
          role="region"
          aria-label={block.title}
          tabIndex={0}
        >
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-labelledby={`${id}-title ${id}-desc`}
          >
            <title id={`${id}-title`}>{block.title}</title>
            <desc id={`${id}-desc`}>
              {t(`research.chartTypes.${block.chartType}`)} ·{" "}
              {t(`research.columns.${block.x}`)} /{" "}
              {t(`research.columns.${block.y}`)}.{" "}
              {t("research.chartDataAvailable")}
            </desc>
            {Array.from(
              { length: 5 },
              (_, i) => ymin + ((ymax - ymin) * i) / 4
            ).map((value) => (
              <g key={value}>
                <line
                  x1={left}
                  x2={width - right}
                  y1={sy(value)}
                  y2={sy(value)}
                  className={styles.chartGrid}
                />
                <text
                  x={left - 8}
                  y={sy(value) + 4}
                  textAnchor="end"
                  className={styles.chartLabel}
                >
                  {number(value)}
                </text>
              </g>
            ))}
            <line
              x1={left}
              x2={width - right}
              y1={sy(0)}
              y2={sy(0)}
              className={styles.chartAxis}
            />
            {block.chartType === "line" && (
              <polyline
                points={points.map((p) => `${p.x},${p.y}`).join(" ")}
                className={styles.chartLine}
              />
            )}
            {points.map(({ row, x, y }, i) => {
              const label = `${String(row[block.x])}: ${number(
                Number(row[block.y])
              )}`;
              const interaction = {
                tabIndex: 0,
                "aria-label": label,
                onFocus: () => setActive(i),
                onBlur: () => setActive(null),
                onMouseEnter: () => setActive(i),
                onMouseLeave: () => setActive(null),
              };
              return (
                <g key={i}>
                  {block.chartType === "bar" ? (
                    <rect
                      {...interaction}
                      x={x - (plotWidth / rows.length) * 0.32}
                      y={Math.min(y, sy(0))}
                      width={(plotWidth / rows.length) * 0.64}
                      height={Math.max(1, Math.abs(sy(0) - y))}
                      className={styles.chartMark}
                    >
                      <title>{label}</title>
                    </rect>
                  ) : (
                    <circle
                      {...interaction}
                      cx={x}
                      cy={y}
                      r={4}
                      className={styles.chartMark}
                    >
                      <title>{label}</title>
                    </circle>
                  )}
                  {block.chartType === "bar" && (
                    <text
                      x={x}
                      y={height - bottom + 22}
                      textAnchor="end"
                      transform={`rotate(-35 ${x} ${height - bottom + 22})`}
                      className={styles.chartLabel}
                    >
                      {Array.from(String(row[block.x])).slice(0, 9).join("")}
                      {Array.from(String(row[block.x])).length > 9 ? "…" : ""}
                    </text>
                  )}
                </g>
              );
            })}
            {block.chartType !== "bar" &&
              Array.from(
                { length: 5 },
                (_, i) => xmin + ((xmax - xmin) * i) / 4
              ).map((value) => (
                <text
                  key={value}
                  x={sx(value)}
                  y={height - bottom + 24}
                  textAnchor="middle"
                  className={styles.chartLabel}
                >
                  {number(value)}
                </text>
              ))}
            <text x={left} y={16} className={styles.chartLabel}>
              {t(`research.columns.${block.y}`)}
            </text>
            <text
              x={left + plotWidth / 2}
              y={height - 4}
              textAnchor="middle"
              className={styles.chartLabel}
            >
              {t(`research.columns.${block.x}`)}
            </text>
          </svg>
        </div>
      ) : (
        <p>{t("research.noRows")}</p>
      )}
      <figcaption>
        <span aria-live="polite">
          {active !== null && rows[active]
            ? `${String(rows[active][block.x])}: ${number(
                Number(rows[active][block.y])
              )}`
            : t("research.chartInteraction")}
        </span>
        <p>
          {t("research.plottedRows")}: {rows.length} / {data.rows.length} ·{" "}
          {t("research.queryRows")}: {data.totalRows}
          {selected.length !== rows.length
            ? ` · ${t("research.omittedRows")}: ${
                selected.length - rows.length
              }`
            : ""}
        </p>
      </figcaption>
      {data.paginated && (
        <p className={styles.help}>{t("research.moreResults")}</p>
      )}
      <details className={styles.researchDetails}>
        <summary>{t("research.chartDataAvailable")}</summary>
        <DataTable
          columns={Array.from(new Set([block.x, block.y]))}
          rows={rows}
          caption={block.title}
        />
      </details>
    </figure>
  );
}
export default function ReportBlocks({
  blocks,
  evidence,
  prefix,
  onEvidenceClick,
  warnings,
  onError,
}: {
  blocks: ReportBlock[];
  evidence: ResearchEvidence[];
  prefix: string;
  onEvidenceClick: () => void;
  warnings: { block: number }[];
  onError: () => void;
}) {
  const t = useTranslations("AIPlayground");
  return (
    <>
      {blocks.map((block, index) => {
        const ids =
          block.type === "section" || block.type === "note"
            ? block.evidenceIds
            : [
                block.type === "passage"
                  ? block.evidenceId
                  : block.dataset.split(".")[0],
              ];
        return (
          <section
            key={index}
            className={
              block.type === "note" ? styles.reportNote : styles.reportBlock
            }
          >
            {block.title && <h3>{block.title}</h3>}
            {warnings.some((w) => w.block === index) && (
              <p className={styles.help}>
                {t("research.presentationFallback")}
              </p>
            )}
            {block.type === "section" || block.type === "note" ? (
              <ReportText text={block.text} />
            ) : block.type === "table" ? (
              <ReportTable
                block={block}
                data={findDataset(evidence, block.dataset)}
                evidence={
                  evidence.find((e) => e.id === block.dataset.split(".")[0])!
                }
                onError={onError}
              />
            ) : block.type === "chart" ? (
              <ResearchChart
                block={block}
                data={findDataset(evidence, block.dataset)}
                id={`${prefix}-chart-${index}`}
                evidence={
                  evidence.find((e) => e.id === block.dataset.split(".")[0])!
                }
                onError={onError}
              />
            ) : (
              <div className={styles.reportPassages}>
                {block.sourceIds.map((id) => {
                  const source = evidenceSources(
                    evidence.find((e) => e.id === block.evidenceId)!
                  ).find((s) => s.id === id)!;
                  return (
                    <blockquote key={id}>
                      {block.script !== "quocNgu" && (
                        <p className={styles.nomCell}>{source.nom}</p>
                      )}
                      {block.script !== "nom" && <p>{source.quocNgu}</p>}
                      <cite>
                        <a
                          href={source.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {source.edition} · {t("research.columns.verse")}{" "}
                          {source.number} · {t("research.page")} {source.page}
                        </a>
                      </cite>
                    </blockquote>
                  );
                })}
              </div>
            )}
            {ids.length > 0 && (
              <div className={styles.evidenceLinks}>
                {Array.from(new Set(ids)).map((id) => (
                  <a
                    key={id}
                    href={`#${prefix}-${id}`}
                    onClick={onEvidenceClick}
                  >
                    {t("research.evidence")} {id}
                  </a>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}
