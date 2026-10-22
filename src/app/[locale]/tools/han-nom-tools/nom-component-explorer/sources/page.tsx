import PageHeader, { Card } from "@/components/nom-explorer/PageHeader";
import { getDb, SOURCES, attestation, labelFixes } from "@/lib/nom-explorer/data";

export const metadata = { title: "Sources · Nôm Component Explorer" };

export default function SourcesPage() {
  const counts = new Map(attestation(getDb().records).map((a) => [a.short, a]));
  const rows = [...SOURCES].sort((a, b) => (a.copy ?? a.composed ?? 9999) - (b.copy ?? b.composed ?? 9999));
  const flagged = SOURCES.filter((s) => s.check);

  return (
    <div>
      <PageHeader
        crumbs={[{ label: "Sources" }]}
        title="Sources and their dates"
        subtitle={
          <>
            The {SOURCES.length} texts the dictionary quotes. Each has two dates where its note gives them: when the copy
            quoted was printed or written, and roughly when the work (or its Nôm version) was composed. Both are read from
            the dictionary&rsquo;s own source notes; where a note gives no date the field is left empty rather than
            guessed. Edit <code>data/nom-explorer/sources.json</code> to correct a date.
          </>
        }
      />
      {flagged.length > 0 && (
        <Card className="mb-6">
          <h3 className="text-base font-normal mb-2">Inconsistencies in the source notes</h3>
          <ul className="space-y-1.5 text-sm">
            {flagged.map((s) => (
              <li key={s.short}>
                <strong className="font-normal">{s.short}</strong>: <span className="text-[var(--ink-2)]">{s.check}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      {labelFixes.length > 0 && (
        <Card className="mb-6">
          <h3 className="text-base font-normal mb-1">Structure lines with swapped readings</h3>
          <p className="text-sm text-[var(--ink-2)] mb-2">
            In these lines the two readings are given in the opposite order to the characters (e.g. 目 is mục and 末 mạt).
            The explorer swaps them back, judging by how each character is read elsewhere in the dictionary.
          </p>
          <ul className="space-y-1 text-sm">
            {labelFixes.map((f) => (
              <li key={f.char + f.reading}>
                <span className="han text-lg">{f.char}</span> {f.reading}: <span className="han text-[var(--ink-2)]">{f.struct}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[var(--ink-3)] text-xs">
            <tr className="border-b border-primary-gray">
              <th className="font-normal px-4 py-2">Source</th>
              <th className="font-normal px-2 py-2">Copy quoted</th>
              <th className="font-normal px-2 py-2">Composed</th>
              <th className="font-normal px-2 py-2 text-right">Citations</th>
              <th className="font-normal px-4 py-2 text-right">Characters</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.short} className="border-b border-branding-gray last:border-0 align-top">
                <td className="px-4 py-2">
                  <div className="font-normal">{s.short}</div>
                  <div className="text-xs text-[var(--ink-3)]">
                    {s.title} {s.hn && <span className="han">{s.hn}</span>}
                  </div>
                </td>
                <td className="px-2 py-2">
                  <span className="tabular-nums">{s.copy ?? "—"}</span>
                  <div className="text-xs text-[var(--ink-3)]">{s.copyBasis}</div>
                </td>
                <td className="px-2 py-2">
                  <span className="tabular-nums">{s.composed ? `c. ${s.composed}` : "—"}</span>
                  <div className="text-xs text-[var(--ink-3)]">{s.composedBasis}</div>
                </td>
                <td className="px-2 py-2 text-right tabular-nums">{counts.get(s.short)?.cites ?? 0}</td>
                <td className="px-4 py-2 text-right tabular-nums">{counts.get(s.short)?.chars ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
