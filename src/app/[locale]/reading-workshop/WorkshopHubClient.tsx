"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Merriweather } from "next/font/google";
import { OcrIndexEntry } from "@/lib/ocr-store";
import { HanNomManifestEntry } from "@/lib/han-nom-collection";
import StatusBadge from "./StatusBadge";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

interface KnownDoc {
  slug: string;
  title: string;
  collection: string;
}

interface WorkshopHubClientProps {
  locale: string;
  knownDocs: KnownDoc[];
  ocrIndex: Record<string, OcrIndexEntry>;
  hanNomEntries: HanNomManifestEntry[];
  queuedItemIds: string[];
  pagesWithText: Record<string, number>;
}

interface TestResult {
  rawText: string;
  imageUrl: string;
  canvasLabel: string;
  totalCanvases: number;
  saved: boolean;
  charsWithBbox: number;
  totalChars: number;
}

type Tab = "documents" | "browse" | "upload";

export default function WorkshopHubClient({
  locale,
  knownDocs,
  ocrIndex: initialOcrIndex,
  hanNomEntries,
  queuedItemIds: initialQueuedIds,
  pagesWithText: initialPagesWithText,
}: WorkshopHubClientProps) {
  const [tab, setTab] = useState<Tab>("documents");
  const [ocrIndex, setOcrIndex] = useState(initialOcrIndex);
  const [queuedItemIds, setQueuedItemIds] = useState(new Set(initialQueuedIds));
  const [searchQuery, setSearchQuery] = useState("");
  const [browsePage, setBrowsePage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // Page test state
  const [testingSlug, setTestingSlug] = useState<string | null>(null);
  const [testPageIndex, setTestPageIndex] = useState(0);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // ── Actions ──

  const handleQueue = useCallback(async (itemId: string) => {
    const res = await fetch("/api/ocr/queue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId }),
    });
    const data = await res.json();
    if (data.slug) {
      setQueuedItemIds((prev) => new Set([...prev, itemId]));
      setOcrIndex((prev) => ({
        ...prev,
        [data.slug]: {
          status: data.status ?? "queued",
          pageCount: 0,
          collectionSlug: "han-nom-collection",
          updatedAt: new Date().toISOString(),
          source: "iiif",
          itemId,
          title: hanNomEntries.find((e) => e.itemId === itemId)?.title,
        },
      }));
    }
  }, [hanNomEntries]);

  const handleRemove = useCallback(async (slug: string) => {
    const entry = ocrIndex[slug];
    await fetch("/api/ocr/queue", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
    });
    setOcrIndex((prev) => {
      const next = { ...prev };
      delete next[slug];
      return next;
    });
    if (entry?.itemId) {
      setQueuedItemIds((prev) => {
        const next = new Set(prev);
        next.delete(entry.itemId!);
        return next;
      });
    }
  }, [ocrIndex]);

  const handleStatusChange = useCallback(async (slug: string, newStatus: string) => {
    const res = await fetch(`/api/ocr/status/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOcrIndex((prev) => ({ ...prev, [slug]: { ...prev[slug], ...updated } }));
    }
  }, []);

  const handleTestPage = useCallback(async (slug: string, pageIdx: number) => {
    const entry = ocrIndex[slug];
    if (!entry?.manifestUrl) return;
    setTestingSlug(slug);
    setTestPageIndex(pageIdx);
    setTestLoading(true);
    setTestResult(null);
    setTestError(null);

    try {
      const res = await fetch("/api/ocr/test-iiif-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manifestUrl: entry.manifestUrl, pageIndex: pageIdx, slug }),
      });
      const data = await res.json();
      if (data.error) {
        setTestError(data.error);
      } else {
        setTestResult({
          rawText: data.rawText,
          imageUrl: data.imageUrl,
          canvasLabel: data.canvasLabel,
          totalCanvases: data.totalCanvases,
          saved: data.saved,
          charsWithBbox: data.charsWithBbox ?? 0,
          totalChars: data.totalChars ?? 0,
        });
        // Update page count in local state
        if (data.totalCanvases) {
          setOcrIndex((prev) => ({
            ...prev,
            [slug]: { ...prev[slug], pageCount: data.totalCanvases },
          }));
        }
      }
    } catch {
      setTestError("Failed to run OCR test");
    } finally {
      setTestLoading(false);
    }
  }, [ocrIndex]);

  const handleRequeueOcr = useCallback(async (slug: string) => {
    const res = await fetch(`/api/ocr/status/${encodeURIComponent(slug)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "queued" }),
    });
    if (res.ok) {
      setOcrIndex((prev) => ({ ...prev, [slug]: { ...prev[slug], status: "queued" } }));
    }
  }, []);

  // Upload state
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadRunningOcr, setUploadRunningOcr] = useState(false);
  const [uploadOcrProgress, setUploadOcrProgress] = useState<string | null>(null);

  const handleUploadPdf = useCallback(async () => {
    if (!uploadFile || !uploadTitle.trim()) return;
    setUploading(true);
    setUploadMessage(null);

    // Generate slug from title
    const slug = uploadTitle.trim()
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const form = new FormData();
    form.append("pdf", uploadFile);
    form.append("slug", slug);
    form.append("title", uploadTitle.trim());
    form.append("collectionSlug", "uploads");

    try {
      const res = await fetch("/api/ocr/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.success) {
        setOcrIndex((prev) => ({
          ...prev,
          [slug]: {
            status: "pending",
            pageCount: 0,
            collectionSlug: "uploads",
            updatedAt: new Date().toISOString(),
            source: "pdf",
            title: uploadTitle.trim(),
          },
        }));
        setUploadMessage(`Uploaded "${uploadTitle.trim()}" — now run OCR.`);
        setUploadFile(null);
        setUploadTitle("");
      } else {
        setUploadMessage(`Upload failed: ${data.error}`);
      }
    } catch (e: any) {
      setUploadMessage(`Upload error: ${e.message}`);
    } finally {
      setUploading(false);
    }
  }, [uploadFile, uploadTitle]);

  const handleUploadAndOcr = useCallback(async () => {
    if (!uploadFile || !uploadTitle.trim()) return;
    setUploading(true);
    setUploadMessage(null);

    const slug = uploadTitle.trim()
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const form = new FormData();
    form.append("pdf", uploadFile);
    form.append("slug", slug);
    form.append("title", uploadTitle.trim());
    form.append("collectionSlug", "uploads");

    try {
      const res = await fetch("/api/ocr/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!data.success) {
        setUploadMessage(`Upload failed: ${data.error}`);
        setUploading(false);
        return;
      }

      setOcrIndex((prev) => ({
        ...prev,
        [slug]: {
          status: "processing",
          pageCount: 0,
          collectionSlug: "uploads",
          updatedAt: new Date().toISOString(),
          source: "pdf",
          title: uploadTitle.trim(),
        },
      }));

      // Run OCR
      setUploadRunningOcr(true);
      setUploadOcrProgress("Starting OCR…");
      const ocrRes = await fetch("/api/ocr/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const ocrData = await ocrRes.json();
      if (ocrData.success) {
        setOcrIndex((prev) => ({
          ...prev,
          [slug]: { ...prev[slug], status: "complete", pageCount: ocrData.pageCount },
        }));
        setUploadMessage(`"${uploadTitle.trim()}" — OCR complete, ${ocrData.pageCount} pages processed.`);
      } else {
        setOcrIndex((prev) => ({
          ...prev,
          [slug]: { ...prev[slug], status: "error" },
        }));
        setUploadMessage(`OCR failed: ${ocrData.error}`);
      }
      setUploadFile(null);
      setUploadTitle("");
    } catch (e: any) {
      setUploadMessage(`Error: ${e.message}`);
    } finally {
      setUploading(false);
      setUploadRunningOcr(false);
      setUploadOcrProgress(null);
    }
  }, [uploadFile, uploadTitle]);

  const closeTest = () => {
    setTestingSlug(null);
    setTestResult(null);
    setTestError(null);
  };

  // ── OCR entries from index (sorted alphabetically by title) ──
  const ocrEntries = Object.entries(ocrIndex)
    .map(([slug, entry]) => ({ slug, ...entry }))
    .sort((a, b) => (a.title ?? a.slug).localeCompare(b.title ?? b.slug, "vi"));

  // ── Filtered Han-Nom items ──
  const normalizeSearch = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

  const filteredHanNom = searchQuery
    ? hanNomEntries.filter((item) => {
        const q = normalizeSearch(searchQuery);
        return (
          normalizeSearch(item.title).includes(q) ||
          item.otherTitles.some((t) => normalizeSearch(t).includes(q))
        );
      })
    : hanNomEntries;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-[#e1e1de]">
        <button
          onClick={() => setTab("documents")}
          className={`px-4 py-2 text-sm font-light transition-colors border-b-2 -mb-px ${
            tab === "documents"
              ? "border-branding-brown text-branding-brown"
              : "border-transparent text-branding-black/50 hover:text-branding-brown"
          }`}
        >
          My Documents
        </button>
        <button
          onClick={() => setTab("browse")}
          className={`px-4 py-2 text-sm font-light transition-colors border-b-2 -mb-px ${
            tab === "browse"
              ? "border-branding-brown text-branding-brown"
              : "border-transparent text-branding-black/50 hover:text-branding-brown"
          }`}
        >
          Browse Han-Nôm Collection
        </button>
        <button
          onClick={() => setTab("upload")}
          className={`px-4 py-2 text-sm font-light transition-colors border-b-2 -mb-px ${
            tab === "upload"
              ? "border-branding-brown text-branding-brown"
              : "border-transparent text-branding-black/50 hover:text-branding-brown"
          }`}
        >
          Upload PDF
        </button>
      </div>

      {tab === "documents" && (
        <div className="flex flex-col gap-8">
          {/* Known text documents */}
          <section>
            <h2 className={`${merriweather.className} text-lg text-branding-black mb-3`}>
              Curated Texts
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {knownDocs.map((doc) => (
                <Link
                  key={doc.slug}
                  href={`/${locale}/our-collections/${doc.collection}/${doc.slug}/reading-workshop`}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[#e1e1de] bg-branding-white hover:border-branding-brown hover:shadow-sm transition-all group"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-light text-branding-black group-hover:text-branding-brown truncate transition-colors">
                      {doc.title}
                    </p>
                    <p className="text-[11px] text-branding-black/40 font-light">{doc.collection}</p>
                  </div>
                  <span className="text-xs text-branding-brown/60 group-hover:text-branding-brown transition-colors">
                    Open →
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* OCR queue */}
          <section className="pb-12">
            <div className="flex items-center gap-4 mb-3">
              <h2 className={`${merriweather.className} text-lg text-branding-black`}>
                OCR Documents
              </h2>
              <Link
                href={`/${locale}/admin/ocr/pipeline`}
                className="text-xs font-light text-branding-brown hover:underline transition-colors"
              >
                Batch OCR pipeline →
              </Link>
              <Link
                href={`/${locale}/admin/ocr/test`}
                className="text-xs font-light text-branding-brown hover:underline transition-colors"
              >
                Single-image OCR tester →
              </Link>
            </div>
            {ocrEntries.length === 0 ? (
              <div className="text-sm text-branding-black/40 font-light py-6 text-center border border-dashed border-[#e1e1de] rounded-lg">
                No documents in the OCR queue yet. Browse the Han-Nôm collection to add items.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {ocrEntries.map((entry) => (
                  <div key={entry.slug}>
                  <div
                    className="flex items-center gap-4 px-4 py-3 rounded-lg border border-[#e1e1de] bg-branding-white"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-light text-branding-black truncate">
                        {entry.title || entry.slug}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <select
                          value={entry.status}
                          onChange={(e) => handleStatusChange(entry.slug, e.target.value)}
                          className="text-[10px] font-medium rounded-full px-2 py-0.5 uppercase tracking-wide border-none cursor-pointer bg-transparent"
                          style={{ appearance: "auto" }}
                        >
                          {["queued", "pending", "processing", "partial", "complete", "corrected", "error"].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        {entry.pageCount > 0 && (() => {
                          const withText = initialPagesWithText[entry.slug] ?? 0;
                          const total = entry.pageCount;
                          const allGood = withText >= Math.floor(total * 0.9);
                          return (
                            <span className={`text-[10px] ${allGood ? "text-branding-black/40" : "text-amber-600"}`}>
                              {withText}/{total} pages with text
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {entry.itemId && (
                        <Link
                          href={`/${locale}/reading-workshop/${entry.itemId}`}
                          className="px-3 py-1 text-xs font-light rounded border border-branding-brown/30 text-branding-brown hover:bg-branding-brown/10 transition-colors"
                        >
                          Open →
                        </Link>
                      )}
                      <button
                        onClick={() => handleRequeueOcr(entry.slug)}
                        disabled={entry.status === "queued" || entry.status === "processing"}
                        className="px-3 py-1 text-xs font-light rounded border border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-40 transition-colors"
                      >
                        {entry.status === "queued" ? "Queued" : "Re-queue OCR"}
                      </button>
                      {(entry.status === "partial" || entry.status === "complete" || entry.status === "corrected") && (
                        <>
                          <Link
                            href={`/${locale}/admin/ocr/analyze/${encodeURIComponent(entry.slug)}`}
                            className="px-3 py-1 text-xs font-light rounded border border-indigo-300 text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            Analyze
                          </Link>
                          <button
                            onClick={() => {
                              const a = document.createElement("a");
                              a.href = `/api/ocr/download/${encodeURIComponent(entry.slug)}`;
                              a.click();
                            }}
                            className="px-3 py-1 text-xs font-light rounded border border-[#e1e1de] text-branding-black/60 hover:border-branding-brown hover:text-branding-brown transition-colors"
                          >
                            Download .txt
                          </button>
                          <button
                            onClick={() => handleTestPage(entry.slug, 0)}
                            className="px-3 py-1 text-xs font-light rounded border border-[#e1e1de] text-branding-black/60 hover:border-branding-brown hover:text-branding-brown transition-colors"
                          >
                            Test Page
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleRemove(entry.slug)}
                        className="px-2 py-1 text-xs font-light text-branding-black/30 hover:text-red-500 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Inline page test panel */}
                  {testingSlug === entry.slug && (
                    <div className="mx-4 mb-3 p-4 rounded-lg border border-[#e1e1de] bg-[#f7f7f7]">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-light text-branding-black/60">Test page:</span>
                          <input
                            type="number"
                            min={0}
                            max={(entry.pageCount || 100) - 1}
                            value={testPageIndex}
                            onChange={(e) => setTestPageIndex(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-16 px-2 py-1 text-xs border border-[#e1e1de] rounded bg-white focus:outline-none focus:border-branding-brown"
                          />
                          <span className="text-[10px] text-branding-black/40">(0-indexed)</span>
                          <button
                            onClick={() => handleTestPage(entry.slug, testPageIndex)}
                            disabled={testLoading}
                            className="px-3 py-1 text-xs font-light rounded bg-branding-brown/10 text-branding-brown border border-branding-brown/20 hover:bg-branding-brown/20 disabled:opacity-50 transition-colors"
                          >
                            {testLoading ? "Running…" : "Run OCR & Save"}
                          </button>
                        </div>
                        <button
                          onClick={closeTest}
                          className="text-xs text-branding-black/30 hover:text-branding-brown transition-colors"
                        >
                          Close
                        </button>
                      </div>

                      {testError && (
                        <p className="text-xs text-red-500 font-light">{testError}</p>
                      )}

                      {testResult && (
                        <div className="flex gap-4">
                          {testResult.imageUrl && (
                            <div className="flex-shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={testResult.imageUrl}
                                alt={testResult.canvasLabel}
                                className="max-h-64 rounded border border-[#e1e1de]"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-[10px] text-branding-black/40 font-light">
                                {testResult.canvasLabel} — {testResult.totalCanvases} pages — {testResult.totalChars} spatial items — {testResult.charsWithBbox} with bbox
                              </span>
                              {testResult.saved && (
                                <span className="text-[10px] text-green-600 font-light">Saved ✓</span>
                              )}
                            </div>
                            <pre className="text-xs font-light text-branding-black/70 whitespace-pre-wrap max-h-[500px] overflow-y-auto bg-white p-3 rounded border border-[#e1e1de]">
                              {testResult.rawText || "(no text detected)"}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      )}

      {tab === "browse" && (
        <div>
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setBrowsePage(1); }}
              placeholder="Search by title…"
              className="w-full max-w-md px-3 py-2 text-sm font-light border border-[#e1e1de] rounded-lg bg-white focus:outline-none focus:border-branding-brown transition-colors"
            />
          </div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-branding-black/40 font-light">
              {filteredHanNom.length} items — page {browsePage} of {Math.max(1, Math.ceil(filteredHanNom.length / ITEMS_PER_PAGE))}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBrowsePage((p) => Math.max(1, p - 1))}
                disabled={browsePage <= 1}
                className="px-2 py-1 text-xs font-light rounded border border-[#e1e1de] text-branding-black/60 hover:border-branding-brown disabled:opacity-30"
              >
                ← Prev
              </button>
              <button
                onClick={() => setBrowsePage((p) => Math.min(Math.ceil(filteredHanNom.length / ITEMS_PER_PAGE), p + 1))}
                disabled={browsePage >= Math.ceil(filteredHanNom.length / ITEMS_PER_PAGE)}
                className="px-2 py-1 text-xs font-light rounded border border-[#e1e1de] text-branding-black/60 hover:border-branding-brown disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredHanNom.slice((browsePage - 1) * ITEMS_PER_PAGE, browsePage * ITEMS_PER_PAGE).map((item) => {
              const isQueued = queuedItemIds.has(item.itemId);
              return (
                <div
                  key={item.itemId}
                  className="flex flex-col rounded-lg border border-[#e1e1de] bg-branding-white overflow-hidden hover:shadow-sm transition-shadow"
                >
                  {item.thumbnailUrl && (
                    <div className="relative w-full h-32 bg-branding-gray">
                      <Image
                        src={item.thumbnailUrl}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="200px"
                      />
                    </div>
                  )}
                  <div className="p-3 flex flex-col gap-2 flex-1">
                    <a
                      href={`/${locale}/our-collections/han-nom-collection/${item.itemId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${merriweather.className} text-xs text-branding-black leading-snug line-clamp-2 hover:text-branding-brown hover:underline transition-colors`}
                    >
                      {item.title}
                    </a>
                    {(item.yearStart || item.languages.length > 0) && (
                      <p className="text-[10px] text-branding-black/40 font-light">
                        {item.languages.length > 0 && (
                          <span>{item.languages.join(", ")}</span>
                        )}
                        {item.languages.length > 0 && item.yearStart && <span> · </span>}
                        {item.yearStart && (
                          <span>{item.yearStart}{item.yearEnd && item.yearEnd !== item.yearStart ? `–${item.yearEnd}` : ""}</span>
                        )}
                      </p>
                    )}
                    <div className="mt-auto">
                      {isQueued ? (
                        <span className="inline-block px-2 py-1 text-[10px] font-light rounded bg-branding-black/5 text-branding-black/40">
                          Added to workshop
                        </span>
                      ) : (
                        <button
                          onClick={() => handleQueue(item.itemId)}
                          className="w-full px-2 py-1 text-[11px] font-light rounded border border-branding-brown/30 text-branding-brown hover:bg-branding-brown/10 transition-colors"
                        >
                          Add to Workshop
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === "upload" && (
        <div className="max-w-xl">
          <p className="text-sm text-branding-black/60 font-light mb-4">
            Upload a PDF document to OCR and add to the searchable corpus.
          </p>

          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-light text-branding-black/60 mb-1">Document title</label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="e.g. Truyện Kiều (1866)"
                className="w-full px-3 py-2 text-sm font-light border border-[#e1e1de] rounded bg-white focus:outline-none focus:border-branding-brown transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-light text-branding-black/60 mb-1">PDF file</label>
              <div
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("border-branding-brown", "bg-branding-brown/5"); }}
                onDragLeave={(e) => { e.currentTarget.classList.remove("border-branding-brown", "bg-branding-brown/5"); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("border-branding-brown", "bg-branding-brown/5");
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.name.toLowerCase().endsWith(".pdf")) {
                    setUploadFile(file);
                  }
                }}
                className="border-2 border-dashed border-[#e1e1de] rounded-lg p-6 text-center transition-colors cursor-pointer"
                onClick={() => document.getElementById("pdf-file-input")?.click()}
              >
                {uploadFile ? (
                  <p className="text-sm font-light text-branding-black">
                    {uploadFile.name} <span className="text-branding-black/40">({(uploadFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                  </p>
                ) : (
                  <p className="text-sm font-light text-branding-black/40">
                    Drag & drop a PDF here, or click to browse
                  </p>
                )}
                <input
                  id="pdf-file-input"
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleUploadPdf}
                disabled={!uploadFile || !uploadTitle.trim() || uploading}
                className="px-4 py-2 text-sm font-light rounded border border-[#e1e1de] text-branding-black hover:border-branding-brown hover:text-branding-brown disabled:opacity-30 transition-colors"
              >
                {uploading && !uploadRunningOcr ? "Uploading…" : "Upload Only"}
              </button>
              <button
                onClick={handleUploadAndOcr}
                disabled={!uploadFile || !uploadTitle.trim() || uploading}
                className="px-4 py-2 text-sm font-light rounded bg-branding-brown text-white hover:bg-branding-brown/90 disabled:opacity-30 transition-colors"
              >
                {uploadRunningOcr ? "Running OCR…" : uploading ? "Uploading…" : "Upload & Run OCR"}
              </button>
            </div>

            {uploadOcrProgress && (
              <p className="text-xs text-branding-black/50 font-light">{uploadOcrProgress}</p>
            )}

            {uploadMessage && (
              <div className="p-3 rounded bg-branding-brown/5 border border-branding-brown/20 text-sm text-branding-black/70 font-light">
                {uploadMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
