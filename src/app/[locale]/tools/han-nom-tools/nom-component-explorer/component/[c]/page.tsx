import Link from "@/components/nom-explorer/Link";
import PageHeader, { Card, SectionTitle, Stat } from "@/components/nom-explorer/PageHeader";
import Bars, { type Bar } from "@/components/nom-explorer/Bars";
import Heatmap from "@/components/nom-explorer/Heatmap";
import AttestationChart from "@/components/nom-explorer/AttestationChart";
import { HanLink } from "@/components/nom-explorer/Han";
import {
  analyzeComponent,
  attestation,
  dvnLookupUrl,
  earliest,
  mcReadings,
  MC_CLASSES,
  MC_SV_TONE,
  type PhoneticUse,
  type Use,
} from "@/lib/nom-explorer/data";
import { MATCH_KINDS, MATCH_LABEL, TONES, rimeChange, type MatchKind } from "@/lib/nom-explorer/viet";

const CLOSENESS: Record<MatchKind, number> = {
  identical: 0,
  "tone only": 1,
  initial: 2,
  rime: 2,
  "initial + rime": 3,
};
const CLOSE_STYLE = [0, 1, 2, 3].map((i) => ({
  background: `var(--close-${i})`,
  color: `var(--close-${i}-fg)`,
}));

