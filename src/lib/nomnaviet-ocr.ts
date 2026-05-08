"use client";

import type { SpatialCharacter } from "./ocr-store";

export interface NomNaVietCandidate {
  char: string;
  confidence: number;
}

/**
 * Concurrency limiter — gates async fns so at most `n` run in parallel.
 * Returned function takes an async thunk and resolves with its result.
 */
export function pLimit(n: number) {
  let active = 0;
  const queue: (() => void)[] = [];
  const next = () => {
    active--;
    queue.shift()?.();
  };
  return <T>(fn: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const run = () => {
        active++;
        fn().then(resolve, reject).finally(next);
      };
      if (active < n) run();
      else queue.push(run);
    });
}

/**
 * Crop a bbox out of a loaded HTMLImageElement to a 64×64 grayscale image
 * and return a flat array of 4096 pixel values normalized to [0, 1].
 *
 * The Nôm Na Việt OCR endpoint accepts raw pixel arrays (model input
 * tensor) — not images — and expects exactly 4096 values per character.
 *
 * Bbox is expanded by `padFrac` on each side to avoid stroke clipping.
 * Background is white-padded if the cropped region is non-square so the
 * char keeps its aspect ratio inside the 64×64 frame.
 */
export const NNV_INPUT_SIZE = 64;

/**
 * Per-character preprocessing options applied inside cropBboxToPixelArray
 * after the standard 64×64 resize but before normalizing to [0, 1] floats.
 * Each step is independent and can be enabled in any combination.
 */
export interface PerCharCropOptions {
  /**
   * Apply Otsu threshold to the 64×64 grayscale buffer, producing a
   * binary 0 / 255 image. Useful when the source has uneven illumination
   * and the page-level threshold isn't tight enough on this character.
   */
  threshold?: boolean;
  /**
   * After thresholding, find the ink bounding box, scale it to fill ~80%
   * of the 64×64 frame, and re-center. Trades some scale variation for
   * better consistency across characters with different bbox padding.
   */
  center?: boolean;
  /**
   * Apply a 3×3 morphological close (grow-dark then shrink-dark) on the
   * binarized buffer. Reconnects fragmented strokes that survived the
   * page-level pipeline. Implies `threshold` when set.
   */
  morphClose?: boolean;
}

/** Otsu's method: pick threshold maximizing between-class variance. */
function otsuThreshold(gray: Uint8Array): number {
  const hist = new Uint32Array(256);
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
  const total = gray.length;
  let sumAll = 0;
  for (let i = 0; i < 256; i++) sumAll += i * hist[i];
  let wB = 0;
  let sumB = 0;
  let maxVar = -1;
  let bestT = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sumAll - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > maxVar) {
      maxVar = between;
      bestT = t;
    }
  }
  return bestT;
}

/** 3×3 morphological close on a binary buffer (0 = ink, 255 = bg). */
function binaryMorphClose3x3(buf: Uint8Array, n: number) {
  const grown = new Uint8Array(n * n);
  // Grow dark (min filter): output 0 if any neighbor is 0.
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let m = 255;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny < 0 || ny >= n || nx < 0 || nx >= n) continue;
          if (buf[ny * n + nx] < m) m = buf[ny * n + nx];
        }
      }
      grown[y * n + x] = m;
    }
  }
  // Shrink dark (max filter): output 255 if any neighbor is 255.
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      let m = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = y + dy;
          const nx = x + dx;
          if (ny < 0 || ny >= n || nx < 0 || nx >= n) continue;
          if (grown[ny * n + nx] > m) m = grown[ny * n + nx];
        }
      }
      buf[y * n + x] = m;
    }
  }
}

/**
 * Tight-crop the dark ink bounding box and rescale it to fill ~80% of
 * the n×n frame, centered. Operates on a binary buffer (0 = ink, 255 =
 * background); pixels outside the new ink-fit region become background.
 */
