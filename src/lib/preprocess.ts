/**
 * Image preprocessing for OCR. Runs in the browser via Canvas API.
 *
 * Operations applied in order:
 *   1. CSS filters (contrast, brightness, grayscale, invert)
 *   2. 3×3 median denoise
 *   3. CLAHE (local contrast normalization)
 *   4. Clean-background cutoff (push light pixels to white)
 *   5. 3×3 unsharp-mask sharpen
 *   6. Adaptive threshold via integral-image local mean
 *   7. Morphological open / close on the post-threshold image
 *
 * Pure: never mutates the input blob, never touches disk. Returns a JPEG
 * blob suitable for posting to the OCR pipeline.
 */

export interface PreprocessKnobs {
  invert: boolean;
  grayscale: boolean;
  /** [50, 200], default 100 (no-op). */
  contrast: number;
  /** [50, 200], default 100 (no-op). */
  brightness: number;
  denoise: boolean;
  /** [0, 255], default 0 (no-op). */
  cleanBg: number;
  adaptive: boolean;
  /** Odd, [3, 51], default 15. */
  blockSize: number;
  /** [0, 30], default 10. */
  adaptiveC: number;
  sharpen: boolean;
  /**
   * Fill broken strokes — dilate dark / erode dark in series. Reconnects
   * fragmented strokes common in old woodblock prints.
   */
  morphClose: boolean;
  /**
   * Remove ink speckle — erode dark / dilate dark in series. Drops tiny
   * stray ink dots smaller than the kernel without thinning real strokes.
   */
  morphOpen: boolean;
  /** Odd, [3, 7], default 3. Used by both morphClose and morphOpen. */
  morphKernel: number;
  /**
   * Contrast-Limited Adaptive Histogram Equalization. Tile-based local
   * contrast normalization — far better than the global contrast slider
   * for pages with shadow gradients, faded ink in some regions, or
   * partial bleed-through.
   */
  clahe: boolean;
  /** Tile edge length in px. [16, 128], default 64. Smaller = more local. */
  claheTileSize: number;
  /** Clip limit as a percentage. [10, 40], default 20 (= 2.0× expected). */
  claheClipLimit: number;
  /**
   * Per-character preprocessing applied inside `cropBboxToPixelArray`
   * before sending pixels to the Nôm Na Việt single-char endpoint.
   */
  perCharThreshold: boolean;
  /** Tight-crop the binarized glyph and re-center it inside the 64×64 frame. */
  perCharCenter: boolean;
  /** Small (3×3) morph close on the binarized crop to repair stroke gaps. */
  perCharMorphClose: boolean;
}

/** All knobs at no-op values. */
export const NEUTRAL_KNOBS: PreprocessKnobs = {
  invert: false,
  grayscale: false,
  contrast: 100,
  brightness: 100,
  denoise: false,
  cleanBg: 0,
  adaptive: false,
  blockSize: 15,
  adaptiveC: 10,
  sharpen: false,
  morphClose: false,
  morphOpen: false,
  morphKernel: 3,
  clahe: false,
  claheTileSize: 64,
  claheClipLimit: 20,
  perCharThreshold: false,
  perCharCenter: false,
  perCharMorphClose: false,
};

/**
 * Coerce a partial / legacy knob set to a complete one by spreading
 * NEUTRAL_KNOBS underneath. Lets callers safely consume manifests that
 * predate any new field additions — missing fields default to no-op.
 */
export function coerceKnobs(
  partial: Partial<PreprocessKnobs> | null | undefined
): PreprocessKnobs {
  if (!partial) return { ...NEUTRAL_KNOBS };
  return { ...NEUTRAL_KNOBS, ...partial };
}

/**
 * Auto-pick a Clean BG cutoff for an image using Otsu's between-class
 * variance maximization on the page-level grayscale histogram, with a
 * small upward margin so we don't eat the brightest stroke edges.
 */
