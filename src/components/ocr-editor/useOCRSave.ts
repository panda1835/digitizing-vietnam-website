import { useRef, useCallback } from "react";
import type { SpatialCharacter } from "@/lib/ocr-store";

/**
 * Returns a debounced save function that PUTs updated spatial data
 * to /api/ocr/spatial-data/{slug}/{page}.
 *
 * Calls onSaved(rawText) on success.
 */
export function useOCRSave(
  slug: string,
  page: number,
  onSaved?: (rawText: string) => void
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(
    (spatialData: SpatialCharacter[], immediate = false) => {
      if (timerRef.current) clearTimeout(timerRef.current);

      const doSave = async () => {
        try {
          const res = await fetch(
            `/api/ocr/spatial-data/${encodeURIComponent(slug)}/${page}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ spatialData }),
            }
          );
          if (res.ok) {
            const data = await res.json();
            onSaved?.(data.rawText ?? "");
          }
        } catch {
          // silent fail — user can retry
        }
      };

      if (immediate) {
        doSave();
      } else {
        timerRef.current = setTimeout(doSave, 1000);
      }
    },
    [slug, page, onSaved]
  );

  return save;
}
