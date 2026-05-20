"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Target {
  slug: string;
  page: number;
  offset: number;
}

interface BulkRelabelProps {
  query: string;
  targets: Target[];
  /** Seed value for the "new label" input — used by the sidebar's
   *  click-to-prefill flow that lands here via `?prefill=…`. */
  prefill?: string;
}

export default function BulkRelabel({
  query,
  targets,
  prefill,
}: BulkRelabelProps) {
  const router = useRouter();
  const [newLabel, setNewLabel] = useState(prefill ?? "");

  // Keep the input in sync with the URL's `prefill` param. The component
  // doesn't remount on soft navigations between sidebar pairs, so the
  // initializer above only runs the first time — without this effect,
  // clicking a pair only updates the input on a hard refresh.
  useEffect(() => {
    if (prefill !== undefined) setNewLabel(prefill);
  }, [prefill]);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">(
    "idle"
  );
  const [progress, setProgress] = useState({
    done: 0,
    failed: 0,
    skipped: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const total = targets.length;
  const trimmed = newLabel.trim();
  const canRun =
    trimmed.length > 0 &&
    trimmed !== query &&
    total > 0 &&
    status !== "running";

  // Open the styled confirm modal (replaces the browser confirm()).
  function requestRun() {
    if (!canRun) return;
    setConfirmOpen(true);
  }

  async function proceed() {
    setConfirmOpen(false);
    if (!canRun) return;
    setStatus("running");
    setError(null);
    setProgress({ done: 0, failed: 0, skipped: 0 });

    // One request. The server appends the human correction to just the
    // affected characters (append-only text_versions + denorm refresh) —
    // no per-occurrence whole-page rewrites.
    try {
      const res = await fetch("/api/admin/ocr/bulk-relabel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: trimmed, expect: query, targets }),
      });
      const j = (await res.json().catch(() => ({}))) as {
        done?: number;
        failed?: number;
        skipped?: number;
        errors?: string[];
      };
      const done = j.done ?? 0;
      const failed = j.failed ?? (res.ok ? 0 : total);
      const skipped = j.skipped ?? 0;
      setProgress({ done, failed, skipped });
      if (!res.ok || failed > 0) {
        setStatus("error");
        setError(j.errors?.[0] ?? `${failed} of ${total} failed`);
      } else {
        setStatus("done");
      }
    } catch (e: any) {
      setProgress({ done: 0, failed: total, skipped: 0 });
      setStatus("error");
      setError(e?.message ?? "request failed");
    }

    // No separate relabel-history log: the Supabase store's append-only
    // `text_versions` rows already are the durable correction audit trail.
    router.refresh();
  }

  return (
    <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50 flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-600">
        Relabel {total} selected →
      </span>
      <input
        type="text"
        value={newLabel}
        onChange={(e) => setNewLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") requestRun();
        }}
        placeholder="new label"
        maxLength={8}
        disabled={status === "running"}
        className="w-20 px-2 py-1 text-base font-han-nom text-center border border-gray-300 rounded focus:outline-none focus:border-indigo-400 disabled:opacity-50"
      />
      <button
        type="button"
        onClick={requestRun}
        disabled={!canRun}
        className="px-3 py-1 text-xs font-medium rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-30"
      >
        {status === "running"
          ? `Applying ${total}…`
          : `Apply to ${total} selected`}
      </button>
      {status === "done" && (
        <span className="text-xs text-emerald-600">
          ✓ Relabeled {progress.done}
          {progress.skipped > 0 && (
            <span className="text-gray-500">
              {" "}
              · {progress.skipped} skipped (unchanged)
            </span>
          )}
        </span>
      )}
      {status === "error" && (
        <span className="text-xs text-red-600">
          ✕ {error} ({progress.done} succeeded)
        </span>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="bg-white text-gray-900 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply bulk relabel?</DialogTitle>
            <DialogDescription className="text-gray-500">
              This writes a human correction to every selected occurrence.
              The original reading is kept in the version history.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-3 py-2 text-gray-800">
            <span className="font-han-nom text-2xl">{query}</span>
            <span className="text-gray-400">→</span>
            <span className="font-han-nom text-2xl text-rose-600">
              {trimmed || "—"}
            </span>
          </div>
          <p className="text-center text-sm text-gray-600">
            <strong>{total}</strong> selected occurrence
            {total === 1 ? "" : "s"}
          </p>
          <DialogFooter className="gap-2 sm:gap-2">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={proceed}
              disabled={!canRun}
              className="px-3 py-1.5 text-sm font-medium rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40"
            >
              Relabel {total}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
