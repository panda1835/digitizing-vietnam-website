"use client";

import { useRef } from "react";
import ReportBlocks from "./ReportBlocks";
import { useTranslations } from "next-intl";
import type { ResearchReport } from "@/lib/ai-playground/agent-contracts";
import {
  evidenceCounts,
  evidenceSources,
  evidenceScope,
  evidenceTable,
  tableCsv,
} from "@/lib/ai-playground/report";
import styles from "./playground.module.css";

import { saveResearchFile } from "@/lib/ai-playground/download";
export { saveResearchFile } from "@/lib/ai-playground/download";

export default function ResearchResults({
  report,
  prefix,
  onError,
}: {
  report: ResearchReport;
  prefix: string;
  onError: () => void;
}) {
  const t = useTranslations("AIPlayground");
  const appendix = useRef<HTMLDetailsElement>(null);
  return (
    <article className={styles.researchReport}>
      <h2>{report.title}</h2>
      <ReportBlocks
        blocks={report.blocks}
        evidence={report.evidence}
        prefix={prefix}
        warnings={report.presentationWarnings ?? []}
        onError={onError}
        onEvidenceClick={() => {
          if (appendix.current) appendix.current.open = true;
        }}
      />
      {report.evidence.length > 0 && (
        <details ref={appendix} className={styles.reportEvidenceAppendix}>
          <summary>
            {t("research.evidenceAppendix")} ({report.evidence.length})
          </summary>
          {report.evidence.map((evidence) => {
            const table = evidenceTable(evidence),
              sources = evidenceSources(evidence),
              counts = evidenceCounts(evidence);
            const scope = evidenceScope(evidence);
            const method = evidence.result.method,
              alignment = evidence.result.alignment;
            return (
              <section
                key={evidence.id}
                id={`${prefix}-${evidence.id}`}
                className={styles.evidenceSection}
              >
                <div className={styles.evidenceHeading}>
                  <h3>
                    {evidence.id} ·{" "}
                    {t(`research.operations.${evidence.request.operation}`)}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        saveResearchFile(
                          tableCsv(evidence),
                          `truyen-kieu-${evidence.id}.csv`,
                          "text/csv;charset=utf-8"
                        );
                      } catch {
                        onError();
                      }
                    }}
                  >
                    {t("research.downloadTable")}
                  </button>
                </div>
                {Object.keys(counts).length > 0 && (
                  <dl className={styles.researchCounts}>
                    {Object.entries(counts).map(([key, value]) => (
                      <div key={key}>
                        <dt>{t(`research.counts.${key}`)}</dt>
                        <dd>{value.toLocaleString()}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <p className={styles.researchScope}>
                  {t("research.scope")}: {scope.editions}
                  {scope.range && (
                    <>
                      {" "}
                      · {t("research.columns.verses")}:{" "}
                      {scope.range === "all"
                        ? t("research.allAvailable")
                        : scope.range}
                    </>
                  )}
                  {scope.query && <> · “{scope.query}”</>}
                  {scope.script && (
                    <> · {t(`research.units.${scope.script}`)}</>
                  )}
                  {scope.unit && <> · {t(`research.units.${scope.unit}`)}</>}
                </p>
                {evidence.request.operation === "nom_variants" && (
                  <p className={styles.help}>{t("research.candidatesNote")}</p>
                )}
                {table.columns.length > 0 && (
                  <div
                    className={styles.researchTableScroll}
                    role="region"
                    aria-label={`${evidence.id} ${t("research.computedTable")}`}
                    tabIndex={0}
                  >
                    <table className={styles.researchTable}>
                      <caption>
                        {t("research.computedTable")} · {evidence.id}
                      </caption>
                      <thead>
                        <tr>
                          {table.columns.map((column) => (
                            <th key={column} scope="col">
                              {t(`research.columns.${column}`)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.length ? (
                          table.rows.map((row, i) => (
                            <tr key={i}>
                              {table.columns.map((column) => (
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
                            <td colSpan={table.columns.length}>
                              {t("research.noRows")}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                {evidence.result.nextCursor && (
                  <p className={styles.help}>{t("research.moreResults")}</p>
                )}
                <details className={styles.researchDetails}>
                  <summary>{t("research.methodAndSources")}</summary>
                  {method && (
                    <>
                      <p>{method.alignment}</p>
                      <ul>
                        {method.limitations?.map((limit: string, i: number) => (
                          <li key={i}>{limit}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {alignment && <p>{alignment.notice}</p>}
                  {evidence.result.matchingPolicy && (
                    <p>{evidence.result.matchingPolicy}</p>
                  )}
                  {evidence.result.tokenization && (
                    <p>{evidence.result.tokenization}</p>
                  )}
                  <p className={styles.researchScope}>
                    {t("research.revision")}:{" "}
                    {evidence.result.provenance?.corpusRevision}
                  </p>
                  <ul className={styles.researchSources}>
                    {sources.map((source) => (
                      <li key={source.id}>
                        <a
                          href={source.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {source.edition} · {t("research.columns.verse")}{" "}
                          {source.number} · {t("research.page")} {source.page}
                        </a>
                        <p className={styles.nomCell}>{source.nom}</p>
                        <p>{source.quocNgu}</p>
                        {!!source.notes?.length && (
                          <details>
                            <summary>
                              {t("research.sourceNotes")} ({source.notes.length}
                              )
                            </summary>
                            <ul>
                              {source.notes.map((note, index) => (
                                <li key={note.id ?? index}>{note.text}</li>
                              ))}
                            </ul>
                          </details>
                        )}
                        {source.scanUrl && (
                          <a
                            href={source.scanUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t("research.sourceScan")}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              </section>
            );
          })}
        </details>
      )}
    </article>
  );
}
