import Link from "@/components/nom-explorer/Link";
import PageHeader, { Card } from "@/components/nom-explorer/PageHeader";
import { HanLink } from "@/components/nom-explorer/Han";
import { variantGroups, VARIANT_KINDS, VARIANT_LABEL, type VariantKind } from "@/lib/nom-explorer/data";

export const metadata = { title: "Variant spellings · Nôm Component Explorer" };

const PAGE = 150;

export default function VariantsPage({ searchParams }: { searchParams: { kind?: string } }) {
  const all = variantGroups();
  const kind = VARIANT_KINDS.includes(searchParams.kind as VariantKind) ? (searchParams.kind as VariantKind) : null;
  const shown = kind ? all.filter((g) => g.kind === kind) : all;

  return (
    <div>
      <PageHeader
        crumbs={[{ label: "Variant spellings" }]}
        title="Variant spellings"
        subtitle="Words the dictionary writes more than one way: different characters with the same reading and the same gloss. Grouped by what changes between the spellings, most-cited first."
      />
      <div className="flex flex-wrap gap-2 mb-8 text-sm">
        <Link href="/variants" className={`px-3 py-1.5 rounded-full border ${!kind ? "bg-branding-black text-white border-transparent" : "bg-white border-primary-gray hover:border-branding-brown"}`}>
          All <span className="opacity-70 tabular-nums">{all.length}</span>
        </Link>
        {VARIANT_KINDS.map((k) => (
          <Link
            key={k}
            href={`/variants?kind=${encodeURIComponent(k)}`}
            className={`px-3 py-1.5 rounded-full border ${kind === k ? "bg-branding-black text-white border-transparent" : "bg-white border-primary-gray hover:border-branding-brown"}`}
          >
            {VARIANT_LABEL[k]} <span className="opacity-70 tabular-nums">{all.filter((g) => g.kind === k).length}</span>
          </Link>
        ))}
      </div>
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[var(--ink-3)] text-xs">
            <tr className="border-b border-primary-gray">
              <th className="font-normal px-4 py-2">Reading</th>
              <th className="font-normal px-2 py-2">Spellings (phonetic + semantic)</th>
              <th className="font-normal px-2 py-2">Gloss</th>
              {!kind && <th className="font-normal px-2 py-2">Kind</th>}
              <th className="font-normal px-4 py-2 text-right">Cites</th>
            </tr>
          </thead>
          <tbody>
            {shown.slice(0, PAGE).map((g, i) => (
              <tr key={i} className="border-b border-branding-gray last:border-0 align-top">
                <td className="px-4 py-2 font-normal">
                  <Link href={`/syllable/${encodeURIComponent(g.reading)}`} className="hover:text-[var(--brown-ink)]">{g.reading}</Link>
                </td>
                <td className="px-2 py-2">
                  <span className="flex flex-wrap gap-x-4 gap-y-1">
                    {g.members.map((m) => (
                      <span key={m.rec.c} className="whitespace-nowrap">
                        <HanLink ch={m.rec.c} className="text-2xl" />
                        <span className="han text-xs text-[var(--ink-3)] ml-1">
                          {m.phonetic ? m.phonetic.src ?? m.phonetic.ch : "–"}+{m.semantic ? m.semantic.src ?? m.semantic.ch : "–"}
                        </span>
                      </span>
                    ))}
                  </span>
                </td>
                <td className="px-2 py-2 text-[var(--ink-2)] min-w-[14rem]">{g.gloss}</td>
                {!kind && <td className="px-2 py-2 text-xs text-[var(--ink-3)]">{g.kind}</td>}
                <td className="px-4 py-2 text-right tabular-nums text-[var(--ink-3)]">{g.cites}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {shown.length > PAGE && (
        <p className="text-sm text-[var(--ink-3)] mt-3">Showing the {PAGE} most-cited of {shown.length}. Open a reading to see all of its spellings.</p>
      )}
    </div>
  );
}