export async function pickCleanBgCutoff(sourceBlob: Blob): Promise<number> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const MAX_DIM = 512;
        const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(0);
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        const hist = new Uint32Array(256);
        const n = w * h;
        for (let i = 0; i < n; i++) {
          const r = data[i * 4];
          const g = data[i * 4 + 1];
          const b = data[i * 4 + 2];
          const v = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
          hist[v]++;
        }
        let sumAll = 0;
        for (let i = 0; i < 256; i++) sumAll += i * hist[i];
        let wB = 0;
        let sumB = 0;
        let maxVar = -1;
        let bestT = 127;
        for (let t = 0; t < 256; t++) {
          wB += hist[t];
          if (wB === 0) continue;
          const wF = n - wB;
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
        resolve(Math.max(0, Math.min(255, bestT + 20)));
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => resolve(0);
    img.src = URL.createObjectURL(sourceBlob);
  });
}

/**
 * Factory default. Grayscale + max-slider contrast is the rescue combo
 * that fixes the most common low-contrast woodblock case.
 */
export const INITIAL_DEFAULT_KNOBS: PreprocessKnobs = {
  ...NEUTRAL_KNOBS,
  grayscale: true,
  contrast: 200,
  perCharThreshold: true,
  perCharCenter: true,
  perCharMorphClose: true,
};

/** True iff every knob is at its no-op value. */
export function isNeutral(k: PreprocessKnobs): boolean {
  return (
    !k.invert &&
    !k.grayscale &&
    k.contrast === 100 &&
    k.brightness === 100 &&
    !k.denoise &&
    k.cleanBg === 0 &&
    !k.adaptive &&
    !k.sharpen &&
    !k.morphClose &&
    !k.morphOpen &&
    !k.clahe &&
    !k.perCharThreshold &&
    !k.perCharCenter &&
    !k.perCharMorphClose
  );
}

/** Are two knob sets effectively identical? */
export function knobsEqual(a: PreprocessKnobs, b: PreprocessKnobs): boolean {
  return (
    a.invert === b.invert &&
    a.grayscale === b.grayscale &&
    a.contrast === b.contrast &&
    a.brightness === b.brightness &&
    a.denoise === b.denoise &&
    a.cleanBg === b.cleanBg &&
    a.adaptive === b.adaptive &&
    a.blockSize === b.blockSize &&
    a.adaptiveC === b.adaptiveC &&
    a.sharpen === b.sharpen &&
    a.morphClose === b.morphClose &&
    a.morphOpen === b.morphOpen &&
    a.morphKernel === b.morphKernel &&
    a.clahe === b.clahe &&
    a.claheTileSize === b.claheTileSize &&
    a.claheClipLimit === b.claheClipLimit &&
    a.perCharThreshold === b.perCharThreshold &&
    a.perCharCenter === b.perCharCenter &&
    a.perCharMorphClose === b.perCharMorphClose
  );
}

function growDark(
  data: Uint8ClampedArray,
  sw: number,
  sh: number,
  half: number
) {
  const copy = new Uint8ClampedArray(data);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      let m = 255;
      const y1 = Math.max(0, y - half);
      const y2 = Math.min(sh - 1, y + half);
      const x1 = Math.max(0, x - half);
      const x2 = Math.min(sw - 1, x + half);
      for (let ny = y1; ny <= y2; ny++) {
        for (let nx = x1; nx <= x2; nx++) {
          const v = copy[(ny * sw + nx) * 4];
          if (v < m) m = v;
        }
      }
      const idx = (y * sw + x) * 4;
      data[idx] = m;
      data[idx + 1] = m;
      data[idx + 2] = m;
    }
  }
}

function shrinkDark(
  data: Uint8ClampedArray,
  sw: number,
  sh: number,
  half: number
) {
  const copy = new Uint8ClampedArray(data);
  for (let y = 0; y < sh; y++) {
    for (let x = 0; x < sw; x++) {
      let m = 0;
      const y1 = Math.max(0, y - half);
      const y2 = Math.min(sh - 1, y + half);
      const x1 = Math.max(0, x - half);
      const x2 = Math.min(sw - 1, x + half);
      for (let ny = y1; ny <= y2; ny++) {
        for (let nx = x1; nx <= x2; nx++) {
          const v = copy[(ny * sw + nx) * 4];
          if (v > m) m = v;
        }
      }
      const idx = (y * sw + x) * 4;
      data[idx] = m;
      data[idx + 1] = m;
      data[idx + 2] = m;
    }
  }
}

