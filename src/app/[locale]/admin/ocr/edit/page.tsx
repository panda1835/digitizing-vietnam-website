import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { listIndex } from "@/lib/ocr-store-supabase";
import DocExportButtons from "@/components/ocr-editor/DocExportButtons";

export const dynamic = "force-dynamic";

export default async function EditDocsList({
  params,
}: {
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  const index = await listIndex();
  const entries = Object.entries(index).sort(
    ([, a], [, b]) =>
      new Date(b.lastEditedAt).getTime() - new Date(a.lastEditedAt).getTime()
  );

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="text-xs text-gray-500 mb-2">
        <Link href={`/${params.locale}/admin`} className="hover:underline">
          Admin
        </Link>
        <span className="mx-1">/</span>
        <Link
          href={`/${params.locale}/admin/ocr`}
          className="hover:underline"
        >
          Hán-Nôm OCR Toolbox
        </Link>
        <span className="mx-1">/</span>
        <span>Edit Documents</span>
      </div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">
        Edit Documents
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Documents saved to admin storage. Click to open the editor and
        continue correcting columns / characters.
      </p>

      {entries.length === 0 ? (
        <div className="rounded border border-dashed border-gray-300 px-6 py-8 text-center text-sm text-gray-500">
          No documents yet. Save a page from the{" "}
          <Link
            href={`/${params.locale}/admin/ocr/test`}
            className="text-indigo-600 hover:underline"
          >
            Single-Page OCR Tester
          </Link>{" "}
          (or import one once that flow lands) to populate this list.
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 border border-gray-200 rounded">
          {entries.map(([slug, entry]) => (
            <li
              key={slug}
              className="px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
            >
              <Link
                href={`/${params.locale}/admin/ocr/edit/${encodeURIComponent(slug)}`}
                className="block flex-1 min-w-0"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {entry.title || slug}
                  </span>
                  <span className="text-xs text-gray-500 tabular-nums shrink-0">
                    {entry.pageCount} page{entry.pageCount === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-3 flex-wrap">
                  <span className="font-mono">{slug}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
                      entry.status === "corrected"
                        ? "bg-emerald-100 text-emerald-800"
                        : entry.status === "in-progress"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {entry.status}
                  </span>
                  {entry.pagesFullyConfirmed != null && (
                    <span>
                      {entry.pagesFullyConfirmed}/{entry.pageCount} confirmed
                    </span>
                  )}
                  <span>
                    edited {formatRelative(entry.lastEditedAt)}
                  </span>
                </div>
              </Link>
              <DocExportButtons
                slug={slug}
                pageCount={entry.pageCount}
                compact
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatRelative(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const dt = (now - then) / 1000;
    if (dt < 60) return "just now";
    if (dt < 3600) return `${Math.round(dt / 60)}m ago`;
    if (dt < 86400) return `${Math.round(dt / 3600)}h ago`;
    if (dt < 86400 * 30) return `${Math.round(dt / 86400)}d ago`;
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return iso;
  }
}
