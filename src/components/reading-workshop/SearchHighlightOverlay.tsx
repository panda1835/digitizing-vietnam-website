"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface BBox {
  x: number;
  y: number;
}

interface SearchHighlightOverlayProps {
  slug: string;
  page: number;
  query: string | null;
  /** Duration in ms before highlights fade out */
  duration?: number;
}

const FADE_DURATION = 8000;

/**
 * Transparent overlay that draws temporary highlight rectangles on top of the
 * image pane for characters matching a search query.  Uses normalised (0–1)
 * bounding-box coordinates from the OCR spatial data.
 *
 * The overlay measures the actual OpenSeadragon viewport area within the
 * Mirador container (accounting for the window toolbar and thumbnail panel)
 * and maps normalised coords into that region.
 */
export default function SearchHighlightOverlay({
  slug,
  page,
  query,
  duration = FADE_DURATION,
}: SearchHighlightOverlayProps) {
  const [highlights, setHighlights] = useState<BBox[][]>([]);
  const [visible, setVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  // Pixel bounds of the OSD viewport relative to the overlay container
  const [osdBounds, setOsdBounds] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  // Measure the actual OpenSeadragon viewport within the parent container
  const measure = useCallback(() => {
    const overlay = containerRef.current;
    if (!overlay) return;
    const parent = overlay.parentElement;
    if (!parent) return;

    // OpenSeadragon creates a container with this class
    const osdEl = parent.querySelector(".openseadragon-container") as HTMLElement;
    if (!osdEl) return;

    const overlayRect = overlay.getBoundingClientRect();
    const osdRect = osdEl.getBoundingClientRect();

    setOsdBounds({
      left: osdRect.left - overlayRect.left,
      top: osdRect.top - overlayRect.top,
      width: osdRect.width,
      height: osdRect.height,
    });
  }, []);

  // Fetch highlight bboxes when query changes
  useEffect(() => {
    if (!query) { setHighlights([]); setVisible(false); return; }

    let cancelled = false;
    fetch(
      `/api/ocr/highlight/${encodeURIComponent(slug)}/${page}?q=${encodeURIComponent(query)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data.highlights?.length) {
          setHighlights(data.highlights);
          setVisible(true);
        } else {
          setHighlights([]);
          setVisible(false);
        }
      })
      .catch(() => { if (!cancelled) { setHighlights([]); setVisible(false); } });

    return () => { cancelled = true; };
  }, [slug, page, query]);

  // Measure OSD viewport once highlights are visible, with retries until the
  // OSD container is found (Mirador may still be mounting).
  useEffect(() => {
    if (!visible) { setOsdBounds(null); return; }

    let tries = 0;
    const maxTries = 15;
    const timer = setInterval(() => {
      measure();
      tries++;
      if (osdBounds || tries >= maxTries) clearInterval(timer);
    }, 200);

    return () => clearInterval(timer);
  }, [visible, measure]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-fade after duration
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [visible, duration]);

  if (!visible || highlights.length === 0) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 10,
        overflow: "hidden",
      }}
    >
      <style>{`
        .search-img-hl {
          position: absolute;
          background: rgba(251, 191, 36, 0.4);
          border: 1px solid rgba(251, 191, 36, 0.7);
          border-radius: 2px;
          animation: imgHlFade ${duration}ms ease-out forwards;
          pointer-events: none;
        }
        @keyframes imgHlFade {
          0%, 60% { opacity: 1; }
          100%    { opacity: 0; }
        }
      `}</style>
      {highlights.map((bbox, i) => {
        if (!bbox || bbox.length < 4) return null;
        const xs = bbox.map((p) => p.x);
        const ys = bbox.map((p) => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        // Map normalised image coords into the measured OSD viewport area,
        // or fall back to full-container percentages if not yet measured.
        const style = osdBounds
          ? {
              left: `${osdBounds.left + minX * osdBounds.width}px`,
              top: `${osdBounds.top + minY * osdBounds.height}px`,
              width: `${(maxX - minX) * osdBounds.width}px`,
              height: `${(maxY - minY) * osdBounds.height}px`,
            }
          : {
              left: `${minX * 100}%`,
              top: `${minY * 100}%`,
              width: `${(maxX - minX) * 100}%`,
              height: `${(maxY - minY) * 100}%`,
            };

        return (
          <div
            key={i}
            className="search-img-hl"
            style={style}
          />
        );
      })}
    </div>
  );
}
