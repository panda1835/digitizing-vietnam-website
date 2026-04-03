"use client";

import { useState } from "react";
import Link from "next/link";

interface DocEntry {
  slug: string;
  title: string;
  collectionSlug: string;
  ocrStatus: string;
  pageCount: number;
}

interface AdminOCRClientProps {
  docs: DocEntry[];
  locale: string;
}

const statusColors: Record<string, string> = {
  none: "bg-gray-100 text-gray-600",
  pending: "bg-yellow-100 text-yellow-700",
  processing: "bg-blue-100 text-blue-700",
  complete: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
};

export default function AdminOCRClient({ docs, locale }: AdminOCRClientProps) {
  const [uploading, setUploading] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, { status: string; pageCount: number }>>({});
  const [message, setMessage] = useState<string | null>(null);

  function getStatus(slug: string) {
    return statuses[slug]?.status ?? docs.find((d) => d.slug === slug)?.ocrStatus ?? "none";
  }
  function getPageCount(slug: string) {
    return statuses[slug]?.pageCount ?? docs.find((d) => d.slug === slug)?.pageCount ?? 0;
  }

  async function handleUpload(slug: string, collectionSlug: string, file: File) {
    setUploading(slug);
    setMessage(null);
    const form = new FormData();
    form.append("pdf", file);
    form.append("slug", slug);
    form.append("collectionSlug", collectionSlug);
    try {
      const res = await fetch("/api/ocr/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.success) {
        setStatuses((prev) => ({ ...prev, [slug]: { status: "pending", pageCount: 0 } }));
        setMessage(`Uploaded PDF for "${slug}"`);
      } else {
        setMessage(`Upload failed: ${data.error}`);
      }
    } catch (e: any) {
      setMessage(`Upload error: ${e.message}`);
    } finally {
      setUploading(null);
    }
  }

  async function handleProcess(slug: string) {
    setProcessing(slug);
    setMessage(null);
    setStatuses((prev) => ({ ...prev, [slug]: { status: "processing", pageCount: 0 } }));
    try {
      const res = await fetch("/api/ocr/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (data.success) {
        setStatuses((prev) => ({
          ...prev,
          [slug]: { status: "complete", pageCount: data.pageCount },
        }));
        setMessage(`OCR complete for "${slug}" — ${data.pageCount} pages processed`);
      } else {
        setStatuses((prev) => ({ ...prev, [slug]: { status: "error", pageCount: 0 } }));
        setMessage(`OCR failed for "${slug}": ${data.error}`);
      }
    } catch (e: any) {
      setStatuses((prev) => ({ ...prev, [slug]: { status: "error", pageCount: 0 } }));
      setMessage(`OCR error: ${e.message}`);
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div>
      {message && (
        <div className="mb-4 p-3 rounded bg-blue-50 border border-blue-200 text-sm text-blue-800">
          {message}
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <Link
          href={`/${locale}/admin/ocr/test`}
          className="px-4 py-2 text-sm rounded border border-indigo-500 text-indigo-600 hover:bg-indigo-50"
        >
          Single-page OCR Tester →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2 font-medium text-gray-600">Document</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Collection</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">OCR Status</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Pages</th>
              <th className="text-left px-4 py-2 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.map((doc) => {
              const status = getStatus(doc.slug);
              const pageCount = getPageCount(doc.slug);
              const isUploading = uploading === doc.slug;
              const isProcessing = processing === doc.slug;

              return (
                <tr key={doc.slug} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{doc.title}</div>
                    <div className="text-xs text-gray-400">{doc.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{doc.collectionSlug}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        statusColors[status] ?? statusColors.none
                      }`}
                    >
                      {status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {pageCount > 0 ? pageCount : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Upload PDF */}
                      <label className="cursor-pointer px-3 py-1 text-xs rounded border border-gray-300 text-gray-700 hover:bg-gray-100">
                        {isUploading ? "Uploading…" : "Upload PDF"}
                        <input
                          type="file"
                          accept=".pdf"
                          className="hidden"
                          disabled={isUploading}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleUpload(doc.slug, doc.collectionSlug, f);
                          }}
                        />
                      </label>

                      {/* Run OCR */}
                      {(status === "pending" || status === "error" || status === "complete") && (
                        <button
                          onClick={() => handleProcess(doc.slug)}
                          disabled={isProcessing}
                          className="px-3 py-1 text-xs rounded border border-blue-400 text-blue-600 hover:bg-blue-50 disabled:opacity-40"
                        >
                          {isProcessing ? "Running OCR…" : "Run OCR"}
                        </button>
                      )}

                      {/* View in reading workshop */}
                      {status === "complete" && (
                        <Link
                          href={`/${locale}/our-collections/${doc.collectionSlug}/${doc.slug}/reading-workshop`}
                          className="px-3 py-1 text-xs rounded border border-green-400 text-green-600 hover:bg-green-50"
                          target="_blank"
                        >
                          View →
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
