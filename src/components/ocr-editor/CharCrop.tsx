"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Client-side glyph crop. DVN has no `sharp` and page images are remote
 * (IIIF / Supabase Storage), so unlike nom-ocr-training's server-side
 * char-crop we draw the bbox region in the browser from the existing
 * page-image proxy (CORS-open, cache-headered). Each distinct page image
 * is fetched + decoded once per session via the module-level cache below,
 * so a glyph that occurs on N pages costs N image loads regardless of how
 * many occurrences share a page — the right shape for large-scale review.
 */

type Point = { x: number; y: number };

// Per-session image cache: pageImageUrl → decoded <img>. Many occurrence
// cells share a page; this guarantees one decode per page even before the
// HTTP cache warms.
const imageCache = new Map<string, Promise<HTMLImageElement>>();

function loadPageImage(url: string): Promise<HTMLImageElement> {
  const hit = imageCache.get(url);
  if (hit) return hit;
  const p = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image load failed"));
    img.src = url;
  });
  imageCache.set(url, p);
  return p;
}

interface CharCropProps {
  slug: string;
  page: number;
  bbox: Point[] | null;
  /** Padding around the glyph as a fraction of its bbox size. */
  padFrac?: number;
  className?: string;
}

export default function CharCrop({
  slug,
  page,
  bbox,
  padFrac = 0.15,
  className,
}: CharCropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">(
    "loading"
  );

  useEffect(() => {
    let cancelled = false;
    if (!bbox || bbox.length === 0) {
      setStatus("error");
      return;
    }
    const url = `/api/admin/ocr/page-image/${encodeURIComponent(
      slug
    )}/${page}`;
    setStatus("loading");
    loadPageImage(url)
      .then((img) => {
        if (cancelled) return;
        const W = img.naturalWidth;
        const H = img.naturalHeight;
        if (!W || !H) throw new Error("image has no dimensions");
        const xs = bbox.map((p) => p.x);
        const ys = bbox.map((p) => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const w0 = (maxX - minX) * W;
        const h0 = (maxY - minY) * H;
        const padX = w0 * padFrac;
        const padY = h0 * padFrac;
        const left = Math.max(0, Math.round(minX * W - padX));
        const top = Math.max(0, Math.round(minY * H - padY));
        const width = Math.min(W - left, Math.round(w0 + 2 * padX));
        const height = Math.min(H - top, Math.round(h0 + 2 * padY));
        if (width < 2 || height < 2) throw new Error("bbox too small");
        const canvas = canvasRef.current;
        if (!canvas) return;
        // Intrinsic size = crop px; CSS object-contain handles display
        // scaling without distorting the glyph aspect ratio.
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("canvas unsupported");
        ctx.drawImage(
          img,
          left,
          top,
          width,
          height,
          0,
          0,
          width,
          height
        );
        setStatus("ok");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [slug, page, bbox, padFrac]);

  return (
    <div
      className={
        className ??
        "w-full aspect-square bg-gray-50 border border-transparent rounded relative overflow-hidden"
      }
    >
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-contain ${
          status === "ok" ? "" : "invisible"
        }`}
      />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-300">
          …
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-300">
          no image
        </div>
      )}
    </div>
  );
}
