import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import {
  findCharOccurrences,
  getAggregatedRelabels,
  listDocumentsBrief,
  OCCURRENCES_PAGE_SIZE,
} from "@/lib/ocr-store-supabase";
import OccurrencesGrid, { type OccurrenceVM } from "./OccurrencesGrid";
import DocPicker from "./DocPicker";

export const dynamic = "force-dynamic";

export default async function OcrLabelsPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: {
    q?: string;
    prefill?: string;
    sort?: string;
    doc?: string;
    p?: string;
  };
}) {
  setRequestLocale(params.locale);
  const locale = params.locale;
  const base = `/${locale}/admin/ocr/labels`;

  const q = (searchParams.q ?? "").trim();
  const prefill = (searchParams.prefill ?? "").trim() || undefined;
  const sort: "corrections" | "remaining" =
    searchParams.sort === "remaining" ? "remaining" : "corrections";
  // One cheap query for the picker / titles — no per-doc page-status
  // aggregation (that N+1 `listIndex` walk is what made this page hang).
  const docOptions = await listDocumentsBrief();
  const titleOf = new Map(docOptions.map((d) => [d.slug, d.title]));
  // Drop unknown slugs silently — handles stale bookmarks pointing at
  // documents that have since been deleted.
  const docFilter =
    searchParams.doc && titleOf.has(searchParams.doc)
      ? searchParams.doc
      : undefined;
  const pageNum = Math.max(
    1,
    Number.parseInt(searchParams.p ?? "1", 10) || 1
  );
  const offset = (pageNum - 1) * OCCURRENCES_PAGE_SIZE;
  // The occurrence search and the always-rendered sidebar aggregate are
  // independent queries — overlap them so a search isn't agg-time +
  // search-time serialized.
  const [occ, aggregatedRelabels] = await Promise.all([
    q
      ? findCharOccurrences(q, {
          slug: docFilter,
          limit: OCCURRENCES_PAGE_SIZE,
          offset,
        })
      : Promise.resolve({ occurrences: [], total: 0 }),
    getAggregatedRelabels({ slug: docFilter }),
  ]);
  if (sort === "remaining") {
    aggregatedRelabels.sort((a, b) => b.remainingFrom - a.remainingFrom);
  }
  const total = occ.total;
  const pageCount = Math.max(1, Math.ceil(total / OCCURRENCES_PAGE_SIZE));
  const firstShown = total === 0 ? 0 : offset + 1;
  const lastShown = Math.min(offset + occ.occurrences.length, total);
  // Preserve q/prefill/doc/sort across pager links; only `p` changes.
  function pageHref(n: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (prefill) sp.set("prefill", prefill);
    if (docFilter) sp.set("doc", docFilter);
    if (sort === "remaining") sp.set("sort", "remaining");
    if (n > 1) sp.set("p", String(n));
    const qs = sp.toString();
    return qs ? `${base}?${qs}` : base;
  }
  // Preserve current q/prefill/doc on the sort toggle links so a search-
  // in-progress isn't dropped when switching sort modes.
  function sortHref(next: "corrections" | "remaining") {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (prefill) sp.set("prefill", prefill);
    if (docFilter) sp.set("doc", docFilter);
    if (next !== "corrections") sp.set("sort", next);
    const qs = sp.toString();
    return qs ? `${base}?${qs}` : base;
  }

  return (
    <main className="flex-1 flex w-full p-6 gap-6 max-w-7xl mx-auto">
      {/* Main column: search + results */}
      <div className="flex-1 min-w-0">
        <header className="mb-6">
          <div className="text-xs text-gray-500 mb-1">
            <Link href={`/${locale}/admin`} className="hover:underline">
              Admin
            </Link>
            <span className="mx-1">/</span>
            <Link
              href={`/${locale}/admin/ocr`}
              className="hover:underline"
            >
              Hán-Nôm OCR Toolbox
            </Link>
            <span className="mx-1">/</span>
            <span>Bulk Label Corrections</span>
          </div>
          <h1 className="text-2xl font-semibold mt-1">
            Bulk Label Corrections
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Find every occurrence of a label across the corpus. Edit any
            mislabeled instance inline, or select many and relabel them in
            one pass — saves persist immediately.
          </p>
        </header>

        <div className="mb-3">
          <DocPicker docs={docOptions} current={docFilter ?? ""} />
        </div>

        <form
          action={base}
          method="get"
          className="mb-6 flex items-center gap-2"
        >
          <input
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Type a character (e.g., 月) and press Enter"
            autoFocus
            className="flex-1 px-3 py-2 text-base font-han-nom border border-gray-300 rounded focus:outline-none focus:border-indigo-400"
          />
          {/* Carry the current doc / sort filters through the search form
              so submitting a query doesn't reset the per-document scope. */}
          {docFilter && <input type="hidden" name="doc" value={docFilter} />}
          {sort === "remaining" && (
            <input type="hidden" name="sort" value="remaining" />
          )}
          <button
            type="submit"
            className="px-4 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Search
          </button>
        </form>

        {!q ? (
          <p className="text-sm text-gray-400 italic">
            Enter a label above to see every occurrence in the corpus.
          </p>
        ) : total === 0 ? (
          <p className="text-sm text-gray-400 italic">
            No occurrences of{" "}
            <span className="font-han-nom text-gray-600">{q}</span> found in
            the corpus.
          </p>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between gap-3 text-xs text-gray-500">
              <span>
                Showing{" "}
                <span className="tabular-nums text-gray-700">
                  {firstShown}–{lastShown}
                </span>{" "}
                of{" "}
                <span className="tabular-nums text-gray-700">{total}</span>
              </span>
              {pageCount > 1 && (
                <span className="flex items-center gap-1">
                  {pageNum > 1 ? (
                    <Link
                      href={pageHref(pageNum - 1)}
                      className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                    >
                      ← Prev
                    </Link>
                  ) : (
                    <span className="px-2 py-1 rounded border border-gray-200 text-gray-300">
                      ← Prev
                    </span>
                  )}
                  <span className="px-1 tabular-nums">
                    {pageNum} / {pageCount}
                  </span>
                  {pageNum < pageCount ? (
                    <Link
                      href={pageHref(pageNum + 1)}
                      className="px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
                    >
                      Next →
                    </Link>
                  ) : (
                    <span className="px-2 py-1 rounded border border-gray-200 text-gray-300">
                      Next →
                    </span>
                  )}
                </span>
              )}
            </div>
            <OccurrencesGrid
              locale={locale}
              query={q}
              prefill={prefill}
              occurrences={occ.occurrences.map<OccurrenceVM>((o) => ({
                slug: o.slug,
                page: o.page,
                offset: o.offset,
                text: o.text,
                bbox: o.bbox,
                confidence: o.confidence,
                uncertain: o.uncertain,
                noReadingForm: o.noReadingForm,
                ids: o.ids,
                note: o.note,
                column: o.column,
                title: o.title,
              }))}
            />
            {pageCount > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                {pageNum > 1 && (
                  <Link
                    href={pageHref(pageNum - 1)}
                    className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
                  >
                    ← Prev
                  </Link>
                )}
                <span className="tabular-nums">
                  Page {pageNum} of {pageCount}
                </span>
                {pageNum < pageCount && (
                  <Link
                    href={pageHref(pageNum + 1)}
                    className="px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
                  >
                    Next →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Right sidebar: frequent corrections */}
      <aside className="w-80 shrink-0 hidden lg:block">
        <div className="sticky top-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            {docFilter ? (
              <>
                Frequent corrections in{" "}
                <span className="normal-case tracking-normal text-gray-700">
                  {titleOf.get(docFilter) ?? docFilter}
                </span>
              </>
            ) : (
              "Frequent corrections"
            )}
          </h2>
          <p className="text-xs text-gray-400 mb-2">
            Live count of cells where saved text differs from the OCR
            result. A page contributes once it has been OCR&apos;d and
            edited.
          </p>
          <div className="flex items-center gap-1 text-[11px] mb-2">
            <span className="text-gray-400 mr-1">Sort:</span>
            <Link
              href={sortHref("corrections")}
              className={`px-1.5 py-0.5 rounded ${
                sort === "corrections"
                  ? "bg-gray-800 text-white"
                  : "text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              corrections
            </Link>
            <Link
              href={sortHref("remaining")}
              className={`px-1.5 py-0.5 rounded ${
                sort === "remaining"
                  ? "bg-gray-800 text-white"
                  : "text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}
            >
              originals left
            </Link>
          </div>
          {aggregatedRelabels.length === 0 ? (
            <p className="text-xs text-gray-400 italic">
              No corrections recorded yet.
            </p>
          ) : (
            <ul className="text-sm border border-gray-200 rounded-lg divide-y divide-gray-100 bg-white max-h-[calc(100vh-12rem)] overflow-y-auto">
              {aggregatedRelabels.slice(0, 50).map((a, i) => {
                const pairParams = new URLSearchParams();
                pairParams.set("q", a.from);
                pairParams.set("prefill", a.to);
                if (docFilter) pairParams.set("doc", docFilter);
                if (sort === "remaining") pairParams.set("sort", "remaining");
                return (
                  <li key={`${a.from}-${a.to}-${i}`}>
                    <Link
                      href={`${base}?${pairParams.toString()}`}
                      title={`Search for ${a.from} and prefill ${a.to} as the bulk-relabel target. ${a.remainingFrom} un-relabeled ${a.from} ${docFilter ? "in this document" : "still in corpus"}.`}
                      className="flex items-center gap-1.5 px-2 py-1.5 hover:bg-gray-50"
                    >
                      <span className="font-han-nom text-base text-gray-800">
                        {a.from}
                      </span>
                      <span
                        className={`text-[10px] tabular-nums ${
                          sort === "remaining"
                            ? "text-gray-700 font-semibold"
                            : "text-gray-400"
                        }`}
                        aria-label={`${a.remainingFrom} ${a.from} remain in corpus`}
                      >
                        ({a.remainingFrom})
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="font-han-nom text-base text-gray-800">
                        {a.to}
                      </span>
                      <span
                        className={`ml-auto text-xs tabular-nums ${
                          sort === "corrections" && a.totalChars >= 3
                            ? "text-rose-600 font-semibold"
                            : sort === "corrections"
                            ? "text-gray-700 font-semibold"
                            : "text-gray-500"
                        }`}
                      >
                        {a.totalChars}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </main>
  );
}
