"use client";
import { useState } from "react";
import Link from "@/components/nom-explorer/Link";
import Bars from "./Bars";
import { PERIODS, periodOf, type DateMode, type SourceCount } from "@/lib/nom-explorer/periods";

// Citations by period, dated either by the copy the dictionary quotes or by
// when the work was composed.
export default function AttestationChart({ rows, unit = "citations" }: { rows: SourceCount[]; unit?: string }) {
  const [mode, setMode] = useState<DateMode>("copy");
  const total = rows.reduce((n, r) => n + r.cites, 0);
  const byPeriod = PERIODS.map((p) => ({
    label: p,
    value: rows.filter((r) => periodOf(r[mode]) === p).reduce((n, r) => n + r.cites, 0),
  })).filter((b) => b.value);
  const dated = rows.filter((r) => r[mode] != null).sort((a, b) => a[mode]! - b[mode]!);
  const first = dated[0];

  return (
    <div className="grid md:grid-cols-[1.2fr_1fr] gap-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-base font-normal">{total} {unit} by period</h3>
          <div className="flex rounded-lg border border-primary-gray overflow-hidden text-xs" role="group" aria-label="Date by">
            {(["copy", "composed"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`px-2.5 py-1 ${mode === m ? "bg-branding-black text-white" : "bg-white text-[var(--ink-2)]"}`}
              >
                {m === "copy" ? "Date of copy quoted" : "Date composed"}
              </button>
            ))}
          </div>
        </div>
        <Bars data={byPeriod} max={PERIODS.length} labelWidth="6.5rem" labelClass="text-xs" />
        {first && (
          <p className="text-sm text-[var(--ink-2)] mt-3">
            Earliest dated: <strong className="font-normal">{first.short}</strong> ({first[mode]})
          </p>
        )}
      </div>
      <div className="min-w-0">
        <h3 className="text-base font-normal mb-2">Most-quoted sources</h3>
        <table className="w-full text-sm">
          <tbody>
            {rows.slice(0, 8).map((r) => (
              <tr key={r.short} className="border-b border-branding-gray last:border-0">
                <td className="py-1">{r.short}</td>
                <td className="py-1 text-[var(--ink-3)] tabular-nums">{r[mode] ?? "undated"}</td>
                <td className="py-1 text-right tabular-nums">{r.cites}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Link href="/sources" className="link text-xs inline-block mt-2">How sources are dated</Link>
      </div>
    </div>
  );
}
