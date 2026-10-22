"use client";
import { useState } from "react";
import Link from "@/components/nom-explorer/Link";
import type { ReviewItem } from "@/lib/nom-explorer/data";

export interface Decision {
  phonetic: string;
}

type Filter = "open" | "reviewed" | "all";
type Kind = ReviewItem["kind"];

const BASIS_LABEL: { [k in Kind]: { [b: string]: string } } = {
  phonetic: {
    precedent: "inferred from precedent",
    layout: "assumed from layout",
    reviewed: "reviewed",
  },
  onset: {
    sound: "from the dictionary's cluster note",
    precedent: "inferred",
    reviewed: "reviewed",
  },
};

const QUESTION: { [k in Kind]: string } = {
  phonetic: "Which element is the phonetic?",
  onset: "Which element gives only the initial?",
};

// Rows of F analyses whose phonetic was inferred without clear sound
// evidence. Choosing an element calls onDecide; without it the table is
// read-only.
export default function ReviewTable({
  items: allItems,
  decisions,
  onDecide,
  status,
  initialKind = "phonetic",
}: {
  items: ReviewItem[];
  decisions: { [key: string]: Decision };
  onDecide?: (item: ReviewItem, choice: string) => Promise<void>;
  status?: React.ReactNode;
  initialKind?: Kind;
}) {
  const [kind, setKind] = useState<Kind>(initialKind);
  const items = allItems.filter((i) => i.kind === kind);
  const [filter, setFilter] = useState<Filter>("open");
  const [limit, setLimit] = useState(50);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reviewed = items.filter((i) => decisions[i.key]);
  const shown = filter === "open" ? items.filter((i) => !decisions[i.key]) : filter === "reviewed" ? reviewed : items;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4" role="tablist">
        {(
          [
            ["phonetic", "Phonetic or semantic", "Semantic + phonetic characters whose phonetic was inferred"],
            ["onset", "Cluster initials", "Two-phonetic compounds: does one element give only the initial?"],
          ] as const
        ).map(([k, label, hint]) => (
          <button
            key={k}
            role="tab"
            aria-selected={kind === k}
            onClick={() => {
              setKind(k);
              setLimit(50);
            }}
            className={`px-4 py-2 rounded-xl border text-left ${kind === k ? "border-branding-brown bg-white" : "border-primary-gray bg-[var(--track)]"}`}
          >
            <span className="block text-[15px]">
              {label} <span className="tabular-nums text-[var(--ink-3)]">{allItems.filter((i) => i.kind === k).length}</span>
            </span>
            <span className="block text-xs text-[var(--ink-3)]">{hint}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex rounded-lg border border-primary-gray overflow-hidden text-sm" role="group" aria-label="Show">
          {(
            [
              ["open", `To review (${items.length - reviewed.length})`],
              ["reviewed", `Reviewed (${reviewed.length})`],
              ["all", `All (${items.length})`],
            ] as const
          ).map(([f, label]) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`px-3 py-1.5 ${filter === f ? "bg-branding-black text-white" : "bg-white text-[var(--ink-2)]"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="text-sm text-[var(--ink-2)]">{status}</div>
      </div>
      {error && <p className="text-sm text-[var(--brown-ink)] mb-3">{error}</p>}
      <div className="bg-white rounded-2xl border border-primary-gray overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-[var(--ink-3)] text-xs">
            <tr className="border-b border-primary-gray">
              <th className="font-normal px-4 py-2">Char</th>
              <th className="font-normal px-2 py-2">Nôm</th>
              <th className="font-normal px-2 py-2">{QUESTION[kind]}</th>
              <th className="font-normal px-2 py-2">Gloss</th>
              <th className="font-normal px-4 py-2 text-right">Cites</th>
            </tr>
          </thead>
          <tbody>
            {shown.slice(0, limit).map((item) => {
              const current = decisions[item.key]?.phonetic ?? item.phonetic;
              return (
                <tr key={item.key} className="border-b border-branding-gray last:border-0 align-top">
                  <td className="px-4 py-2">
                    <Link href={`/component/${encodeURIComponent(item.char)}`} className="han text-2xl hover:text-[var(--brown-ink)]">
                      {item.char}
                    </Link>
                  </td>
                  <td className="px-2 py-2 font-normal">
                    <Link href={`/syllable/${encodeURIComponent(item.reading)}`} className="hover:text-[var(--brown-ink)]">{item.reading}</Link>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-2 items-center">
                      {[...item.parts, ...(kind === "onset" ? [{ ch: "", src: undefined, sv: undefined }] : [])].map((p) => {
                        const on = current === p.ch;
                        return (
                          <button
                            key={p.ch}
                            disabled={!onDecide || busy === item.key}
                            onClick={async () => {
                              if (!onDecide || (on && decisions[item.key])) return;
                              setBusy(item.key);
                              setError(null);
                              try {
                                await onDecide(item, p.ch);
                              } catch {
                                setError("That choice could not be saved. Your access may be view-only; ask the owner for Contributor access.");
                              } finally {
                                setBusy(null);
                              }
                            }}
                            aria-pressed={on}
                            className={`px-2.5 py-1 rounded-md border text-left disabled:cursor-default ${
                              on ? "border-branding-brown bg-[var(--track)]" : "border-primary-gray bg-white enabled:hover:border-branding-brown"
                            }`}
                          >
                            {p.ch ? (
                              <>
                                <span className="han text-xl">{p.src ?? p.ch}</span>
                                {p.src && <span className="han text-xs text-[var(--ink-3)]"> ({p.ch})</span>}
                                <span className="text-xs text-[var(--ink-2)] ml-1">{p.sv}</span>
                              </>
                            ) : (
                              <span className="text-sm">Neither</span>
                            )}
                            {on && (
                              <span className="block text-[10px] uppercase tracking-wide text-[var(--brown-ink)]">
                                {kind === "phonetic" ? "phonetic" : p.ch ? "initial only" : "both whole"}
                              </span>
                            )}
                          </button>
                        );
                      })}
                      <span className="text-xs text-[var(--ink-3)]">
                        {decisions[item.key] ? "reviewed" : BASIS_LABEL[kind][item.basis]} · {item.code}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2 text-[var(--ink-2)] min-w-[12rem]">{item.gloss}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-[var(--ink-3)]">{item.cites}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {shown.length > limit && (
        <button onClick={() => setLimit(limit + 100)} className="mt-4 px-4 py-2 rounded-lg border border-primary-gray bg-white hover:border-branding-brown text-sm">
          Show 100 more ({shown.length - limit} left)
        </button>
      )}
      {!shown.length && <p className="text-sm text-[var(--ink-3)] mt-4">Nothing here yet.</p>}
    </div>
  );
}
