import { useRef, useCallback, useEffect } from "react";
import type { SpatialCharacter, ConfirmedColumn } from "@/lib/ocr-store";

export interface SaveExtras {
  /** Pass `null` to explicitly clear; omit to leave existing value as-is. */
  columns?: ConfirmedColumn[] | null;
  columnsConfirmedAt?: string | null;
  charsConfirmedAt?: string | null;
  nnvCompletedAt?: string | null;
  quocNguConfirmedAt?: string | null;
}

/**
 * Returns a debounced save function that PUTs updated spatial data
 * to /api/ocr/spatial-data/{slug}/{page}.
 *
 * Calls onSaved(rawText, spatialData) on success — `spatialData` is the
 * server's canonical (re-flowed, re-numbered) version, which callers
 * should adopt as local state to stay in sync with on-disk offsets.
 * Calls onError(message) on failure.
 *
 * Pending debounced saves are flushed on component unmount and on the
 * tab's `beforeunload` event so unconfirmed in-progress edits aren't
 * lost when the user navigates away mid-typing.
 */
export function useOCRSave(
  slug: string,
  page: number,
  onSaved?: (rawText: string, spatialData?: SpatialCharacter[]) => void,
  onError?: (message: string) => void
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Snapshot of the most recent pending payload so we can flush it
  // synchronously on unmount / beforeunload without depending on stale
  // closure values.
  const pendingRef = useRef<{
    spatialData: SpatialCharacter[];
    extras?: SaveExtras;
  } | null>(null);

  const flushSync = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    pendingRef.current = null;
    // keepalive lets the request complete after the page is unloading.
    // We deliberately don't await — beforeunload can't await promises
    // and unmount-time flushes don't need to surface errors back.
    fetch(`/api/ocr/spatial-data/${encodeURIComponent(slug)}/${page}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        spatialData: pending.spatialData,
        ...(pending.extras ?? {}),
      }),
      keepalive: true,
    }).catch(() => {});
  }, [slug, page]);

  const save = useCallback(
    (
      spatialData: SpatialCharacter[],
      immediate = false,
      extras?: SaveExtras
    ) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      pendingRef.current = { spatialData, extras };

      const doSave = async () => {
        const pending = pendingRef.current;
        if (!pending) return;
        pendingRef.current = null;
        try {
          const res = await fetch(
            `/api/ocr/spatial-data/${encodeURIComponent(slug)}/${page}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                spatialData: pending.spatialData,
                ...(pending.extras ?? {}),
              }),
            }
          );
          if (res.ok) {
            const data = await res.json();
            onSaved?.(data.rawText ?? "", data.spatialData);
          } else {
            const body = await res.text().catch(() => "");
            onError?.(`Save failed (${res.status})${body ? `: ${body}` : ""}`);
          }
        } catch (e: any) {
          onError?.(e?.message ?? "Save failed (network error)");
        }
      };

      if (immediate) {
        doSave();
      } else {
        timerRef.current = setTimeout(doSave, 1000);
      }
    },
    [slug, page, onSaved, onError]
  );

  // Flush pending edits when the tab is about to close or the user
  // navigates away (router transitions trigger unmount). Without this,
  // a keystroke ≤1s before navigation would never persist.
  useEffect(() => {
    const onBeforeUnload = () => flushSync();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      flushSync();
    };
  }, [flushSync]);

  return save;
}
