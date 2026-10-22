import Link from "@/components/nom-explorer/Link";
import PageHeader, { Card, SectionTitle, Stat } from "@/components/nom-explorer/PageHeader";
import Bars from "@/components/nom-explorer/Bars";
import Heatmap from "@/components/nom-explorer/Heatmap";
import { HanLink } from "@/components/nom-explorer/Han";
import AttestationChart from "@/components/nom-explorer/AttestationChart";
import {
  allPhoneticPairs,
  attestation,
  componentStats,
  getDb,
  MC_CLASSES,
  MC_SV_TONE,
  normalize,
  reviewItems,
  variantGroups,
  VARIANT_KINDS,
  VARIANT_LABEL,
  type ComponentStat,
} from "@/lib/nom-explorer/data";
import { MATCH_KINDS, MATCH_LABEL, TONES, rimeChange, splitRime } from "@/lib/nom-explorer/viet";

export const metadata = { title: "Insights · Nôm Component Explorer" };

const CODE_LABEL: { [k: string]: string } = {
  A1: "Hán, meaning + SV reading",
  A2: "Hán, meaning + altered reading",
  B: "Hán, meaning + native reading",
  C1: "Hán, sound (exact SV)",
  C2: "Hán, sound (approximate SV)",
  D1: "Two phonetics, coordinate",
  D2: "Two phonetics, head + modifier",
  E1: "Two semantics, coordinate",
  E2: "Two semantics, head + modifier",
  F1: "Semantic + phonetic, coordinate",
  F2: "Semantic + phonetic, head + modifier",
  G1: "Modified, strokes removed",
  G2: "Modified, strokes added",
};

