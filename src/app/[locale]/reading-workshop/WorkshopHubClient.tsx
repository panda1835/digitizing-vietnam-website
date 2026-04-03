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

type Tab = "documents" | "browse";

export default function WorkshopHubClient({
  locale,
  knownDocs,
  ocrIndex: initialOcrIndex,
  hanNomEntries,
  queuedItemIds: initialQueuedIds,
}: WorkshopHubClientProps) {
  const [tab, setTab] = useState<Tab>("documents");
  const [ocrIndex, setOcrIndex] = useState(initialOcrIndex);
  const [queuedItemIds, setQueuedItemIds] = useState(new Set(initialQueuedIds));
  const [searchQuery, setSearchQuery] = useState("");

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
      setTab("documents");
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

  const closeTest = () => {
    setTestingSlug(null);
    setTestResult(null);
    setTestError(null);
  };

  // ── OCR entries from index ──
  const ocrEntries = Object.entries(ocrIndex).map(([slug, entry]) => ({
    slug,
    ...entry,
  }));

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
      </div>

      {tab === "documents" && (
        <div className="flex flex-col gap-8">
          {/* Known text documents */}
          <section>
            <h2 className={`${merriweather.className} text-lg text-branding-black mb-3`}>
              Documents with Existing Text
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
          <section>
            <h2 className={`${merriweather.className} text-lg text-branding-black mb-3`}>
              OCR Documents
            </h2>
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
                        <StatusBadge status={entry.status} />
                        {entry.pageCount > 0 && (
                          <span className="text-[10px] text-branding-black/40">
                            {entry.pageCount} pages
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {(entry.status === "queued" || entry.status === "pending" || entry.status === "error") && entry.itemId && (
                        <>
                          <Link
                            href={`/${locale}/reading-workshop/${entry.itemId}`}
                            className="px-3 py-1 text-xs font-light rounded border border-branding-brown/30 text-branding-brown hover:bg-branding-brown/10 transition-colors"
                          >
                            Open Workshop →
                          </Link>
                          <button
                            onClick={() => handleRemove(entry.slug)}
                            className="px-2 py-1 text-xs font-light text-branding-black/30 hover:text-red-500 transition-colors"
                          >
                            Remove
                          </button>
                        </>
                      )}
                      {(entry.status === "complete" || entry.status === "corrected") && entry.itemId && (
                        <>
                          <button
                            onClick={() => handleTestPage(entry.slug, 0)}
                            className="px-3 py-1 text-xs font-light rounded border border-[#e1e1de] text-branding-black/60 hover:border-branding-brown hover:text-branding-brown transition-colors"
                          >
                            Test Page
                          </button>
                          <Link
                            href={`/${locale}/reading-workshop/${entry.itemId}`}
                            className={`px-3 py-1 text-xs font-light rounded border transition-colors ${
                              entry.status === "corrected"
                                ? "border-purple-300 text-purple-700 hover:bg-purple-50"
                                : "border-green-300 text-green-700 hover:bg-green-50"
                            }`}
                          >
                            Open Workshop →
                          </Link>
                        </>
                      )}
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

          {/* Standalone OCR tester link */}
          <div className="pt-2">
            <Link
              href={`/${locale}/admin/ocr/test`}
              className="text-xs font-light text-branding-brown hover:underline transition-colors"
            >
              Single-image OCR tester →
            </Link>
          </div>
        </div>
      )}

      {tab === "browse" && (
        <div>
          <div className="mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title…"
              className="w-full max-w-md px-3 py-2 text-sm font-light border border-[#e1e1de] rounded-lg bg-white focus:outline-none focus:border-branding-brown transition-colors"
            />
          </div>
          <p className="text-xs text-branding-black/40 font-light mb-4">
            {filteredHanNom.length} items
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredHanNom.slice(0, 60).map((item) => {
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
                    {item.yearStart && (
                      <p className="text-[10px] text-branding-black/40 font-light">
                        {item.yearStart}{item.yearEnd && item.yearEnd !== item.yearStart ? `–${item.yearEnd}` : ""}
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
          {filteredHanNom.length > 60 && (
            <p className="text-xs text-branding-black/40 font-light mt-4 text-center">
              Showing 60 of {filteredHanNom.length} items. Use search to narrow results.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
