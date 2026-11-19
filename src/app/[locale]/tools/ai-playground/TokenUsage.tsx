"use client";
import { useLocale, useTranslations } from "next-intl";
import { sessionTokenUsage, type UsageTurn } from "@/lib/ai-playground/usage";
import styles from "./playground.module.css";

export default function TokenUsage({ turns }: { turns: UsageTurn[] }) {
  const t = useTranslations("AIPlayground"),
    locale = useLocale(),
    totals = sessionTokenUsage(turns);
  const number = (value: number | null) =>
    value === null ? "—" : value.toLocaleString(locale);
  const total = (input: number | null, output: number | null) =>
    input === null || output === null ? null : input + output;
  return (
    <section className={styles.tokenUsage} aria-label={t("usage.title")}>
      <div className={styles.usageHeading}>
        <h2>{t("usage.title")}</h2>
        <span>
          {t("usage.session")} · {turns.length}{" "}
          {t(turns.length === 1 ? "usage.oneRequest" : "usage.requests")}
        </span>
      </div>
      <dl className={styles.usageTotals}>
        <div>
          <dt>{t("usage.input")}</dt>
          <dd data-testid="session-input-tokens">
            {number(totals.inputTokens)}
          </dd>
        </div>
        <div>
          <dt>{t("usage.output")}</dt>
          <dd data-testid="session-output-tokens">
            {number(totals.outputTokens)}
          </dd>
        </div>
        <div>
          <dt>{t("usage.total")}</dt>
          <dd data-testid="session-total-tokens">
            {number(total(totals.inputTokens, totals.outputTokens))}
          </dd>
        </div>
      </dl>
      {!totals.complete && (
        <p className={styles.usageNote}>{t("usage.incomplete")}</p>
      )}
      {turns.length > 0 && (
        <details open className={styles.usageHistory}>
          <summary>{t("usage.perRequest")}</summary>
          <div
            className={styles.usageTableScroll}
            tabIndex={0}
            role="region"
            aria-label={t("usage.perRequest")}
          >
            <table className={styles.researchTable}>
              <caption>{t("usage.perRequest")}</caption>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">{t("usage.request")}</th>
                  <th scope="col">{t("model")}</th>
                  <th scope="col">{t("usage.status")}</th>
                  <th scope="col">{t("usage.input")}</th>
                  <th scope="col">{t("usage.output")}</th>
                  <th scope="col">{t("usage.total")}</th>
                  <th scope="col">{t("usage.reporting")}</th>
                </tr>
              </thead>
              <tbody>
                {turns.map((turn, index) => (
                  <tr key={turn.id}>
                    <th scope="row">{index + 1}</th>
                    <td>
                      <span>{t(`usage.modes.${turn.mode}`)}</span>
                      <p className={styles.usageRequestTitle}>{turn.title}</p>
                    </td>
                    <td>
                      {turn.model}
                      <span className={styles.usageProvider}>
                        {turn.provider}
                      </span>
                    </td>
                    <td>{t(`usage.statuses.${turn.status}`)}</td>
                    <td>{number(turn.inputTokens)}</td>
                    <td>{number(turn.outputTokens)}</td>
                    <td>
                      {number(total(turn.inputTokens, turn.outputTokens))}
                    </td>
                    <td>
                      {t(
                        turn.complete
                          ? "usage.complete"
                          : turn.inputTokens === null &&
                            turn.outputTokens === null
                          ? turn.status === "running"
                            ? "usage.pending"
                            : "usage.unavailable"
                          : "usage.partial"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </section>
  );
}