function tightCenter(buf: Uint8Array, n: number) {
  // Find ink bbox — every pixel < 128 counts as ink (works on binary
  // and grayscale alike).
  let minX = n;
  let maxX = -1;
  let minY = n;
  let maxY = -1;
  let inkCount = 0;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (buf[y * n + x] < 128) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        inkCount++;
      }
    }
  }
  if (maxX < 0) return; // no ink at all — nothing to center
  // Defensive: if the ink bbox already fills most of the frame, there's
  // no useful re-centering to do (and the upscale would just produce
  // a flat-black preview when the source is mostly ink). Skip in that
  // case so the user sees the original (possibly thresholded) buffer.
  const inkW = maxX - minX + 1;
  const inkH = maxY - minY + 1;
  const frameArea = n * n;
  if (inkW * inkH >= frameArea * 0.85) return;
  // Also bail if there's only a tiny speck of ink (≤4 pixels). Scaling
  // a 2×2 ink blob to 80% of the frame produces a giant black square
  // that confuses the user; better to leave the original alone.
  if (inkCount <= 4) return;

  // Target: ink fills ~80% of frame.
  const targetSize = Math.floor(n * 0.8);
  const scale = Math.min(targetSize / inkW, targetSize / inkH);
  const newW = Math.max(1, Math.round(inkW * scale));
  const newH = Math.max(1, Math.round(inkH * scale));
  const offX = Math.floor((n - newW) / 2);
  const offY = Math.floor((n - newH) / 2);
  // Sample-and-place: for each output pixel inside the centered box,
  // sample the corresponding source pixel from the ink region with
  // nearest-neighbor.
  const out = new Uint8Array(n * n).fill(255);
  for (let y = 0; y < newH; y++) {
    for (let x = 0; x < newW; x++) {
      const sx = Math.min(inkW - 1, Math.floor((x / newW) * inkW));
      const sy = Math.min(inkH - 1, Math.floor((y / newH) * inkH));
      out[(y + offY) * n + (x + offX)] = buf[(sy + minY) * n + (sx + minX)];
    }
  }
  buf.set(out);
}

export async function cropBboxToPixelArray(
  img: HTMLImageElement,
  bbox: Array<{ x: number; y: number }>,
  padFrac = 0.1,
  perChar?: PerCharCropOptions
): Promise<number[]> {
  const xs = bbox.map((p) => p.x);
  const ys = bbox.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const W = img.naturalWidth;
  const H = img.naturalHeight;

  // Bbox in source pixels, expanded, clamped.
  const w0 = (maxX - minX) * W;
  const h0 = (maxY - minY) * H;
  const padX = w0 * padFrac;
  const padY = h0 * padFrac;
  const sx = Math.max(0, minX * W - padX);
  const sy = Math.max(0, minY * H - padY);
  const sw = Math.min(W - sx, w0 + 2 * padX);
  const sh = Math.min(H - sy, h0 + 2 * padY);

  // Render onto a 64×64 canvas, preserving aspect ratio with white padding.
  const N = NNV_INPUT_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = N;
  canvas.height = N;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get 2D context");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, N, N);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const scale = Math.min(N / sw, N / sh);
  const dw = Math.max(1, Math.round(sw * scale));
  const dh = Math.max(1, Math.round(sh * scale));
  const dx = Math.floor((N - dw) / 2);
  const dy = Math.floor((N - dh) / 2);
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

  // Pull RGBA pixels and convert to single-channel luminance.
  const { data } = ctx.getImageData(0, 0, N, N);
  const gray = new Uint8Array(N * N);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Rec. 709 luma → grayscale 0..255.
    gray[p] = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
  }

  // Per-character preprocessing — each toggle is independent. Skipping
  // threshold leaves the buffer grayscale; morphClose / tightCenter
  // both work on grayscale buffers (morph: min/max filters are valid
  // for any data; tightCenter uses <128 as an ink heuristic regardless).
  // This lets the user disable threshold and still see a useful
  // "centered grayscale" or "smoothed grayscale" preview.
  if (perChar?.threshold) {
    const t = otsuThreshold(gray);
    for (let i = 0; i < gray.length; i++) {
      gray[i] = gray[i] < t ? 0 : 255;
    }
  }
  if (perChar?.morphClose) {
    binaryMorphClose3x3(gray, N);
  }
  if (perChar?.center) {
    tightCenter(gray, N);
  }

  // Normalize to [0, 1] floats. Convention: white = 1.0 (matches the
  // input distribution the model was trained on; flip with `1 - v` if
  // that ever changes upstream).
  const out = new Array<number>(N * N);
  for (let i = 0; i < N * N; i++) out[i] = gray[i] / 255;
  return out;
}

/**
 * POST one char's flat pixel array to /api/ocr/nomnaviet (proxied upstream).
 * Returns top-N candidates, sorted descending by confidence.
 */
/**
 * True iff `s`'s first code point is in the Supplementary Ideographic Plane
 * (CJK Ext B and beyond, U+20000–U+2FFFF, plus the rarely-used U+2F800-2FA1F
 * compatibility supplement). Nôm-specific demotic characters live here;
 * standard Han characters live in BMP (U+3400-9FFF, U+F900-FAFF).
 *
 * Used to decide whether a Nôm Na Việt prediction "wins" over the original
 * Kandianguji reading: if NNV returns a SIP char, it's almost certainly the
 * correct Nôm form (kandi can't even produce SIP chars). If NNV returns a
 * BMP Han char, kandi is at least as likely to be right, so we keep kandi
 * as primary and still surface NNV candidates in `choices[]` for review.
 */
