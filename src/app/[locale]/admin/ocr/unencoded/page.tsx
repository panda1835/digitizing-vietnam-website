import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { buildUnencodedRegistry } from "@/lib/ocr-store-supabase";
import CharCrop from "@/components/ocr-editor/CharCrop";

export const dynamic = "force-dynamic";

export default async function UnencodedPage({
  params,
}: {
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  const locale = params.locale;

  const entries = await buildUnencodedRegistry();
  const totalOccurrences = entries.reduce((s, e) => s + e.count, 0);

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full p-6">
      <header className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
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
            <span>Unencoded Characters</span>
          </div>
          <h1 className="text-2xl font-semibold mt-1">
            Unencoded Characters
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {entries.length} distinct IDS · {totalOccurrences} occurrence
            {totalOccurrences === 1 ? "" : "s"}. Each entry groups every
            glyph you tagged with the same Ideographic Description Sequence
            across the corpus.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            IDS lookup references:{" "}
            <a
              href="https://zi.tools/zi/zi"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:underline"
            >
              zi.tools
            </a>{" "}
            ·{" "}
            <a
              href="https://hc.jsecs.org/irg/ws2024/app/"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 hover:underline"
            >
              IRG WS2024
            </a>
          </p>
        </div>
        <a
          href="/api/admin/ocr/unencoded"
          className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-100"
        >
          Download JSON
        </a>
      </header>

      {entries.length === 0 ? (
        <p className="text-sm text-gray-400 italic">
          No characters have an IDS yet. Add one from the editor&apos;s
          metadata panel for any unencoded glyph (or from the IDS field on
          the Bulk Label Corrections page).
        </p>
      ) : (
        <ul className="space-y-6">
          {entries.map((e) => (
            <li
              key={e.ids}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="font-han-nom text-2xl">{e.ids}</span>
                  <span className="text-xs text-gray-500">
                    {e.count} occurrence{e.count === 1 ? "" : "s"}
                  </span>
                  {e.placeholders.length > 0 && (
                    <span className="text-xs text-gray-500">
                      placeholder:{" "}
                      <span className="font-han-nom text-gray-700">
                        {e.placeholders.join(" ")}
                      </span>
                    </span>
                  )}
                </div>
                <a
                  href={`https://zi.tools/zi/${encodeURIComponent(e.ids)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 hover:underline"
                >
                  Look up on zi.tools →
                </a>
              </div>
              {e.notes.length > 0 && (
                <p className="text-xs text-gray-600 mb-3">
                  Notes: {e.notes.join(" · ")}
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                {e.sources.map((s, i) => (
                  <Link
                    key={i}
                    href={`/${locale}/admin/ocr/edit/${encodeURIComponent(
                      s.slug
                    )}/${s.page}`}
                    title={`${s.title} · page ${s.page}${
                      s.column !== null ? ` · column ${s.column}` : ""
                    } · offset ${s.offset} · conf ${Math.round(
                      s.confidence * 100
                    )}%${s.uncertain ? " · uncertain" : ""}`}
                    className="block w-20 group"
                  >
                    <CharCrop
                      slug={s.slug}
                      page={s.page}
                      bbox={s.bbox}
                      className={`w-20 h-20 bg-gray-50 border rounded transition-colors relative overflow-hidden ${
                        s.uncertain
                          ? "border-yellow-400"
                          : "border-gray-200 group-hover:border-indigo-400"
                      }`}
                    />
                    <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                      {s.title}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      p{s.page}
                      {s.column !== null ? ` · c${s.column}` : ""} ·{" "}
                      {Math.round(s.confidence * 100)}%
                    </div>
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
