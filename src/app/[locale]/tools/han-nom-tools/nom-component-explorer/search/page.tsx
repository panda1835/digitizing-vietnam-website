import Link from "@/components/nom-explorer/Link";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { explorerHref } from "@/components/nom-explorer/Link";
import PageHeader, { Card, SectionTitle } from "@/components/nom-explorer/PageHeader";
import SearchBox from "@/components/nom-explorer/SearchBox";
import { HanLink } from "@/components/nom-explorer/Han";
import { getDb, normalize, svReadings } from "@/lib/nom-explorer/data";
import { isHan } from "@/lib/nom-explorer/han";

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim();
  const han = Array.from(q).filter(isHan);
  if (han.length === 1) redirect(`/${await getLocale()}${explorerHref(`/component/${encodeURIComponent(han[0])}`)}`);

  const { parents, uses, byChar } = getDb();
  let body: React.ReactNode = null;

  if (han.length > 1) {
    // Characters whose analysis names every component given (as with the DVN
    // lookup's component search), at any depth.
    const sets = han.map((h) => {
      const all = new Set<string>();
      let frontier = [normalize(h)];
      for (let d = 0; d < 4 && frontier.length; d++) {
        const next: string[] = [];
        for (const f of frontier)
          for (const p of Array.from(parents.get(normalize(f)) ?? [])) if (!all.has(p)) all.add(p), next.push(p);
        frontier = next;
      }
      return all;
    });
    const hits = Array.from(sets[0]).filter((c) => sets.every((s) => s.has(c)));
    body = (
      <section>
        <SectionTitle note={<>Characters whose structure includes all of <span className="han">{han.join(" ")}</span>.</>}>
          {hits.length} characters
        </SectionTitle>
        <div className="flex flex-wrap gap-2 mb-6 text-sm">
          Analyse one:
          {han.map((h) => <HanLink key={h} ch={h} className="text-xl" />)}
        </div>
        <Card>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
            {hits.map((c) => (
              <li key={c} className="flex gap-2 items-baseline">
                <HanLink ch={c} className="text-2xl" />
                <span className="font-normal">{Array.from(new Set((byChar.get(c) ?? []).map((r) => r.r))).join(", ")}</span>
                <span className="han text-[var(--ink-3)] truncate">{byChar.get(c)?.[0]?.s}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>
    );
  } else if (q) {
    const word = q.toLowerCase().normalize("NFC");
    const comps = Array.from(uses.keys()).filter((k) => svReadings(k).some((r) => r.split("|").includes(word)));
    const readers = Array.from(byChar.values()).flat().filter((r) => r.r === word);
    body = (
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="lg:col-span-2">
          <Link href={`/syllable/${encodeURIComponent(word)}`} className="link">
            Every spelling of {word}, with its phonetics, variants and attestation →
          </Link>
        </div>
        <section>
          <SectionTitle note={<>Components whose Sino-Vietnamese reading is <strong className="font-normal">{word}</strong>.</>}>Components read {word}</SectionTitle>
          <Card>
            {comps.length ? (
              <div className="flex flex-wrap gap-2">
                {comps.map((c) => (
                  <Link key={c} href={`/component/${encodeURIComponent(c)}`} className="rounded-lg border border-branding-gray hover:border-branding-brown px-3 py-1 text-center">
                    <span className="han text-3xl">{c}</span>
                    <span className="block text-[11px] text-[var(--ink-3)]">{uses.get(c)!.length} uses</span>
                  </Link>
                ))}
              </div>
            ) : <p className="text-sm text-[var(--ink-3)]">None.</p>}
          </Card>
        </section>
        <section>
          <SectionTitle note={<>Characters the dictionary reads <strong className="font-normal">{word}</strong> in Nôm, with their analysis.</>}>Characters read {word}</SectionTitle>
          <Card>
            {readers.length ? (
              <ul className="space-y-1.5 text-sm">
                {readers.map((r, i) => (
                  <li key={i} className="flex gap-3 items-baseline">
                    <HanLink ch={r.c} className="text-2xl" />
                    <span className="han text-[var(--ink-2)]">{r.s}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-[var(--ink-3)]">None.</p>}
          </Card>
        </section>
      </div>
    );
  }

  return (
    <div>
      <PageHeader crumbs={[{ label: "Search" }]} title="Search" />
      <div className="mb-10"><SearchBox initial={q} /></div>
      {body}
    </div>
  );
}