function applyClahe(
  data: Uint8ClampedArray,
  sw: number,
  sh: number,
  tileSize: number,
  clipLimitPct: number
) {
  const gray = new Uint8Array(sw * sh);
  for (let i = 0; i < sw * sh; i++) {
    gray[i] = Math.round(
      data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114
    );
  }

  const tilesX = Math.max(1, Math.ceil(sw / tileSize));
  const tilesY = Math.max(1, Math.ceil(sh / tileSize));
  const cdfs: Uint8Array[] = [];

  for (let ty = 0; ty < tilesY; ty++) {
    for (let tx = 0; tx < tilesX; tx++) {
      const x0 = tx * tileSize;
      const y0 = ty * tileSize;
      const x1 = Math.min(sw, x0 + tileSize);
      const y1 = Math.min(sh, y0 + tileSize);
      const tilePixels = (x1 - x0) * (y1 - y0);

      const hist = new Uint32Array(256);
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          hist[gray[y * sw + x]]++;
        }
      }

      const clipLimit = Math.max(
        1,
        Math.floor((clipLimitPct / 10) * (tilePixels / 256))
      );
      let excess = 0;
      for (let i = 0; i < 256; i++) {
        if (hist[i] > clipLimit) {
          excess += hist[i] - clipLimit;
          hist[i] = clipLimit;
        }
      }
      const baseRedistribution = Math.floor(excess / 256);
      let remainder = excess - baseRedistribution * 256;
      for (let i = 0; i < 256; i++) hist[i] += baseRedistribution;
      let r = 0;
      while (remainder > 0 && r < 256 * 4) {
        hist[r % 256]++;
        remainder--;
        r++;
      }

      let cum = 0;
      const cdf = new Uint8Array(256);
      for (let i = 0; i < 256; i++) {
        cum += hist[i];
        cdf[i] = Math.min(255, Math.round((cum / tilePixels) * 255));
      }
      cdfs.push(cdf);
    }
  }

  for (let y = 0; y < sh; y++) {
    const py = (y + 0.5) / tileSize - 0.5;
    let ty0 = Math.floor(py);
    let ty1 = ty0 + 1;
    if (ty0 < 0) ty0 = 0;
    if (ty1 >= tilesY) ty1 = tilesY - 1;
    if (ty0 >= tilesY) ty0 = tilesY - 1;
    const fy = Math.max(0, Math.min(1, py - Math.floor(py)));
    for (let x = 0; x < sw; x++) {
      const px = (x + 0.5) / tileSize - 0.5;
      let tx0 = Math.floor(px);
      let tx1 = tx0 + 1;
      if (tx0 < 0) tx0 = 0;
      if (tx1 >= tilesX) tx1 = tilesX - 1;
      if (tx0 >= tilesX) tx0 = tilesX - 1;
      const fx = Math.max(0, Math.min(1, px - Math.floor(px)));
      const g = gray[y * sw + x];
      const v00 = cdfs[ty0 * tilesX + tx0][g];
      const v01 = cdfs[ty0 * tilesX + tx1][g];
      const v10 = cdfs[ty1 * tilesX + tx0][g];
      const v11 = cdfs[ty1 * tilesX + tx1][g];
      const v = Math.round(
        (1 - fy) * ((1 - fx) * v00 + fx * v01) +
          fy * ((1 - fx) * v10 + fx * v11)
      );
      const idx = (y * sw + x) * 4;
      data[idx] = v;
      data[idx + 1] = v;
      data[idx + 2] = v;
    }
  }
}

