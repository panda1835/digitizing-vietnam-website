import Link from "@/components/nom-explorer/Link";
import PageHeader, { Card, SectionTitle } from "@/components/nom-explorer/PageHeader";
import SearchBox from "@/components/nom-explorer/SearchBox";
import { allPhoneticPairs, componentStats, getDb, MC_SV_TONE, SOURCES, variantGroups, CLUSTER_NOTE } from "@/lib/nom-explorer/data";

const EXAMPLES = ["可", "堯", "巴", "侖", "工", "氵", "口", "林"];

export default function Home() {
  const { phonetic, semantic } = componentStats();
  const pairs = allPhoneticPairs().filter((p) => p.mc && p.nom && p.seg !== "onset");
  const mcRegular = Math.round((100 * pairs.filter((p) => MC_SV_TONE[p.mc!.cls].includes(p.nom!.tone)).length) / pairs.length);
  const clusterChars = new Set(
    getDb().records.filter((r) => r.a.some((a) => a.notes.some((n) => CLUSTER_NOTE.test(n)))).map((r) => r.c)
  ).size;
  const copyYears = SOURCES.map((s) => s.copy).filter((y): y is number => y != null);
  const highlights: { href: string; figure: string; title: string; text: string }[] = [
    {
      href: "/insights#sounds",
      figure: `${mcRegular}%`,
      title: "Tone correspondences",
      text: "of Nôm readings keep the tone Sino-Vietnamese regularly gives their phonetic's Middle Chinese class.",
    },
    {
      href: "/insights#clusters",
      figure: String(clusterChars),
      title: "Old consonant clusters",
      text: "characters preserve a *bl-, *kl- or *ml- cluster in their spelling (巴 + 夌 for trăng).",
    },
    {
      href: "/variants",
      figure: String(variantGroups().length),
      title: "Variant spellings",
      text: "words are written more than one way, grouped by what changes between the spellings.",
    },
    {
      href: "/insights#time",
      figure: `${Math.min(...copyYears)}–${Math.max(...copyYears)}`,
      title: "Attestation over time",
      text: "when the dictionary's quoted copies were made, by period, for every component.",
    },
  ];
  return (
    <div>
      <PageHeader
        title="Nôm Component Explorer"
        subtitle="Look up a component to see every Nôm character built on it, then read what it does there: the range of syllables it spells as a phonetic, and the meaning fields it marks as a semantic element."
      />
      <div className="paper rounded-2xl p-6 sm:p-8 mb-12 border border-primary-gray">
        <SearchBox autoFocus />
        <div className="mt-4 text-sm text-[var(--ink-2)] flex flex-wrap items-center gap-2">
          Try
          {EXAMPLES.map((e) => (
            <Link key={e} href={`/component/${encodeURIComponent(e)}`} className="han text-xl px-2 py-0.5 rounded bg-white border border-primary-gray hover:border-branding-brown">
              {e}
            </Link>
          ))}
          <span className="text-[var(--ink-3)]">· several components together (宀子) finds characters with all of them</span>
        </div>
      </div>

      <section className="mb-12" aria-labelledby="insights-heading">
        <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
          <SectionTitle>
            <span id="insights-heading">Patterns across the dictionary</span>
          </SectionTitle>
          <Link
            href="/insights"
            className="px-4 py-2 rounded-xl bg-branding-black text-white text-[15px] hover:opacity-90"
          >
            Open Insights →
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {highlights.map((h) => (
            <Link
              key={h.title}
              href={h.href}
              className="group bg-white rounded-2xl border border-primary-gray p-5 hover:border-branding-brown flex flex-col"
            >
              <span className="text-xs uppercase tracking-wide text-[var(--ink-3)]">{h.title}</span>
              <span className="text-3xl text-branding-black tabular-nums mt-2">{h.figure}</span>
              <span className="text-sm text-[var(--ink-2)] mt-1 flex-1">{h.text}</span>
              <span className="text-sm text-[var(--brown-ink)] mt-3 group-hover:underline">See the analysis →</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
        <section>
          <SectionTitle note="Ranked by how many distinct characters use them as the sound element.">Most productive phonetics</SectionTitle>
          <Card>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {phonetic.slice(0, 48).map((s) => (
                <Link key={s.key} href={`/component/${encodeURIComponent(s.key)}`} className="tip rounded-lg border border-branding-gray hover:border-branding-brown px-2 py-2 text-center" data-tip={`${s.readings} readings, ${s.initials} initials`}>
                  <div className="han text-3xl leading-tight">{s.key}</div>
                  <div className="text-xs text-[var(--ink-2)]">{s.sv}</div>
                  <div className="text-[11px] text-[var(--ink-3)] tabular-nums">{s.chars} chars</div>
                </Link>
              ))}
            </div>
          </Card>
        </section>
        <section>
          <SectionTitle note="Ranked by number of characters.">Most productive semantics</SectionTitle>
          <Card>
            <div className="grid grid-cols-4 gap-2">
              {semantic.slice(0, 24).map((s) => (
                <Link key={s.key} href={`/component/${encodeURIComponent(s.key)}`} className="rounded-lg border border-branding-gray hover:border-branding-brown px-2 py-2 text-center">
                  <div className="han text-3xl leading-tight">{s.key}</div>
                  <div className="text-xs text-[var(--ink-2)]">{s.sv}</div>
                  <div className="text-[11px] text-[var(--ink-3)] tabular-nums">{s.chars}</div>
                </Link>
              ))}
            </div>
          </Card>
          <Link href="/insights" className="link text-sm inline-block mt-4">More patterns on the Insights page →</Link>
        </section>
      </div>
    </div>
  );
}
