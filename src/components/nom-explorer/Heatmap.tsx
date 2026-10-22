// Cross-tabulation with a single-hue sequential fill.

export default function Heatmap({
  rows,
  cols,
  cell,
  rowTitle,
  colTitle,
  outline,
}: {
  rows: string[];
  cols: string[];
  cell: (r: string, c: string) => number;
  rowTitle: string;
  colTitle: string;
  outline?: (r: string, c: string) => boolean; // mark expected cells
}) {
  const values = rows.flatMap((r) => cols.map((c) => cell(r, c)));
  const max = Math.max(1, ...values);
  return (
    <div className="overflow-x-auto">
      <table className="text-sm border-separate border-spacing-[2px]">
        <thead>
          <tr>
            <th className="text-left text-xs font-normal text-[var(--ink-3)] pr-2 align-bottom whitespace-nowrap">
              {rowTitle} ↓ {colTitle} →
            </th>
            {cols.map((c) => (
              <th key={c} className="font-normal text-xs text-[var(--ink-2)] px-0.5 pb-1 min-w-[2.6rem]">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              <th className="text-right font-normal text-[var(--ink-2)] pr-2 whitespace-nowrap">{r}</th>
              {cols.map((c) => {
                const v = cell(r, c);
                const t = v / max;
                return (
                  <td
                    key={c}
                    className="tip h-9 text-center rounded tabular-nums"
                    data-tip={`${rowTitle} ${r} → ${colTitle} ${c}: ${v}`}
                    style={{
                      background: v
                        ? `color-mix(in srgb, var(--brown) ${Math.round(12 + 88 * t)}%, var(--card))`
                        : "var(--cell-empty)",
                      color: t > 0.5 ? "var(--card)" : "var(--ink)",
                      boxShadow: outline?.(r, c) ? "inset 0 0 0 2px var(--ink)" : undefined,
                    }}
                  >
                    {v || ""}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
