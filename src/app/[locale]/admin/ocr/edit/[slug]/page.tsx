import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import {
  getManifest,
  listPageSummaries,
  type PageSummary,
} from "@/lib/ocr-store-supabase";
import DocOcrRunner from "@/components/ocr-editor/DocOcrRunner";

export const dynamic = "force-dynamic";

/**
 * Per-document OCR dashboard — DVN's equivalent of text-search's
 * `nom_ocr_doc_viewer` (/text/<id>/ocr). Landing page when a document is
 * opened from "Edit Documents": summary counts + a row per page (status,
 * #cols, #chars, workflow flags) each linking into the per-page editor.
 *
 * (Batch "run OCR on missing pages" streaming — text-search's toolbar —
 * is deferred; OCR currently runs per page inside the editor.)
 */

type Stage =
  | "no-ocr"
  | "ocr"
  | "columns"
  | "quocngu"
  | "skipped";

function stageOf(p: PageSummary): {
  key: Stage;
  label: string;
  cls: string;
} {
  if (p.skippedAt)
    return {
      key: "skipped",
      label: "Skipped",
      cls: "bg-gray-100 text-gray-500 border-gray-200",
    };
  if (p.quocNguConfirmedAt)
    return {
      key: "quocngu",
      label: "Quốc Ngữ ✓",
      cls: "bg-[#a5701c]/10 text-branding-brown border-branding-brown/30",
    };
  if (p.columnsConfirmedAt)
    return {
      key: "columns",
      label: "Columns ✓",
      cls: "bg-primary-blue/10 text-primary-blue border-primary-blue/30",
    };
  if (p.chars > 0 || p.ocrStatus === "in-progress")
    return {
      key: "ocr",
      label: "OCR’d",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    };
  return {
    key: "no-ocr",
    label: "No OCR",
    cls: "bg-gray-50 text-gray-400 border-gray-200",
  };
}

export default async function DocOcrDashboard({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  setRequestLocale(params.locale);
  const slug = decodeURIComponent(params.slug);

  const manifest = await getManifest(slug);
  if (!manifest) notFound();
  const pages = await listPageSummaries(slug);

  const tally = {
    ocr: 0,
    columns: 0,
    quocngu: 0,
    skipped: 0,
  };
  for (const p of pages) {
    const k = stageOf(p).key;
    if (k === "skipped") tally.skipped++;
    else {
      if (p.chars > 0) tally.ocr++;
      if (p.columnsConfirmedAt) tally.columns++;
      if (p.quocNguConfirmedAt) tally.quocngu++;
    }
  }

  // Resume = first page that isn't skipped and isn't Quốc-Ngữ-confirmed.
  const resume =
    pages.find((p) => !p.skippedAt && !p.quocNguConfirmedAt)?.pageNumber ??
    1;

  const cell = "py-2 px-3 align-middle";

  return (
    <div className="px-2 py-4 font-halyard">
      <div className="text-xs text-gray-500 mb-1">
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
        <Link
          href={`/${params.locale}/admin/ocr/edit`}
          className="hover:underline"
        >
          Edit Documents
        </Link>
        <span className="mx-1">/</span>
        <span className="truncate">{manifest.title}</span>
      </div>

      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {manifest.title}
            <span className="ml-2 text-sm font-normal text-gray-500">
              {manifest.pageCount} page
              {manifest.pageCount === 1 ? "" : "s"}
            </span>
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              OCR’d <strong>{tally.ocr}</strong>/{manifest.pageCount}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary-blue" />
              Columns ✓ <strong>{tally.columns}</strong>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-branding-brown" />
              Quốc Ngữ ✓ <strong>{tally.quocngu}</strong>
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              Skipped <strong>{tally.skipped}</strong>
            </span>
          </div>
        </div>
        <Link
          href={`/${params.locale}/admin/ocr/edit/${encodeURIComponent(
            slug
          )}/${resume}`}
          className="px-4 py-1.5 text-sm rounded bg-primary-blue text-white font-medium hover:bg-[#00124f]"
        >
          {resume === 1 ? "Open editor" : `Resume — page ${resume}`} ▶
        </Link>
      </div>

      {pages.length > 0 && (
        <DocOcrRunner
          slug={slug}
          pages={pages.map((p) => ({
            pageNumber: p.pageNumber,
            chars: p.chars,
            skipped: !!p.skippedAt,
          }))}
        />
      )}

      {pages.length === 0 ? (
        <div className="rounded border border-dashed border-gray-300 px-6 py-8 text-center text-sm text-gray-500">
          This document has no pages.
        </div>
      ) : (
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                <th className={cell}>Page</th>
                <th className={cell}>Status</th>
                <th className={cell}>Cols</th>
                <th className={cell}>Chars</th>
                <th className={cell}>NNV</th>
                <th className={`${cell} text-right`}>Edit</th>
              </tr>
            </thead>
            <tbody>
              {pages.map((p) => {
                const s = stageOf(p);
                return (
                  <tr
                    key={p.pageNumber}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50"
                  >
                    <td className={`${cell} tabular-nums text-gray-700`}>
                      {p.pageNumber}
                    </td>
                    <td className={cell}>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] border ${s.cls}`}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td className={`${cell} tabular-nums text-gray-600`}>
                      {p.columns || "—"}
                    </td>
                    <td className={`${cell} tabular-nums text-gray-600`}>
                      {p.chars || "—"}
                    </td>
                    <td className={`${cell} text-xs`}>
                      {p.nnvCompletedAt ? (
                        <span className="text-branding-brown">done</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className={`${cell} text-right`}>
                      <Link
                        href={`/${params.locale}/admin/ocr/edit/${encodeURIComponent(
                          slug
                        )}/${p.pageNumber}`}
                        className="px-3 py-1 text-xs rounded border border-gray-300 text-gray-700 hover:bg-white hover:border-primary-blue hover:text-primary-blue"
                      >
                        Edit →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
