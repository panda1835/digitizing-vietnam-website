// Horizontal bar list: one series, one hue. Values sit in ink, not bar colour.

export interface Bar {
  label: string;
  value: number;
  marker?: string; // e.g. "SV" to flag the phonetic's own value
  tip?: string;
}

export default function Bars({
  data,
  total,
  max = 12,
  labelClass = "",
  labelWidth = "4.5rem",
}: {
  data: Bar[];
  total?: number;
  max?: number;
  labelClass?: string;
  labelWidth?: string;
}) {
  const rows = data.slice(0, max);
  const rest = data.slice(max);
  const top = Math.max(1, ...rows.map((d) => d.value));
  const sum = total ?? data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="space-y-1.5">
      {rows.map((d) => (
        <div key={d.label} className="tip grid items-center gap-2 text-sm" style={{ gridTemplateColumns: `${labelWidth} 1fr 3.5rem` }} data-tip={d.tip ?? `${d.label}: ${d.value} (${Math.round((100 * d.value) / sum)}%)`}>
          <div className={`truncate text-right ${labelClass}`}>
            {d.label}
            {d.marker && <span className="ml-1 text-[10px] uppercase tracking-wide text-[var(--brown-ink)] align-middle">{d.marker}</span>}
          </div>
          <div className="h-3.5 bg-branding-gray rounded-r">
            <div className="h-full rounded-r bg-branding-brown" style={{ width: `${Math.max(2, (100 * d.value) / top)}%` }} />
          </div>
          <div className="tabular-nums text-[var(--ink-2)]">{d.value}</div>
        </div>
      ))}
      {rest.length > 0 && (
        <div className="text-xs text-[var(--ink-3)]" style={{ paddingLeft: `calc(${labelWidth} + 0.5rem)` }}>
          + {rest.length} more ({rest.reduce((s, d) => s + d.value, 0)})
          {rest.length <= 12 && <>: {rest.map((d) => d.label).join(", ")}</>}
        </div>
      )}
    </div>
  );
}
