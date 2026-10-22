import Link from "@/components/nom-explorer/Link";
import PageHeader, { Card, SectionTitle, Stat } from "@/components/nom-explorer/PageHeader";
import Bars from "@/components/nom-explorer/Bars";
import AttestationChart from "@/components/nom-explorer/AttestationChart";
import { HanLink } from "@/components/nom-explorer/Han";
import { attestation, earliest, normalize, spellingsOf, variantGroups, VARIANT_LABEL, type Spelling } from "@/lib/nom-explorer/data";
import { parseSyllable } from "@/lib/nom-explorer/viet";

const TYPE_LABEL: { [k: string]: string } = {
  A: "Hán loan for meaning",
  B: "Hán loan, native reading",
  C: "Hán loan for sound",
  D: "Two phonetics",
  E: "Two semantics",
  F: "Semantic + phonetic",
  G: "Modified form",
  "?": "Unlabelled",
};

export async function generateMetadata({ params }: { params: { r: string } }) {
  return { title: `${decodeURIComponent(params.r)} · Nôm Component Explorer` };
}

function tally(list: Spelling[], key: (s: Spelling) => string | undefined) {
  const m = new Map<string, number>();
  for (const s of list) {
    const k = key(s);
    if (k) m.set(k, (m.get(k) ?? 0) + 1);
  }
  return Array.from(m, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export default function SyllablePage({ params }: { params: { r: string } }) {
  const reading = decodeURIComponent(params.r).toLowerCase().normalize("NFC");
  const spellings = spellingsOf(reading);
  const syl = parseSyllable(reading);
  const phonetics = tally(spellings, (s) => s.phonetic && normalize(s.phonetic.src ?? s.phonetic.ch));
  const semantics = tally(spellings, (s) => s.semantic && normalize(s.semantic.src ?? s.semantic.ch));
  const types = tally(spellings, (s) => TYPE_LABEL[s.code[0]] ?? s.code);
  const groups = variantGroups().filter((g) => g.reading === reading);
  const attested = attestation(spellings.map((s) => s.rec));

  return (
    <div>
      <PageHeader
        crumbs={[{ label: "Syllable" }, { label: reading }]}
        title={<span className="text-[56px] leading-none">{reading}</span>}
        subtitle={
          <>
            Every character <em>Tự điển chữ Nôm dẫn giải</em> reads <strong className="font-normal">{reading}</strong>,
            and how each one spells it.
            {syl && (
              <span className="block text-sm text-[var(--ink-3)] mt-1">
                initial {syl.initial} · rime {syl.rime} · tone {syl.tone}
              </span>
            )}
          </>
        }
      />

      {!spellings.length ? (
        <Card>
          <p>No character in the dictionary is read <strong className="font-normal">{reading}</strong>. Check the tone mark, or search for a component instead.</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
            <Stat value={new Set(spellings.map((s) => s.rec.c)).size} label="characters" />
            <Stat value={phonetics.length} label="different phonetics" />
            <Stat value={groups.length} label="words with variant spellings" />
            <Stat value={attested.reduce((n, a) => n + a.cites, 0)} label="citations" />
          </div>

          <section className="mb-14 grid md:grid-cols-3 gap-5">
            <Card>
              <h3 className="text-base font-normal mb-3">Phonetics used</h3>
              {phonetics.length ? (
                <div className="flex flex-wrap gap-2">
                  {phonetics.map((b) => (
                    <Link key={b.label} href={`/component/${encodeURIComponent(b.label)}`} className="px-2 py-1 rounded-md border border-primary-gray hover:border-branding-brown bg-white">
                      <span className="han text-2xl">{b.label}</span>
                      {b.value > 1 && <sup className="ml-0.5 text-[var(--ink-3)]">{b.value}</sup>}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--ink-3)]">None: every spelling borrows a character for its meaning.</p>
              )}
            </Card>
            <Card>
              <h3 className="text-base font-normal mb-3">Semantic elements</h3>
              {semantics.length ? (
                <div className="flex flex-wrap gap-2">
                  {semantics.map((b) => (
                    <Link key={b.label} href={`/component/${encodeURIComponent(b.label)}`} className="px-2 py-1 rounded-md border border-primary-gray hover:border-branding-brown bg-white">
                      <span className="han text-2xl">{b.label}</span>
                      {b.value > 1 && <sup className="ml-0.5 text-[var(--ink-3)]">{b.value}</sup>}
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--ink-3)]">None.</p>
              )}
            </Card>
            <Card>
              <h3 className="text-base font-normal mb-3">Kinds of character</h3>
              <Bars data={types} labelWidth="9rem" labelClass="text-xs" />
            </Card>
          </section>

          {groups.length > 0 && (
            <section className="mb-14">
              <SectionTitle note="Characters with this reading that the dictionary glosses identically: one word, written more than one way.">
                Variant spellings
              </SectionTitle>
              <div className="space-y-3">
                {groups.map((g, i) => (
                  <Card key={i}>
                    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
                      <span className="flex gap-3">
                        {g.members.map((m) => (
                          <HanLink key={m.rec.c} ch={m.rec.c} className="text-3xl" />
                        ))}
                      </span>
                      <span className="text-sm text-[var(--ink-2)]">{g.gloss}</span>
                      <span className="text-xs text-[var(--brown-ink)]">{VARIANT_LABEL[g.kind]}</span>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <section className="mb-14">
            <SectionTitle>All spellings</SectionTitle>
            <Card className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-[var(--ink-3)] text-xs">
                  <tr className="border-b border-primary-gray">
                    <th className="font-normal px-4 py-2">Char</th>
                    <th className="font-normal px-2 py-2">Structure</th>
                    <th className="font-normal px-2 py-2">Phonetic</th>
                    <th className="font-normal px-2 py-2">Gloss</th>
                    <th className="font-normal px-2 py-2">Earliest</th>
                    <th className="font-normal px-4 py-2 text-right">Cites</th>
                  </tr>
                </thead>
                <tbody>
                  {[...spellings].sort((a, b) => b.rec.n - a.rec.n).map((s, i) => {
                    const e = earliest(s.rec);
                    return (
                      <tr key={i} className="border-b border-branding-gray last:border-0 align-top">
                        <td className="px-4 py-2"><HanLink ch={s.rec.c} className="text-2xl" /></td>
                        <td className="px-2 py-2 han text-[var(--ink-2)]">{s.rec.s}</td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          {s.phonetic && <HanLink ch={s.phonetic.src ?? s.phonetic.ch} className="text-lg" />}{" "}
                          <span className="text-[var(--ink-3)]">{s.phonetic?.sv}</span>
                          {s.onset && (
                            <span className="block text-xs text-[var(--ink-3)]">
                              initial from <HanLink ch={s.onset.src ?? s.onset.ch} /> {s.onset.sv}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 text-[var(--ink-2)] min-w-[14rem]">{s.rec.d}</td>
                        <td className="px-2 py-2 text-[var(--ink-2)] whitespace-nowrap">
                          {e && <>{e.short} <span className="tabular-nums text-[var(--ink-3)]">{e.year}</span></>}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums text-[var(--ink-3)]">{s.rec.n}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          </section>

          {attested.length > 0 && (
            <section className="mb-14">
              <SectionTitle note="Citations for all spellings of this syllable, by date of source.">Attestation</SectionTitle>
              <Card>
                <AttestationChart rows={attested} />
              </Card>
            </section>
          )}
        </>
      )}
    </div>
  );
}