function countBy<T>(items: T[], key: (t: T) => string | undefined): Bar[] {
  const m = new Map<string, number>();
  for (const it of items) {
    const k = key(it);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Array.from(m, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

// One row per character + reading: alternative analyses of the same entry
// would otherwise count twice.
function dedupe(list: PhoneticUse[]) {
  const seen = new Map<string, PhoneticUse>();
  for (const u of list) {
    const k = `${u.char}|${u.reading}`;
    const prev = seen.get(k);
    if (!prev || (u.cmp && prev.cmp && CLOSENESS[u.cmp.kind] < CLOSENESS[prev.cmp.kind])) seen.set(k, u);
  }
  return Array.from(seen.values());
}

export async function generateMetadata({ params }: { params: { c: string } }) {
  return { title: `${decodeURIComponent(params.c)} · Nôm Component Explorer` };
}

export default function ComponentPage({ params }: { params: { c: string } }) {
  const input = decodeURIComponent(params.c);
  const rep = analyzeComponent(input);
  const pool = dedupe([...rep.phonetic, ...rep.ownLoans]);
  const compoundPhon = dedupe(rep.phonetic.filter((p) => !p.wholeLoan));
  const loans = dedupe([...rep.phonetic.filter((p) => p.wholeLoan), ...rep.ownLoans]);
  const semChars = new Set(rep.semantic.map((u) => u.rec.c));
  const sv = rep.sv.join(", ");
  const nothing = !pool.length && !rep.semantic.length && !rep.other.length && !rep.ownRecords.length;
  const attested = attestation(
    Array.from(new Set([...pool.map((p) => p.rec), ...rep.semantic.map((u) => u.rec), ...rep.other.map((u) => u.rec)]))
  );

  return (
    <div>
      <PageHeader
        crumbs={[{ label: "Component" }, { label: input }]}
        title={
          <span className="flex items-end gap-5">
            <span className="han text-[88px] leading-none">{input}</span>
            <span className="pb-2">
              {sv && <span className="text-2xl text-[var(--brown-ink)]">{sv}</span>}
              {rep.key !== input && (
                <span className="block text-sm text-[var(--ink-3)] mt-1">
                  grouped with <span className="han text-base">{rep.key}</span>
                </span>
              )}
            </span>
          </span>
        }
        subtitle={
          <>
            {rep.forms.length > 1 && (
              <span className="block mb-1">
                Written as <span className="han text-lg">{rep.forms.join(" ")}</span> in the dictionary.{" "}
              </span>
            )}
            {mcReadings(input).length > 0 && (
              <span className="block mb-1 text-sm text-[var(--ink-2)]">
                Middle Chinese (Guangyun):{" "}
                {mcReadings(input)
                  .map((r) => `${r.desc}${r.fanqie ? ` (${r.fanqie}切)` : ""}`)
                  .join(" · ")}
              </span>
            )}
            <a className="link text-sm" href={dvnLookupUrl(input)} target="_blank" rel="noreferrer">
              Open {input} in the DVN Hán-Nôm Lookup ↗
            </a>
          </>
        }
      />

      {nothing ? (
        <Card>
          <p>
            No character in <em>Tự điển chữ Nôm dẫn giải</em> is analysed with <span className="han">{input}</span> as
            a component. The dictionary only breaks down characters created for Nôm (types D, E, F, G), so a
            component that appears only inside borrowed Hán characters will not show up here.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <Stat value={rep.directChars} label="characters built on it" />
            <Stat value={new Set(compoundPhon.map((p) => p.char)).size} label="as phonetic" />
            <Stat value={semChars.size} label="as semantic" />
            <Stat value={loans.length} label="borrowed whole for sound" />
            <Stat value={rep.deep.length} label="contain it at a deeper level" />
          </div>
          <nav className="flex flex-wrap gap-2 text-sm mb-10">
            {pool.length > 0 && <a href="#phonetic" className="px-3 py-1 rounded-full bg-white border border-primary-gray hover:border-branding-brown">Phonetic range</a>}
            {rep.semantic.length > 0 && <a href="#semantic" className="px-3 py-1 rounded-full bg-white border border-primary-gray hover:border-branding-brown">Semantic uses</a>}
            {rep.other.length > 0 && <a href="#other" className="px-3 py-1 rounded-full bg-white border border-primary-gray hover:border-branding-brown">Other relations</a>}
            {attested.length > 0 && <a href="#attested" className="px-3 py-1 rounded-full bg-white border border-primary-gray hover:border-branding-brown">Attestation</a>}
            {rep.deep.length > 0 && <a href="#deep" className="px-3 py-1 rounded-full bg-white border border-primary-gray hover:border-branding-brown">Deeper containment</a>}
            {rep.ownRecords.length > 0 && <a href="#own" className="px-3 py-1 rounded-full bg-white border border-primary-gray hover:border-branding-brown">Its own entries</a>}
          </nav>

          {pool.length > 0 && <PhoneticSection input={input} sv={sv} pool={pool} />}
          {rep.semantic.length > 0 && <SemanticSection input={input} uses={rep.semantic} />}
          {rep.other.length > 0 && <OtherSection uses={rep.other} />}
          {attested.length > 0 && (
            <section className="mb-14">
              <SectionTitle
                id="attested"
                note={<>Citations in the dictionary for every character built on <span className="han">{input}</span>, grouped by the date of the source. Dates are approximate; switch between the date of the copy quoted and the date the work was composed.</>}
              >
                Attestation
              </SectionTitle>
              <Card>
                <AttestationChart rows={attested} />
              </Card>
            </section>
          )}
          {rep.deep.length > 0 && <DeepSection input={input} deep={rep.deep} />}
          {rep.ownRecords.length > 0 && (
            <section className="mb-14">
              <SectionTitle id="own" note="How the dictionary analyses this character itself.">
                Its own entries
              </SectionTitle>
              <Card>
                <ul className="space-y-1.5 text-sm">
                  {rep.ownRecords.map((r, i) => (
                    <li key={i} className="flex gap-3 flex-wrap">
                      <span className="w-16 font-normal">{r.r}</span>
                      <span className="han text-[var(--ink-2)]">{r.s}</span>
                      <span className="text-[var(--ink-3)]">{r.d}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function PhoneticSection({ input, sv, pool: all }: { input: string; sv: string; pool: PhoneticUse[] }) {
  // Uses where this element spells only the initial of a cluster are
  // compared on the initial alone; everything else covers the syllable.
  const onsetUses = all.filter((p) => p.seg === "onset");
  const pool = all.filter((p) => p.seg !== "onset");
  const svSyls = pool.map((p) => p.svSyl).filter(Boolean);
  const svInitial = svSyls[0]?.initial;
  const svRime = svSyls[0]?.rime;
  const svTone = svSyls[0]?.tone;
  const mark = (v: string, own?: string) => (v === own ? "SV" : undefined);

  const readings = new Map<string, { count: number; chars: string[]; close: number }>();
  for (const p of pool) {
    const e = readings.get(p.reading) ?? { count: 0, chars: [], close: 3 };
    e.count++;
    e.chars.push(p.char);
    if (p.cmp) e.close = Math.min(e.close, CLOSENESS[p.cmp.kind]);
    readings.set(p.reading, e);
  }
  const readingList = Array.from(readings, ([r, e]) => ({ r, ...e })).sort(
    (a, b) => a.close - b.close || b.count - a.count || a.r.localeCompare(b.r, "vi")
  );

  const kinds = MATCH_KINDS.map((k) => ({
    label: MATCH_LABEL[k],
    value: pool.filter((p) => p.cmp?.kind === k).length,
  })).filter((b) => b.value);

  const initials = countBy(all, (p) => p.nom?.initial).map((b) => ({ ...b, marker: mark(b.label, svInitial) }));
  const rimes = countBy(pool, (p) => p.nom?.rime).map((b) => ({ ...b, marker: mark(b.label, svRime) }));
  const tones = TONES.map((t) => ({ label: t, value: pool.filter((p) => p.nom?.tone === t).length, marker: mark(t, svTone) })).filter((b) => b.value);

  const svTones = TONES.filter((t) => pool.some((p) => p.svSyl?.tone === t));
  const shifts = countBy(
    all.filter((p) => p.cmp && !p.cmp.sameInitial),
    (p) => `${p.svSyl!.initial} → ${p.nom!.initial}`
  );
  const clusterNotes = all.filter((p) => p.notes.some((n) => n.includes("*") || /\b[a-z]l-/.test(n)));
  const rimeMoved = pool.filter((p) => p.cmp && !p.cmp.sameRime);
  const rimeParts = (["vowel", "final", "vowel + final"] as const)
    .map((k) => ({ label: k === "vowel + final" ? "Vowel & final" : k === "vowel" ? "Vowel only" : "Final only", value: rimeMoved.filter((p) => rimeChange(p.cmp!) === k).length }))
    .filter((b) => b.value);
  const rimeShifts = countBy(rimeMoved, (p) => `${p.svSyl!.rime} → ${p.nom!.rime}`);
  const mcPool = pool.filter((p) => p.mc && p.nom);
  const mcRows = MC_CLASSES.filter((c) => mcPool.some((p) => p.mc!.cls === c));
  const mcRegular = mcPool.filter((p) => MC_SV_TONE[p.mc!.cls].includes(p.nom!.tone)).length;

  return (
    <section className="mb-14">
      <SectionTitle
        id="phonetic"
        note={
          <>
            Every syllable <span className="han">{input}</span> spells, either as the sound element of a compound (F, D)
            or borrowed whole for its sound (C1, C2). Each reading is compared with the phonetic&rsquo;s Sino-Vietnamese
            reading{sv && <> (<strong className="font-normal">{sv}</strong>)</>}. Initials are grouped by sound, so c/k
            and g/gh count as one.
          </>
        }
      >
        Phonetic range
      </SectionTitle>

      {onsetUses.length > 0 && (
        <Card className="mb-5">
          <h3 className="text-base font-normal mb-1">Initial only: {onsetUses.length} cluster spellings</h3>
          <p className="text-sm text-[var(--ink-2)] mb-3 max-w-3xl">
            In these two-phonetic compounds <span className="han">{input}</span> gives only the initial, usually the first
            consonant of an old cluster, and the other element gives the rime. They count toward initials below but not
            toward rimes, tones or the reading spread. Correct any of them on the{" "}
            <Link href="/review?kind=onset" className="link">Review</Link> page.
          </p>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1.5 text-sm">
            {onsetUses.map((p, i) => (
              <li key={i} className="flex items-baseline gap-2">
                <HanLink ch={p.char} className="text-xl" />
                <Link href={`/syllable/${encodeURIComponent(p.reading)}`} className="font-normal hover:text-[var(--brown-ink)]">{p.reading}</Link>
                {p.partner && (
                  <span className="text-[var(--ink-3)]">
                    rime from <HanLink ch={p.partner.src ?? p.partner.ch} /> {p.partner.sv}
                  </span>
                )}
                {p.notes.length > 0 && <span className="text-xs text-[var(--ink-3)]">[{p.notes.join("; ")}]</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="mb-5">
        <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
          <h3 className="text-base font-normal">
            {readings.size} distinct readings across {pool.length} uses{onsetUses.length > 0 && " that spell the whole syllable or its rime"}
          </h3>
          <div className="flex items-center gap-3 text-xs text-[var(--ink-2)]">
            {["Identical", "Tone differs", "Initial or rime differs", "Both differ"].map((l, i) => (
              <span key={l} className="flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm" style={CLOSE_STYLE[i]} />
                {l}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {readingList.map(({ r, count, chars, close }) => (
            <Link
              key={r}
              href={`/syllable/${encodeURIComponent(r)}`}
              className="tip px-2.5 py-1 rounded-md text-[15px] hover:underline"
              style={CLOSE_STYLE[close]}
              data-tip={`${r}: ${Array.from(new Set(chars)).join(" ")} (every spelling of ${r} →)`}
            >
              {r}
              {count > 1 && <sup className="ml-0.5 opacity-80">{count}</sup>}
            </Link>
          ))}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <Card>
          <h3 className="text-base font-normal mb-3">How far readings move from {sv || "the phonetic"}</h3>
          <Bars data={kinds} labelClass="text-xs" labelWidth="8.5rem" />
        </Card>
        <Card>
          <h3 className="text-base font-normal mb-3">Tone of the Nôm reading</h3>
          <Bars data={tones} />
        </Card>
        <Card>
          <h3 className="text-base font-normal mb-3">Initials</h3>
          <Bars data={initials} />
        </Card>
        <Card>
          <h3 className="text-base font-normal mb-3">Rimes</h3>
          <Bars data={rimes} />
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-5 mb-5">
        <Card>
          <h3 className="text-base font-normal mb-3">Tone: Sino-Vietnamese → Nôm</h3>
          <Heatmap rows={svTones} cols={[...TONES]} rowTitle="SV" colTitle="Nôm" cell={(r, c) => pool.filter((p) => p.svSyl?.tone === r && p.nom?.tone === c).length} />
        </Card>
        <Card>
          <h3 className="text-base font-normal mb-1">Tone: Middle Chinese → Nôm</h3>
          <p className="text-sm text-[var(--ink-2)] mb-3">
            {mcPool.length} of {pool.length} uses have a Guangyun reading for the phonetic.
            {mcPool.length > 0 && <> {Math.round((100 * mcRegular) / mcPool.length)}% take the tone Sino-Vietnamese regularly gives that class.</>}
          </p>
          {mcPool.length > 0 && (
            <Heatmap rows={mcRows} cols={[...TONES]} rowTitle="MC" colTitle="Nôm" cell={(r, c) => mcPool.filter((p) => p.mc!.cls === r && p.nom?.tone === c).length} />
          )}
        </Card>
        <Card>
          <h3 className="text-base font-normal mb-1">Inside the rime</h3>
          <p className="text-sm text-[var(--ink-2)] mb-3">
            Of {rimeMoved.length} readings whose rime differs from {sv || "the phonetic"}, which part moved.
          </p>
          {rimeMoved.length ? (
            <>
              <Bars data={rimeParts} labelWidth="7rem" labelClass="text-xs" />
              <h4 className="text-sm text-[var(--ink-2)] mt-4 mb-2">Rime shifts</h4>
              <Bars data={rimeShifts} max={8} labelWidth="7rem" labelClass="text-xs" />
            </>
          ) : (
            <p className="text-sm text-[var(--ink-3)]">Every reading keeps the phonetic&rsquo;s rime.</p>
          )}
        </Card>
        <Card>
          <h3 className="text-base font-normal mb-3">Initial shifts</h3>
          {shifts.length ? <Bars data={shifts} labelClass="text-xs" /> : <p className="text-sm text-[var(--ink-3)]">Every reading keeps the phonetic&rsquo;s initial.</p>}
          {clusterNotes.length > 0 && (
            <div className="mt-4 pt-3 border-t border-primary-gray text-sm">
              <div className="text-[var(--ink-2)] mb-1">Old consonant clusters noted by the dictionary</div>
              {clusterNotes.map((p, i) => (
                <div key={i}>
                  <HanLink ch={p.char} /> {p.reading}: {p.notes.join("; ")}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <UseTable rows={all} />
    </section>
  );
}

function UseTable({ rows }: { rows: PhoneticUse[] }) {
  const sorted = [...rows].sort(
    (a, b) =>
      (a.cmp ? CLOSENESS[a.cmp.kind] : 9) - (b.cmp ? CLOSENESS[b.cmp.kind] : 9) ||
      a.reading.localeCompare(b.reading, "vi")
  );
  return (
    <Card className="p-0 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-[var(--ink-3)] text-xs">
          <tr className="border-b border-primary-gray">
            <th className="font-normal px-4 py-2">Char</th>
            <th className="font-normal px-2 py-2">Nôm</th>
            <th className="font-normal px-2 py-2">Phonetic SV</th>
            <th className="font-normal px-2 py-2">MC</th>
            <th className="font-normal px-2 py-2">Difference</th>
            <th className="font-normal px-2 py-2">Paired with</th>
            <th className="font-normal px-2 py-2">Type</th>
            <th className="font-normal px-2 py-2">Gloss</th>
            <th className="font-normal px-2 py-2">Earliest</th>
            <th className="font-normal px-4 py-2 text-right">Cites</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p, i) => (
            <tr key={i} className="border-b border-branding-gray last:border-0 align-top">
              <td className="px-4 py-2"><HanLink ch={p.char} className="text-2xl" /></td>
              <td className="px-2 py-2 font-normal">
                <Link href={`/syllable/${encodeURIComponent(p.reading)}`} className="hover:text-[var(--brown-ink)]">{p.reading}</Link>
              </td>
              <td className="px-2 py-2">
                {p.sv}
                {p.viaSource && <span className="han text-[var(--ink-3)]"> ({p.written})</span>}
              </td>
              <td className="px-2 py-2 whitespace-nowrap text-[var(--ink-2)]">
                {p.mc && (
                  <span
                    className="tip cursor-help"
                    data-tip={`${p.mc.desc}${p.mc.fanqie ? ` ${p.mc.fanqie}切` : ""} · ${p.mc.cls}${p.mc.fit === "regular" ? "" : p.mc.fit === "irregular" ? " · SV tone is not this class's regular reflex" : " · several readings; none fits the SV tone"}`}
                  >
                    {p.mc.cls}
                    {p.mc.fit !== "regular" && <span className="text-[var(--brown-ink)]">*</span>}
                  </span>
                )}
              </td>
              <td className="px-2 py-2 whitespace-nowrap">
                {p.cmp && p.seg !== "onset" && <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5" style={CLOSE_STYLE[CLOSENESS[p.cmp.kind]]} />}
                {p.seg === "onset" ? (
                  <span className="text-[var(--ink-2)]">
                    Initial only{p.partner && <> (rime: <span className="han">{p.partner.src ?? p.partner.ch}</span>)</>}
                  </span>
                ) : p.cmp ? (
                  MATCH_LABEL[p.cmp.kind]
                ) : (
                  "—"
                )}
              </td>
              <td className="px-2 py-2">{p.semantic ? <HanLink ch={p.semantic} className="text-lg" /> : p.wholeLoan ? <span className="text-[var(--ink-3)]">whole</span> : ""}</td>
              <td className="px-2 py-2 text-[var(--ink-2)] whitespace-nowrap">
                {p.code}
                {p.basis && p.basis !== "sound" && (
                  <span
                    className="tip ml-1 text-[var(--brown-ink)] cursor-help"
                    data-tip={
                      p.basis === "reviewed"
                        ? "Phonetic confirmed on the Review page"
                        : p.basis === "precedent"
                          ? "Phonetic role inferred from how these components behave elsewhere"
                          : "Phonetic role assumed from layout; no other evidence"
                    }
                  >
                    {p.basis === "reviewed" ? "✓" : "≈"}
                  </span>
                )}
              </td>
              <td className="px-2 py-2 text-[var(--ink-2)] min-w-[14rem]">{p.def}</td>
              <td className="px-2 py-2 text-[var(--ink-2)] whitespace-nowrap">
                {(() => {
                  const e = earliest(p.rec);
                  return e ? <>{e.short} <span className="tabular-nums text-[var(--ink-3)]">{e.year}</span></> : null;
                })()}
              </td>
              <td className="px-4 py-2 text-right tabular-nums text-[var(--ink-3)]">{p.cites}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function SemanticSection({ input, uses }: { input: string; uses: Use[] }) {
  const byChar = new Map<string, Use[]>();
  for (const u of uses) byChar.set(u.rec.c, [...(byChar.get(u.rec.c) ?? []), u]);
  const phonetics = countBy(uses, (u) => u.partner?.ch);
  return (
    <section className="mb-14">
      <SectionTitle id="semantic" note={<>Characters where <span className="han">{input}</span> marks the meaning field (F) or contributes meaning to a two-part meaning compound (E).</>}>
        Semantic uses
      </SectionTitle>
      {phonetics.length > 1 && (
        <Card className="mb-5">
          <h3 className="text-base font-normal mb-3">Phonetics it combines with most</h3>
          <div className="flex flex-wrap gap-2">
            {phonetics.slice(0, 40).map((b) => (
              <Link key={b.label} href={`/component/${encodeURIComponent(b.label)}`} className="px-2 py-1 rounded-md border border-primary-gray hover:border-branding-brown bg-white">
                <span className="han text-xl">{b.label}</span>
                {b.value > 1 && <sup className="ml-0.5 text-[var(--ink-3)]">{b.value}</sup>}
              </Link>
            ))}
          </div>
        </Card>
      )}
      <Card className="p-0 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[var(--ink-3)] text-xs">
            <tr className="border-b border-primary-gray">
              <th className="font-normal px-4 py-2">Char</th>
              <th className="font-normal px-2 py-2">Nôm</th>
              <th className="font-normal px-2 py-2">With</th>
              <th className="font-normal px-2 py-2">Type</th>
              <th className="font-normal px-2 py-2">Gloss</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(byChar).flatMap(([ch, list]) =>
              Array.from(new Map(list.map((u) => [u.rec.r, u])).values()).map((u, i) => (
                <tr key={ch + i} className="border-b border-branding-gray last:border-0 align-top">
                  <td className="px-4 py-2">{i === 0 && <HanLink ch={ch} className="text-2xl" />}</td>
                  <td className="px-2 py-2 font-normal">{u.rec.r}</td>
                  <td className="px-2 py-2">
                    {u.partner && <HanLink ch={u.partner.ch} className="text-lg" />} <span className="text-[var(--ink-3)]">{u.partner?.sv}</span>
                  </td>
                  <td className="px-2 py-2 text-[var(--ink-2)]">{u.analysis.codes.join("|")}</td>
                  <td className="px-2 py-2 text-[var(--ink-2)]">{u.rec.d}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </section>
  );
}

const OTHER_LABEL: { [k: string]: string } = {
  marker: "Reading mark (dấu cá), spells no sound",
  modified: "Modified form (G)",
  "loan-semantic": "Variant of a Hán character borrowed for meaning (A, B)",
  part: "Component (role not stated)",
};

function OtherSection({ uses }: { uses: Use[] }) {
  return (
    <section className="mb-14">
      <SectionTitle id="other" note="Characters derived from this one by adding or removing strokes, or written variants of it.">
        Other relations
      </SectionTitle>
      <Card>
        <ul className="space-y-2 text-sm">
          {uses.map((u, i) => (
            <li key={i} className="flex gap-3 items-baseline flex-wrap">
              <HanLink ch={u.rec.c} className="text-2xl" />
              <span className="font-normal">{u.rec.r}</span>
              <span className="text-[var(--ink-3)]">{OTHER_LABEL[u.part.role] ?? u.part.role}</span>
              <span className="han text-[var(--ink-2)]">{u.rec.s}</span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}

function DeepSection({ input, deep }: { input: string; deep: { char: string; readings: string[]; path: string[]; depth: number }[] }) {
  return (
    <section className="mb-14">
      <SectionTitle id="deep" note={<>Characters built on a character that itself contains <span className="han">{input}</span>, following the dictionary&rsquo;s analyses.</>}>
        Deeper containment
      </SectionTitle>
      <Card>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm">
          {deep.map((d) => (
            <li key={d.char} className="flex items-baseline gap-2">
              <HanLink ch={d.char} className="text-2xl" />
              <span className="font-normal">{d.readings.join(", ")}</span>
              <span className="han text-[var(--ink-3)]">{d.path.join(" › ")}</span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