function CompTable({ rows, cols }: { rows: ComponentStat[]; cols: ("chars" | "readings" | "initials" | "rimes" | "faithful")[] }) {
  const head: { [k: string]: string } = { chars: "Chars", readings: "Readings", initials: "Initials", rimes: "Rimes", faithful: "Close to SV" };
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-[var(--ink-3)] text-xs">
        <tr className="border-b border-primary-gray">
          <th className="font-normal py-1.5">Phonetic</th>
          <th className="font-normal py-1.5">SV</th>
          {cols.map((c) => <th key={c} className="font-normal py-1.5 text-right">{head[c]}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((s) => (
          <tr key={s.key} className="border-b border-branding-gray last:border-0">
            <td className="py-1"><HanLink ch={s.key} className="text-2xl" /></td>
            <td className="py-1 text-[var(--ink-2)]">{s.sv}</td>
            {cols.map((c) => (
              <td key={c} className="py-1 text-right tabular-nums">
                {c === "faithful" ? `${Math.round(100 * s.faithful)}%` : s[c]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Insights() {
  const { records, byChar } = getDb();
  const { phonetic, semantic } = componentStats();
  const pairs = allPhoneticPairs();
  // Initial-only cluster elements are compared on the initial alone.
  const comparedAll = pairs.filter((p) => p.cmp && p.nom && p.svSyl);
  const compared = comparedAll.filter((p) => p.seg !== "onset");

  // Structural types
  const codeCounts = new Map<string, number>();
  for (const r of records) for (const c of new Set(r.a.flatMap((a) => a.codes))) codeCounts.set(c, (codeCounts.get(c) ?? 0) + 1);
  const codes = Object.keys(CODE_LABEL).map((c) => ({ label: c, value: codeCounts.get(c) ?? 0, tip: `${c}: ${CODE_LABEL[c]} (${codeCounts.get(c) ?? 0})` }));

  const productive = phonetic.filter((s) => s.records >= 6);
  const widest = [...productive].sort((a, b) => b.initials - a.initials || b.readings - a.readings).slice(0, 15);
  const faithful = [...productive].filter((s) => s.records >= 8).sort((a, b) => b.faithful - a.faithful || b.chars - a.chars).slice(0, 15);
  const loosest = [...productive].filter((s) => s.records >= 8).sort((a, b) => a.faithful - b.faithful).slice(0, 15);

  // Initial shifts across the whole dictionary
  const shiftMap = new Map<string, { n: number; ex: string[] }>();
  for (const p of comparedAll)
    if (!p.cmp!.sameInitial) {
      const k = `${p.svSyl!.initial} → ${p.nom!.initial}`;
      const e = shiftMap.get(k) ?? { n: 0, ex: [] };
      e.n++;
      if (e.ex.length < 6) e.ex.push(`${p.char} ${p.reading} (${p.sv})`);
      shiftMap.set(k, e);
    }
  const shifts = Array.from(shiftMap, ([label, e]) => ({ label, value: e.n, tip: e.ex.join(" · ") })).sort((a, b) => b.value - a.value);

  const kinds = MATCH_KINDS.map((k) => ({ label: MATCH_LABEL[k], value: compared.filter((p) => p.cmp!.kind === k).length }));

  // Old consonant clusters recorded in the dictionary's notes
  const clusterMap = new Map<string, Set<string>>();
  for (const r of records)
    for (const a of r.a)
      for (const n of a.notes)
        if (/\*|^[a-zđ]{1,2}l-|→/.test(n) && /-/.test(n)) {
          const s = clusterMap.get(n) ?? new Set<string>();
          s.add(`${r.c} ${r.r}`);
          clusterMap.set(n, s);
        }
  const clusters = Array.from(clusterMap, ([note, s]) => ({ note, items: Array.from(s) })).sort((a, b) => b.items.length - a.items.length);

  // Components working both as phonetic and as semantic element
  const semMap = new Map(semantic.map((s) => [s.key, s]));
  const dual = phonetic
    .filter((p) => p.chars >= 3 && (semMap.get(p.key)?.chars ?? 0) >= 3)
    .map((p) => ({ key: p.key, sv: p.sv, ph: p.chars, se: semMap.get(p.key)!.chars }))
    .sort((a, b) => Math.min(b.ph, b.se) - Math.min(a.ph, a.se))
    .slice(0, 24);

  // Source → written substitutions (廬 → 卢)
  const subMap = new Map<string, number>();
  for (const r of records)
    for (const a of r.a)
      for (const p of a.parts)
        if (p.src && normalize(p.src) !== normalize(p.ch)) subMap.set(`${p.src}→${p.ch}`, (subMap.get(`${p.src}→${p.ch}`) ?? 0) + 1);
  const subs = Array.from(subMap).sort((a, b) => b[1] - a[1]).slice(0, 30);

  // Characters with the most readings, and with competing analyses
  const multi = Array.from(byChar)
    .map(([c, rs]) => ({ c, readings: Array.from(new Set(rs.map((r) => r.r))), structs: new Set(rs.map((r) => r.s)).size }))
    .sort((a, b) => b.readings.length - a.readings.length)
    .slice(0, 20);
  const contested = records.filter((r) => r.a.length > 1).sort((a, b) => b.a.length - a.a.length || b.n - a.n).slice(0, 20);

  const svTones = [...TONES];
  const mcPairs = pairs.filter((p) => p.mc && p.nom && p.seg !== "onset");
  const mcRegularPct = Math.round((100 * mcPairs.filter((p) => MC_SV_TONE[p.mc!.cls].includes(p.nom!.tone)).length) / mcPairs.length);

  // Inside the rime
  const rimeMoved = compared.filter((p) => !p.cmp!.sameRime);
  const rimeParts = (["vowel", "final", "vowel + final"] as const).map((k) => ({
    label: k === "vowel + final" ? "Vowel & final" : k === "vowel" ? "Vowel only" : "Final only",
    value: rimeMoved.filter((p) => rimeChange(p.cmp!) === k).length,
  }));
  const rimeMap = new Map<string, { n: number; ex: string[] }>();
  for (const p of rimeMoved) {
    const k = `${p.svSyl!.rime} → ${p.nom!.rime}`;
    const e = rimeMap.get(k) ?? { n: 0, ex: [] };
    e.n++;
    if (e.ex.length < 6) e.ex.push(`${p.char} ${p.reading} (${p.sv})`);
    rimeMap.set(k, e);
  }
  const rimeShifts = Array.from(rimeMap, ([label, e]) => ({ label, value: e.n, tip: e.ex.join(" · ") })).sort((a, b) => b.value - a.value);
  const finalMap = new Map<string, number>();
  for (const p of rimeMoved.filter((p) => !p.cmp!.sameFinal)) {
    const f = (r: string) => splitRime(r).final || "∅";
    const k = `-${f(p.svSyl!.rime)} → -${f(p.nom!.rime)}`;
    finalMap.set(k, (finalMap.get(k) ?? 0) + 1);
  }
  const finalShifts = Array.from(finalMap, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  // Attestation: everything vs spellings flagged for old clusters
  const allAttested = attestation(records);
  const clusterChars = new Set(records.filter((r) => r.a.some((a) => a.notes.some((n) => n.includes("*") || /^[a-zđ]{1,2}l-/.test(n)))).map((r) => r.c));
  const clusterAttested = attestation(records.filter((r) => clusterChars.has(r.c)));

  // Variants
  const variants = variantGroups();
  const variantKinds = VARIANT_KINDS.map((k) => ({ label: VARIANT_LABEL[k], value: variants.filter((g) => g.kind === k).length, kind: k }));
  const toReview = reviewItems().length;

  return (
    <div>
      <PageHeader
        crumbs={[{ label: "Insights" }]}
        title="Insights"
        subtitle="Patterns across the whole of Tự điển chữ Nôm dẫn giải: which components do the most work, how far Nôm readings drift from their phonetics, and cases worth a closer look."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
        <Stat value={byChar.size.toLocaleString()} label="characters" />
        <Stat value={records.length.toLocaleString()} label="character + reading entries" />
        <Stat value={phonetic.length.toLocaleString()} label="distinct phonetic components" />
        <Stat value={pairs.length.toLocaleString()} label="phonetic relations" />
      </div>

      <section className="mb-14">
        <SectionTitle note="Entries by Nguyễn Quang Hồng's structural type. Hover a bar for the definition; the Guide page has the full scheme.">Structural types</SectionTitle>
        <Card><Bars data={codes} max={13} /></Card>
      </section>

      <section className="mb-14">
        <SectionTitle id="phonetics" note="Phonetics used in at least six entries. 'Close to SV' is the share of readings identical to the phonetic's Sino-Vietnamese reading or differing only in tone.">Phonetic components</SectionTitle>
        <div className="grid lg:grid-cols-3 gap-5">
          <Card>
            <h3 className="text-base font-normal mb-2">Most productive</h3>
            <CompTable rows={phonetic.slice(0, 15)} cols={["chars", "readings", "faithful"]} />
          </Card>
          <Card>
            <h3 className="text-base font-normal mb-2">Widest range of initials</h3>
            <CompTable rows={widest} cols={["chars", "initials", "rimes"]} />
          </Card>
          <Card>
            <h3 className="text-base font-normal mb-2">Most faithful to their SV reading</h3>
            <CompTable rows={faithful} cols={["chars", "readings", "faithful"]} />
          </Card>
        </div>
        <Card className="mt-5">
          <h3 className="text-base font-normal mb-1">Loosest fit to their SV reading</h3>
          <p className="text-sm text-[var(--ink-2)] mb-3">Phonetics whose Nôm readings rarely match their own reading: candidates for older (pre-Sino-Vietnamese) values, clusters, or semantic rather than phonetic motivation.</p>
          <div className="flex flex-wrap gap-2">
            {loosest.map((s) => (
              <Link key={s.key} href={`/component/${encodeURIComponent(s.key)}`} className="rounded-lg border border-branding-gray hover:border-branding-brown px-3 py-1.5 text-center">
                <span className="han text-2xl">{s.key}</span>
                <span className="block text-xs text-[var(--ink-2)]">{s.sv} · {Math.round(100 * s.faithful)}%</span>
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <section className="mb-14">
        <SectionTitle id="sounds" note="Each Nôm reading compared with its phonetic's Sino-Vietnamese reading, across all compound phonetics and sound loans.">Sound correspondences</SectionTitle>
        <div className="grid lg:grid-cols-2 gap-5">
          <Card>
            <h3 className="text-base font-normal mb-3">How far readings move</h3>
            <Bars data={kinds} labelClass="text-xs" labelWidth="8.5rem" />
          </Card>
          <Card>
            <h3 className="text-base font-normal mb-3">Tone: SV of phonetic → Nôm reading</h3>
            <Heatmap rows={svTones} cols={[...TONES]} rowTitle="SV" colTitle="Nôm" cell={(r, c) => compared.filter((p) => p.svSyl!.tone === r && p.nom!.tone === c).length} />
          </Card>
        </div>
        <Card className="mt-5">
          <h3 className="text-base font-normal mb-1">Tone: Middle Chinese of phonetic → Nôm reading</h3>
          <p className="text-sm text-[var(--ink-2)] mb-3 max-w-3xl">
            The phonetic&rsquo;s Guangyun tone and initial voicing (清 voiceless, 次濁 sonorant, 全濁 voiced obstruent), for{" "}
            {mcPairs.length.toLocaleString()} of {pairs.length.toLocaleString()} phonetic relations. Where a phonetic has several
            readings, the one whose class regularly gives its Sino-Vietnamese tone is used. {mcRegularPct}% of Nôm readings
            take that regular Sino-Vietnamese tone; the bordered cell in each row is the regular reflex.
          </p>
          <Heatmap
            rows={[...MC_CLASSES]}
            cols={[...TONES]}
            rowTitle="MC"
            colTitle="Nôm"
            cell={(r, c) => mcPairs.filter((p) => p.mc!.cls === r && p.nom!.tone === c).length}
            outline={(r, c) => MC_SV_TONE[r as (typeof MC_CLASSES)[number]].includes(c as never)}
          />
        </Card>
        <div className="grid lg:grid-cols-2 gap-5 mt-5">
          <Card>
            <h3 className="text-base font-normal mb-1">Inside the rime</h3>
            <p className="text-sm text-[var(--ink-2)] mb-3">
              Of {rimeMoved.length.toLocaleString()} readings whose rime differs from the phonetic&rsquo;s, which part moved.
            </p>
            <Bars data={rimeParts} labelWidth="7rem" labelClass="text-xs" />
            <h4 className="text-sm text-[var(--ink-2)] mt-5 mb-2">Final consonant changes</h4>
            <Bars data={finalShifts} max={10} labelWidth="7rem" labelClass="text-xs" />
          </Card>
          <Card>
            <h3 className="text-base font-normal mb-1">Most frequent rime shifts</h3>
            <p className="text-sm text-[var(--ink-2)] mb-3">Hover a bar for examples.</p>
            <Bars data={rimeShifts} max={18} labelWidth="7rem" labelClass="text-xs" />
          </Card>
        </div>
        <Card className="mt-5">
          <h3 className="text-base font-normal mb-1">Most frequent initial shifts</h3>
          <p className="text-sm text-[var(--ink-2)] mb-3">Hover a bar for examples. Recurrent pairs such as l → tr or c/k → tr echo the old clusters the dictionary flags below.</p>
          <Bars data={shifts} max={24} labelClass="text-xs" />
        </Card>
      </section>

      <section className="mb-14">
        <SectionTitle id="time" note={<>Every citation in the dictionary, grouped by the date of its source. Dates come from the dictionary&rsquo;s source notes; see <Link href="/sources" className="link">Sources</Link>.</>}>
          Attestation over time
        </SectionTitle>
        <div className="grid lg:grid-cols-2 gap-5">
          <Card>
            <h3 className="text-base font-normal mb-4">All characters</h3>
            <AttestationChart rows={allAttested} />
          </Card>
          <Card>
            <h3 className="text-base font-normal mb-1">Old-cluster spellings</h3>
            <p className="text-sm text-[var(--ink-2)] mb-4">{clusterChars.size} characters the dictionary marks with a cluster note such as [*kl- → tr-]. Compare where their citations fall with the overall spread.</p>
            <AttestationChart rows={clusterAttested} />
          </Card>
        </div>
      </section>

      <section className="mb-14">
        <SectionTitle note="Words written more than one way: different characters with the same reading and gloss, grouped by what changes between the spellings.">
          Variant spellings
        </SectionTitle>
        <Card>
          <ul className="space-y-1.5 text-sm">
            {variantKinds.map((v) => (
              <li key={v.kind} className="flex justify-between gap-4 border-b border-branding-gray last:border-0 py-1">
                <Link href={`/variants?kind=${encodeURIComponent(v.kind)}`} className="hover:text-[var(--brown-ink)]">{v.label}</Link>
                <span className="tabular-nums">{v.value}</span>
              </li>
            ))}
          </ul>
          <Link href="/variants" className="link text-sm inline-block mt-3">All {variants.length} words with variant spellings →</Link>
        </Card>
      </section>

      <section className="mb-14">
        <SectionTitle note="Characters whose phonetic the explorer had to infer without clear sound evidence.">Needs review</SectionTitle>
        <Card>
          <p className="text-sm">
            {toReview.toLocaleString()} semantic + phonetic characters.{" "}
            <Link href="/review" className="link">Open the review list</Link>
          </p>
        </Card>
      </section>

      {clusters.length > 0 && (
        <section className="mb-14">
          <SectionTitle id="clusters" note="Notes the dictionary attaches to a structure, such as [*kl- → tr-], marking readings that preserve an older initial cluster.">Old consonant clusters</SectionTitle>
          <Card>
            <ul className="space-y-2 text-sm">
              {clusters.map(({ note, items }) => (
                <li key={note} className="grid sm:grid-cols-[10rem_1fr] gap-2">
                  <span className="font-normal">[{note}] <span className="text-[var(--ink-3)]">{items.length}</span></span>
                  <span className="flex flex-wrap gap-x-3 gap-y-1">
                    {items.map((it) => {
                      const [c, r] = it.split(" ");
                      return <span key={it}><HanLink ch={c} className="text-lg" /> {r}</span>;
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}

      <section className="mb-14 grid lg:grid-cols-2 gap-5">
        <div>
          <SectionTitle note="Components used at least three times in each role.">Both phonetic and semantic</SectionTitle>
          <Card>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {dual.map((d) => (
                <Link key={d.key} href={`/component/${encodeURIComponent(d.key)}`} className="rounded-lg border border-branding-gray hover:border-branding-brown px-2 py-2 text-center">
                  <div className="han text-2xl">{d.key}</div>
                  <div className="text-[11px] text-[var(--ink-3)]">{d.ph} phon · {d.se} sem</div>
                </Link>
              ))}
            </div>
          </Card>
        </div>
        <div>
          <SectionTitle note="Where the dictionary names one character as the component but the glyph writes another (廬 → 卢).">Substituted components</SectionTitle>
          <Card>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {subs.map(([k, n]) => {
                const [a, b] = Array.from(k.split("→"));
                return (
                  <span key={k}>
                    <HanLink ch={a} className="text-xl" /> → <HanLink ch={b} className="text-xl" /> <span className="text-[var(--ink-3)]">{n}</span>
                  </span>
                );
              })}
            </div>
          </Card>
        </div>
      </section>

      <section className="mb-14 grid lg:grid-cols-2 gap-5">
        <div>
          <SectionTitle note="One glyph standing for many different syllables.">Characters with the most readings</SectionTitle>
          <Card>
            <ul className="space-y-1.5 text-sm">
              {multi.map((m) => (
                <li key={m.c} className="flex gap-3 items-baseline">
                  <HanLink ch={m.c} className="text-2xl" />
                  <span className="tabular-nums text-[var(--ink-3)] w-6">{m.readings.length}</span>
                  <span>{m.readings.join(", ")}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div>
          <SectionTitle note="Entries for which the dictionary gives more than one structural analysis.">Competing analyses</SectionTitle>
          <Card>
            <ul className="space-y-1.5 text-sm">
              {contested.map((r, i) => (
                <li key={i} className="flex gap-3 items-baseline">
                  <HanLink ch={r.c} className="text-2xl" />
                  <span className="font-normal w-12">{r.r}</span>
                  <span className="han text-[var(--ink-2)]">{r.s}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>
    </div>
  );
}