export function isNomSipChar(s: string): boolean {
  if (!s) return false;
  const cp = s.codePointAt(0) ?? 0;
  return (
    (cp >= 0x20000 && cp <= 0x2ffff) || (cp >= 0x2f800 && cp <= 0x2fa1f)
  );
}

/** Thrown when upstream is unavailable / rate-limiting — orchestrator should bail. */
export class NomNaVietUnavailableError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "NomNaVietUnavailableError";
    this.status = status;
  }
}

export async function recognizeSingleChar(
  pixels: number[],
  topK = 9
): Promise<NomNaVietCandidate[]> {
  const res = await fetch("/api/ocr/nomnaviet", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageData: pixels, topK }),
  });
  if (res.status === 503 || res.status === 429) {
    throw new NomNaVietUnavailableError(
      res.status,
      res.status === 503
        ? "Nôm Na Việt server is under maintenance — try again later."
        : "Rate limited by Nôm Na Việt — back off and retry."
    );
  }
  if (!res.ok) throw new Error(`Nôm Na Việt OCR failed: HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.candidates) ? data.candidates : [];
}

/**
 * Hybrid orchestrator.
 *
 * 1. Caller already ran Kandianguji (we don't re-run it — the OCRTester
 *    test page already has those results in `kandiSpatialData`).
 * 2. For each char with a bbox, crop and re-OCR with Nôm Na Việt.
 * 3. Merge: text = NNV top-1, choices = [NNV top-2..N, kandi.text,
 *    ...kandi.choices], deduplicated.
 *
 * Failures per char are tolerated — that char keeps its Kandianguji
 * reading so a single 502 doesn't blow up a whole 500-char page.
 */
export interface NomNaVietReplacement {
  offset: number;
  kandiChar: string;
  kandiConf: number;
  nnvChar: string | null;
  nnvConf: number | null;
  /** True iff the top NNV candidate differs from the kandi guess. */
  changed: boolean;
}

export interface RerecognizeResult {
  spatialData: SpatialCharacter[];
  replacements: NomNaVietReplacement[];
}

export async function rerecognizeWithNomNaViet(
  img: HTMLImageElement,
  kandiSpatialData: SpatialCharacter[],
  options: {
    topK?: number;
    concurrency?: number;
    /** Skip chars whose kandi confidence is at/above this (0–1). Default 1 = process all. */
    confidenceThreshold?: number;
    /** Per-slot polite delay added before each request (ms). Default 0. */
    slotJitterMs?: number;
    onProgress?: (done: number, total: number) => void;
    /** Fires after each per-char request, before the final merge. */
    onReplacement?: (rep: NomNaVietReplacement) => void;
    /** Per-character preprocessing applied inside cropBboxToPixelArray. */
    perChar?: PerCharCropOptions;
  } = {}
): Promise<RerecognizeResult> {
  const {
    topK = 9,
    concurrency = 3,
    confidenceThreshold = 1,
    slotJitterMs = 0,
    perChar,
    onProgress,
    onReplacement,
  } = options;
  const limit = pLimit(concurrency);

  // confidenceThreshold >= 1 means "send every char with a bbox" — skip the
  // conf filter entirely so chars whose kandi confidence is exactly 1.0
  // (which happens) still get sent.
  const sendAll = confidenceThreshold >= 1;
  const charsWithBbox = kandiSpatialData
    .map((c, idx) => ({ c, idx }))
    .filter((x) => x.c.bbox && (sendAll || x.c.confidence < confidenceThreshold));
  const total = charsWithBbox.length;
  let done = 0;

  const sleep = (ms: number) =>
    ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve();

  // Two abort triggers:
  // 1. Any 503/429 from the proxy → instantly stop (service is asking us to back off).
  // 2. CONSECUTIVE_ERROR_LIMIT successive failures of any kind → stop (something
  //    is wrong — bad image format, wrong endpoint, etc. — and there's no point
  //    grinding through hundreds more identical failures).
  const CONSECUTIVE_ERROR_LIMIT = 5;
  let aborted: Error | null = null;
  let consecutiveErrors = 0;

  const recognized: Array<{
    idx: number;
    candidates: NomNaVietCandidate[] | null;
  }> = await Promise.all(
    charsWithBbox.map(({ c, idx }) =>
      limit(async () => {
        if (aborted) {
          done++;
          onProgress?.(done, total);
          return { idx, candidates: null };
        }
        let candidates: NomNaVietCandidate[] | null = null;
        try {
          if (slotJitterMs > 0) {
            await sleep(slotJitterMs * (0.5 + Math.random()));
          }
          const pixels = await cropBboxToPixelArray(img, c.bbox!, 0.1, perChar);
          candidates = await recognizeSingleChar(pixels, topK);
          consecutiveErrors = 0;
        } catch (e) {
          consecutiveErrors++;
          if (e instanceof NomNaVietUnavailableError && !aborted) {
            aborted = e;
          } else if (consecutiveErrors >= CONSECUTIVE_ERROR_LIMIT && !aborted) {
            aborted = new Error(
              `Aborted Nôm Na Việt run after ${CONSECUTIVE_ERROR_LIMIT} consecutive failures: ${
                (e as Error)?.message ?? "unknown error"
              }`
            );
          }
          candidates = null;
        }
        // Stream a partial replacement so the UI can grow live instead of
        // waiting for the entire batch to complete. Same rule as the final
        // merge: only mark "changed" when NNV's top guess is a SIP Nôm char.
        const top1 = candidates && candidates.length > 0 ? candidates[0] : null;
        onReplacement?.({
          offset: c.offset,
          kandiChar: c.text,
          kandiConf: c.confidence,
          nnvChar: top1?.char ?? null,
          nnvConf: top1?.confidence ?? null,
          changed: !!top1 && isNomSipChar(top1.char) && top1.char !== c.text,
        });
        done++;
        onProgress?.(done, total);
        return { idx, candidates };
      })
    )
  );

  if (aborted) throw aborted;

  // Merge into a fresh array so we don't mutate input. Also build a flat
  // replacements log (one entry per char attempted) so the UI / console can
  // show every kandi → NNV mapping.
  const merged: SpatialCharacter[] = kandiSpatialData.map((c) => ({ ...c }));
  const replacements: NomNaVietReplacement[] = [];
  for (const { idx, candidates } of recognized) {
    const orig = merged[idx];
    if (!candidates || candidates.length === 0) {
      replacements.push({
        offset: orig.offset,
        kandiChar: orig.text,
        kandiConf: orig.confidence,
        nnvChar: null,
        nnvConf: null,
        changed: false,
      });
      continue;
    }
    const top1 = candidates[0];
    const allNnvChars = candidates.map((x) => x.char);
    const origChoices = (orig as any).choices as string[] | undefined;

    // Replace primary text only when NNV's top guess is a Nôm-specific SIP
    // character (one Kandianguji literally cannot produce). For BMP/Han
    // top-1s, keep the kandi reading as primary but stack the NNV candidates
    // into choices[] so the user can still flip to them if desired.
    const replacePrimary = isNomSipChar(top1.char);
    const newPrimary = replacePrimary ? top1.char : orig.text;

    const seen = new Set<string>([newPrimary]);
    const choices: string[] = [];
    const push = (s: string | undefined) => {
      if (s && !seen.has(s)) {
        seen.add(s);
        choices.push(s);
      }
    };
    if (replacePrimary) {
      // NNV won — its remaining candidates first, then original kandi reading.
      for (const c of allNnvChars.slice(1)) push(c);
      push(orig.text);
    } else {
      // Kandi stayed — surface the full NNV ranking after kandi.
      for (const c of allNnvChars) push(c);
    }
    if (origChoices) for (const c of origChoices) push(c);

    replacements.push({
      offset: orig.offset,
      kandiChar: orig.text,
      kandiConf: orig.confidence,
      nnvChar: top1.char,
      nnvConf: top1.confidence,
      changed: replacePrimary && top1.char !== orig.text,
    });

    // Strip per-char Quốc Ngữ readings when the primary glyph was
    // replaced. They were keyed to the old text and are stale after a
    // replacement; carrying them forward would silently mislabel readings.
    // When kandi text stays put (replacePrimary=false), readings are kept.
    const origForMerge: SpatialCharacter = replacePrimary
      ? (() => {
          const { quocNgu: _q, quocNguChoices: _qc, ...rest } = orig;
          return rest as SpatialCharacter;
        })()
      : orig;
    merged[idx] = {
      ...origForMerge,
      text: newPrimary,
      // Re-stamp originalText to the post-NNV reading. NNV is part of the
      // OCR pipeline, not a human correction, so its replacement should be
      // treated as "the original OCR result" for the corrections aggregate.
      originalText: newPrimary,
      confidence: replacePrimary
        ? top1.confidence || orig.confidence
        : orig.confidence,
      ...(choices.length > 0 ? { choices } : {}),
    } as SpatialCharacter;
  }

  return { spatialData: merged, replacements };
}
