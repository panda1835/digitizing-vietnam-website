"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface DocumentProgress {
  slug: string;
  title: string;
  totalPages: number;
  completedPages: number;
  status: "waiting" | "processing" | "complete" | "error";
  error?: string;
}

interface UsageStats {
  today: number;
  month: number;
  dailyLimit: number;
  monthlyLimit: number;
  dailyLimitReached: boolean;
  monthlyLimitReached: boolean;
}

interface PipelineData {
  state: "idle" | "running" | "stopping" | "stopping-after-doc";
  documents: DocumentProgress[];
  currentSlug: string | null;
  currentPage: number | null;
  startedAt: string | null;
  pagesProcessed: number;
  errors: number;
  usage: UsageStats;
  queued: DocumentProgress[];
  avgSecondsPerPage: number | null;
}

function formatEta(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

export default function PipelineClient({ locale }: { locale: string }) {
  const [data, setData] = useState<PipelineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Limit editing
  const [editingLimits, setEditingLimits] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(0);
  const [monthlyLimit, setMonthlyLimit] = useState(0);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/ocr/pipeline");
      if (res.ok) {
        const d = await res.json();
        setData(d);
        if (!editingLimits) {
          setDailyLimit(d.usage.dailyLimit);
          setMonthlyLimit(d.usage.monthlyLimit);
        }
      }
    } catch {
      // ignore
    }
  }, [editingLimits]);

  // Poll every 3 seconds
  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  async function handleAction(action: string) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/ocr/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = await res.json();
      if (action === "start" && !result.started) {
        setMessage(result.reason ?? "Could not start pipeline");
      } else if (action === "start") {
        setMessage("Pipeline started");
      } else if (action === "stop") {
        setMessage("Pipeline stopping...");
      }
      await fetchStatus();
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveLimits() {
    try {
      const res = await fetch("/api/ocr/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set-limits", dailyLimit, monthlyLimit }),
      });
      if (res.ok) {
        setEditingLimits(false);
        setMessage("Limits updated");
        await fetchStatus();
      }
    } catch {
      setMessage("Failed to update limits");
    }
  }

  if (!data) {
    return <div className="text-sm text-gray-400">Loading pipeline status...</div>;
  }

  const isRunning = data.state === "running";
  const isStopping = data.state === "stopping";
  const isStoppingAfterDoc = data.state === "stopping-after-doc";

  // Combine pipeline documents + queued documents not yet in pipeline
  const pipelineSlugs = new Set(data.documents.map((d) => d.slug));
  const allDocs = [
    ...data.documents,
    ...data.queued.filter((q) => !pipelineSlugs.has(q.slug)),
  ];

  return (
    <div className="space-y-6">
      <Link
        href={`/${locale}/reading-workshop`}
        className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
      >
        ← Back to Text Lab
      </Link>
      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleAction("start")}
          disabled={loading || isRunning || isStopping || isStoppingAfterDoc}
          className="px-4 py-2 text-sm font-medium rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-40"
        >
          {isRunning ? "Running..." : "Start Pipeline"}
        </button>
        <button
          onClick={() => handleAction("stop-after-doc")}
          disabled={loading || (!isRunning && !isStoppingAfterDoc)}
          className="px-4 py-2 text-sm font-medium rounded bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40"
        >
          {isStoppingAfterDoc ? "Finishing document…" : "Stop After Document"}
        </button>
        <button
          onClick={() => handleAction("stop")}
          disabled={loading || (!isRunning && !isStoppingAfterDoc)}
          className="px-4 py-2 text-sm font-medium rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-40"
        >
          {isStopping ? "Stopping..." : "Stop Now"}
        </button>

        <div className="ml-auto flex items-center gap-3">
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
            isRunning ? "text-green-600" : (isStopping || isStoppingAfterDoc) ? "text-amber-600" : "text-gray-400"
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              isRunning ? "bg-green-500 animate-pulse" : (isStopping || isStoppingAfterDoc) ? "bg-amber-500" : "bg-gray-300"
            }`} />
            {data.state}
          </span>

          {isRunning && data.currentSlug && (() => {
            const totalRemaining = allDocs.reduce((sum, d) => {
              const rem = (d.totalPages || 0) - (d.completedPages || 0);
              return sum + Math.max(0, rem);
            }, 0);
            const eta = data.avgSecondsPerPage && totalRemaining > 0
              ? formatEta(totalRemaining * data.avgSecondsPerPage)
              : null;
            return (
              <span className="text-xs text-gray-500">
                Page {data.currentPage} &middot; {data.pagesProcessed} done &middot; {data.errors} errors
                {eta && <> &middot; ~{eta} remaining</>}
              </span>
            );
          })()}

          <Link
            href={`/${locale}/reading-workshop`}
            className="px-3 py-1.5 text-xs rounded border border-gray-300 text-gray-500 hover:bg-gray-50"
          >
            Text Lab
          </Link>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded bg-blue-50 border border-blue-200 text-sm text-blue-800">
          {message}
        </div>
      )}

      {/* Usage Stats */}
      <div className="grid grid-cols-2 gap-4">
        <UsageCard
          label="Today"
          count={data.usage.today}
          limit={data.usage.dailyLimit}
          limitReached={data.usage.dailyLimitReached}
        />
        <UsageCard
          label="This Month"
          count={data.usage.month}
          limit={data.usage.monthlyLimit}
          limitReached={data.usage.monthlyLimitReached}
        />
      </div>

      {/* Limit Editor */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">API Limits</p>
          {!editingLimits ? (
            <button
              onClick={() => setEditingLimits(true)}
              className="text-xs text-indigo-600 hover:underline"
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleSaveLimits} className="text-xs text-green-600 hover:underline">
                Save
              </button>
              <button onClick={() => setEditingLimits(false)} className="text-xs text-gray-400 hover:underline">
                Cancel
              </button>
            </div>
          )}
        </div>
        {editingLimits ? (
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs">
              Daily:
              <input
                type="number"
                min={0}
                value={dailyLimit}
                onChange={(e) => setDailyLimit(Number(e.target.value))}
                className="w-24 px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </label>
            <label className="flex items-center gap-2 text-xs">
              Monthly:
              <input
                type="number"
                min={0}
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(Number(e.target.value))}
                className="w-24 px-2 py-1 border border-gray-300 rounded text-xs"
              />
            </label>
            <span className="text-[10px] text-gray-400 self-center">0 = unlimited</span>
          </div>
        ) : (
          <p className="text-xs text-gray-500">
            Daily: {data.usage.dailyLimit || "unlimited"} &middot; Monthly: {data.usage.monthlyLimit || "unlimited"}
          </p>
        )}
      </div>

      {/* Document Queue */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Documents ({allDocs.length})
        </p>

        {allDocs.length === 0 ? (
          <div className="text-sm text-gray-400 bg-gray-50 rounded-lg p-8 text-center">
            No documents in queue. Queue documents from the{" "}
            <Link href={`/${locale}/reading-workshop`} className="text-indigo-600 hover:underline">
              Text Lab hub
            </Link>.
          </div>
        ) : (
          <div className="space-y-2">
            {allDocs.map((doc) => (
              <DocumentRow
                key={doc.slug}
                doc={doc}
                isCurrent={data.currentSlug === doc.slug}
                currentPage={data.currentSlug === doc.slug ? data.currentPage : null}
                avgSecondsPerPage={data.avgSecondsPerPage}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UsageCard({
  label,
  count,
  limit,
  limitReached,
}: {
  label: string;
  count: number;
  limit: number;
  limitReached: boolean;
}) {
  const pct = limit > 0 ? Math.min(100, (count / limit) * 100) : 0;
  const barColor = limitReached
    ? "bg-red-500"
    : pct > 80
    ? "bg-amber-500"
    : "bg-green-500";

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <span className="text-2xl font-bold text-gray-900 tabular-nums">{count}</span>
      </div>
      {limit > 0 ? (
        <>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-1">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>{limitReached ? "Limit reached" : `${Math.round(pct)}% used`}</span>
            <span>{limit - count > 0 ? `${limit - count} remaining` : "0 remaining"}</span>
          </div>
        </>
      ) : (
        <p className="text-[10px] text-gray-400">No limit set</p>
      )}
    </div>
  );
}

function DocumentRow({
  doc,
  isCurrent,
  currentPage,
  avgSecondsPerPage,
}: {
  doc: DocumentProgress;
  isCurrent: boolean;
  currentPage: number | null;
  avgSecondsPerPage: number | null;
}) {
  const pct = doc.totalPages > 0 ? (doc.completedPages / doc.totalPages) * 100 : 0;

  const statusColors: Record<string, string> = {
    waiting: "bg-gray-100 text-gray-600",
    processing: "bg-blue-100 text-blue-700",
    complete: "bg-green-100 text-green-700",
    error: "bg-red-100 text-red-700",
  };

  return (
    <div className={`border rounded-lg p-3 ${isCurrent ? "border-blue-300 bg-blue-50/30" : "border-gray-200 bg-white"}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{doc.title}</p>
          <p className="text-[10px] text-gray-400">{doc.slug}</p>
        </div>
        <div className="flex items-center gap-2 ml-3">
          {isCurrent && currentPage && (
            <span className="text-[10px] text-blue-600 font-medium">
              Page {currentPage}
            </span>
          )}
          <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusColors[doc.status] ?? statusColors.waiting}`}>
            {doc.status}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              doc.status === "error" ? "bg-red-400" : doc.status === "complete" ? "bg-green-500" : "bg-blue-500"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] text-gray-400 tabular-nums text-right">
          {doc.completedPages} / {doc.totalPages || "?"} pages
          {avgSecondsPerPage && doc.totalPages > 0 && doc.status !== "complete" && doc.completedPages < doc.totalPages && (
            <> &middot; ~{formatEta((doc.totalPages - doc.completedPages) * avgSecondsPerPage)}</>
          )}
        </span>
      </div>

      {doc.error && (
        <p className="text-[10px] text-red-500 mt-1">{doc.error}</p>
      )}
    </div>
  );
}