export async function preprocessImage(
  sourceBlob: Blob,
  k: PreprocessKnobs
): Promise<Blob> {
  const hasFilters =
    k.invert || k.grayscale || k.contrast !== 100 || k.brightness !== 100;
  const hasPixelOps =
    k.denoise ||
    k.cleanBg > 0 ||
    k.adaptive ||
    k.sharpen ||
    k.morphClose ||
    k.morphOpen ||
    k.clahe;
  if (!hasFilters && !hasPixelOps) return sourceBlob;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const sw = img.naturalWidth;
      const sh = img.naturalHeight;
      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas not supported"));

      if (hasFilters) {
        const f: string[] = [];
        if (k.contrast !== 100) f.push(`contrast(${k.contrast}%)`);
        if (k.brightness !== 100) f.push(`brightness(${k.brightness}%)`);
        if (k.grayscale) f.push("grayscale(100%)");
        if (k.invert) f.push("invert(100%)");
        ctx.filter = f.join(" ");
      }

      ctx.drawImage(img, 0, 0, sw, sh, 0, 0, sw, sh);
      ctx.filter = "none";

      if (hasPixelOps) {
        const imageData = ctx.getImageData(0, 0, sw, sh);
        const data = imageData.data;

        if (k.denoise) {
          const copy = new Uint8ClampedArray(data);
          for (let y = 1; y < sh - 1; y++) {
            for (let x = 1; x < sw - 1; x++) {
              for (let c = 0; c < 3; c++) {
                const vals: number[] = [];
                for (let dy = -1; dy <= 1; dy++) {
                  for (let dx = -1; dx <= 1; dx++) {
                    vals.push(copy[((y + dy) * sw + (x + dx)) * 4 + c]);
                  }
                }
                vals.sort((a, b) => a - b);
                data[(y * sw + x) * 4 + c] = vals[4];
              }
            }
          }
        }

        if (k.clahe) {
          applyClahe(data, sw, sh, k.claheTileSize, k.claheClipLimit);
        }

        if (k.cleanBg > 0) {
          const cutoff = k.cleanBg;
          for (let i = 0; i < data.length; i += 4) {
            const gray =
              data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            if (gray >= cutoff) {
              data[i] = 255;
              data[i + 1] = 255;
              data[i + 2] = 255;
            }
          }
        }

        if (k.sharpen) {
          const copy = new Uint8ClampedArray(data);
          for (let y = 1; y < sh - 1; y++) {
            for (let x = 1; x < sw - 1; x++) {
              for (let c = 0; c < 3; c++) {
                const idx = (y * sw + x) * 4 + c;
                const val =
                  5 * copy[idx] -
                  copy[((y - 1) * sw + x) * 4 + c] -
                  copy[((y + 1) * sw + x) * 4 + c] -
                  copy[(y * sw + x - 1) * 4 + c] -
                  copy[(y * sw + x + 1) * 4 + c];
                data[idx] = Math.max(0, Math.min(255, val));
              }
            }
          }
        }

        const morphHalf = Math.max(
          1,
          Math.floor((Math.min(7, Math.max(3, k.morphKernel)) - 1) / 2)
        );

        if (k.adaptive) {
          const gray = new Float64Array(sw * sh);
          for (let i = 0; i < sw * sh; i++) {
            gray[i] =
              data[i * 4] * 0.299 +
              data[i * 4 + 1] * 0.587 +
              data[i * 4 + 2] * 0.114;
          }
          const integral = new Float64Array(sw * sh);
          for (let y = 0; y < sh; y++) {
            let rowSum = 0;
            for (let x = 0; x < sw; x++) {
              rowSum += gray[y * sw + x];
              integral[y * sw + x] = rowSum + (y > 0 ? integral[(y - 1) * sw + x] : 0);
            }
          }
          const half = Math.floor(k.blockSize / 2);
          const adaptC = k.adaptiveC;
          for (let y = 0; y < sh; y++) {
            for (let x = 0; x < sw; x++) {
              const y1 = Math.max(0, y - half - 1);
              const y2 = Math.min(sh - 1, y + half);
              const x1 = Math.max(0, x - half - 1);
              const x2 = Math.min(sw - 1, x + half);
              const area = (y2 - y1) * (x2 - x1);
              let sum = integral[y2 * sw + x2];
              if (y1 > 0) sum -= integral[(y1 - 1) * sw + x2];
              if (x1 > 0) sum -= integral[y2 * sw + (x1 - 1)];
              if (y1 > 0 && x1 > 0) sum += integral[(y1 - 1) * sw + (x1 - 1)];
              const localMean = sum / area;
              const val = gray[y * sw + x] < localMean - adaptC ? 0 : 255;
              const idx = (y * sw + x) * 4;
              data[idx] = val;
              data[idx + 1] = val;
              data[idx + 2] = val;
            }
          }
        }

        if (k.morphOpen) {
          shrinkDark(data, sw, sh, morphHalf);
          growDark(data, sw, sh, morphHalf);
        }
        if (k.morphClose) {
          growDark(data, sw, sh, morphHalf);
          shrinkDark(data, sw, sh, morphHalf);
        }

        ctx.putImageData(imageData, 0, 0);
      }

      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
        "image/jpeg",
        0.95
      );
    };
    img.onerror = () => reject(new Error("Failed to load image for preprocessing"));
    img.src = URL.createObjectURL(sourceBlob);
  });
}
