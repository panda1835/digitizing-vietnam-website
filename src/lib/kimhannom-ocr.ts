import { SpatialCharacter } from "./ocr-store";
import { callKandianguji } from "./kandianguji-ocr";

const BASE_URL = "https://kimhannom.fit.hcmus.edu.vn/api/web/clc-sinonom";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36";

export interface KimHanNomOptions {
  token: string;
  ocrId?: number; // 1=vertical, 2=administrative, 3=outdoor, 4=horizontal
  langType?: number; // 0=unknown, 1=Hán, 2=Nôm
  epitaph?: number; // 0=normal, 1=stone inscription
}

export interface KimHanNomResult {
  spatialData: SpatialCharacter[];
  rawText: string;
  pageWidth: number;
  pageHeight: number;
}

interface KimHanNomRawOcr {
  result_ocr_text: string[];
  result_bbox: Array<[number[][], [string, number]]>;
  result_file_name: string;
}

/**
 * Upload an image to Kim Hán Nôm server and return raw OCR data.
 */
async function uploadAndOcr(
  imageBase64: string,
  options: KimHanNomOptions
): Promise<KimHanNomRawOcr> {
  const { token, ocrId = 1, langType = 2, epitaph = 0 } = options;

  const headers = {
    "User-Agent": USER_AGENT,
    Authorization: `Bearer ${token}`,
  };

  // Step 1: Upload image
  const imageBuffer = Buffer.from(imageBase64, "base64");
  const blob = new Blob([imageBuffer], { type: "image/jpeg" });
  const formData = new FormData();
  formData.append("image_file", blob, "image.jpg");

  const uploadRes = await fetch(`${BASE_URL}/image-upload`, {
    method: "POST",
    headers: { ...headers },
    body: formData,
  });

  if (!uploadRes.ok) {
    throw new Error(`Kim Hán Nôm upload failed: HTTP ${uploadRes.status}`);
  }

  const uploadData = await uploadRes.json();
  if (!uploadData.is_success || !uploadData.data?.file_name) {
    throw new Error(
      `Kim Hán Nôm upload failed: ${uploadData.message?.web_text || uploadData.code}`
    );
  }

  const fileName = uploadData.data.file_name.trim();

  // Step 2: Run OCR
  const ocrRes = await fetch(`${BASE_URL}/image-ocr`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      ocr_id: ocrId,
      lang_type: langType,
      epitaph,
      tag: null,
      file_name: fileName,
    }),
  });

  if (!ocrRes.ok) {
    throw new Error(`Kim Hán Nôm OCR failed: HTTP ${ocrRes.status}`);
  }

  const ocrData = await ocrRes.json();
  if (!ocrData.is_success) {
    throw new Error(
      `Kim Hán Nôm OCR failed: ${ocrData.message?.web_text || ocrData.code}`
    );
  }

  return ocrData.data;
}

/**
 * Run Kim Hán Nôm OCR standalone (line-level bboxes, estimated char positions).
 */
export async function callKimHanNom(
  imageBase64: string,
  options: KimHanNomOptions
): Promise<KimHanNomResult> {
  const raw = await uploadAndOcr(imageBase64, options);
  return convertToSpatialData(raw);
}

/**
 * Hybrid mode: run Kandianguji for precise per-character bounding boxes,
 * then Kim Hán Nôm for Nôm-specialized text recognition.
 * Uses Kandianguji's spatial layout with Kim Hán Nôm's character readings.
 */
export async function callHybridOcr(
  imageBase64: string,
  options: KimHanNomOptions & { detMode?: string; detLayout?: boolean }
): Promise<KimHanNomResult> {
  const { detMode = "auto", detLayout = true, ...kimOptions } = options;

  // Run both OCR engines in parallel
  const [kandiResult, kimRaw] = await Promise.all([
    callKandianguji(imageBase64, { detMode, detLayout, skipUsageTracking: true }),
    uploadAndOcr(imageBase64, kimOptions),
  ]);

  // Get Kandianguji chars with bboxes
  const kandiChars = kandiResult.spatialData.filter((c) => c.bbox);
  if (kandiChars.length === 0) {
    // Fallback: if Kandianguji found nothing, use Kim Hán Nôm standalone
    return convertToSpatialData(kimRaw);
  }

  // Determine Kim Hán Nôm's pixel space from its bbox extents
  // (both APIs received the same image, but may report different page dimensions)
  let kimMaxX = 1;
  let kimMaxY = 1;
  for (const [coords] of kimRaw.result_bbox) {
    for (const [x, y] of coords) {
      if (x > kimMaxX) kimMaxX = x;
      if (y > kimMaxY) kimMaxY = y;
    }
  }
  // Use Kandianguji's page dims if available, otherwise estimate from Kim's bbox extents
  const normW = kandiResult.pageWidth > 1 ? kandiResult.pageWidth : kimMaxX * 1.05;
  const normH = kandiResult.pageHeight > 1 ? kandiResult.pageHeight : kimMaxY * 1.05;

  // Build Kim Hán Nôm line entries with normalized [0,1] bboxes
  const kimLines: Array<{
    chars: string[];
    confidence: number;
    minX: number; maxX: number; minY: number; maxY: number;
  }> = [];

  for (const [coords, [text, confidence]] of kimRaw.result_bbox) {
    const xs = coords.map((c) => c[0]);
    const ys = coords.map((c) => c[1]);
    kimLines.push({
      chars: [...text],
      confidence,
      minX: Math.min(...xs) / normW,
      maxX: Math.max(...xs) / normW,
      minY: Math.min(...ys) / normH,
      maxY: Math.max(...ys) / normH,
    });
  }

  // ── Line-level matching ──
  // 1. Group Kandianguji chars into vertical lines by X-proximity
  const kandiWithBbox = kandiResult.spatialData.filter((c) => c.bbox);
  const avgCharW = kandiWithBbox.length > 0
    ? kandiWithBbox.reduce((s, c) => s + Math.abs(c.bbox![2].x - c.bbox![0].x), 0) / kandiWithBbox.length
    : 0.02;

  const xSorted = [...kandiWithBbox].sort(
    (a, b) => ((a.bbox![0].x + a.bbox![2].x) / 2) - ((b.bbox![0].x + b.bbox![2].x) / 2)
  );
  const kandiLines: SpatialCharacter[][] = [];
  for (const char of xSorted) {
    const cx = (char.bbox![0].x + char.bbox![2].x) / 2;
    let added = false;
    for (const line of kandiLines) {
      const lineCx = line.reduce((s, c) => s + (c.bbox![0].x + c.bbox![2].x) / 2, 0) / line.length;
      if (Math.abs(cx - lineCx) < avgCharW * 0.7) {
        line.push(char);
        added = true;
        break;
      }
    }
    if (!added) kandiLines.push([char]);
  }
  // Sort chars within each line by Y (top to bottom)
  for (const line of kandiLines) {
    line.sort((a, b) => ((a.bbox![0].y + a.bbox![2].y) / 2) - ((b.bbox![0].y + b.bbox![2].y) / 2));
  }

  // 2. Match each Kandianguji line to the best Kim Hán Nôm line
  const kimUsed = new Set<number>();
  const charTextMap = new Map<number, { text: string; confidence: number }>(); // offset → replacement

  for (const kLine of kandiLines) {
    if (kLine.length === 0) continue;
    // Compute Kandianguji line bbox
    const kMinX = Math.min(...kLine.map((c) => c.bbox![0].x));
    const kMaxX = Math.max(...kLine.map((c) => c.bbox![2].x));
    const kMinY = Math.min(...kLine.map((c) => c.bbox![0].y));
    const kMaxY = Math.max(...kLine.map((c) => c.bbox![2].y));
    const kCx = (kMinX + kMaxX) / 2;
    const kCy = (kMinY + kMaxY) / 2;

    // Find best matching unused Kim line
    let bestKim = -1;
    let bestDist = Infinity;
    for (let li = 0; li < kimLines.length; li++) {
      if (kimUsed.has(li)) continue;
      const kim = kimLines[li];
      // X must overlap
      const pad = avgCharW * 0.5;
      if (kCx < kim.minX - pad || kCx > kim.maxX + pad) continue;
      // Y must overlap
      const yOverlap = Math.max(0, Math.min(kMaxY, kim.maxY) - Math.max(kMinY, kim.minY));
      const kSpan = kMaxY - kMinY;
      if (yOverlap < kSpan * 0.2 && kSpan > 0) continue;

      const dist = Math.abs(kCx - (kim.minX + kim.maxX) / 2) + Math.abs(kCy - (kim.minY + kim.maxY) / 2) * 0.5;
      if (dist < bestDist) {
        bestDist = dist;
        bestKim = li;
      }
    }

    if (bestKim < 0) continue;
    kimUsed.add(bestKim);

    const kim = kimLines[bestKim];
    // 3. Redistribute Kim chars across Kandianguji bboxes
    const kimChars = kim.chars;
    const n = Math.min(kLine.length, kimChars.length);
    for (let i = 0; i < n; i++) {
      charTextMap.set(kLine[i].offset, { text: kimChars[i], confidence: kim.confidence });
    }
    // If Kim has more chars, append extras to the last bbox
    if (kimChars.length > kLine.length && kLine.length > 0) {
      const lastOffset = kLine[kLine.length - 1].offset;
      const existing = charTextMap.get(lastOffset);
      if (existing) {
        existing.text += kimChars.slice(kLine.length).join("");
      }
    }
    // If Kandianguji has more bboxes, mark extras to be removed
    for (let i = kimChars.length; i < kLine.length; i++) {
      charTextMap.set(kLine[i].offset, { text: "", confidence: kim.confidence });
    }
  }

  // 4. Build final spatial data with Kim text replacements
  const hybridChars: SpatialCharacter[] = [];
  let offset = 0;

  for (const kChar of kandiResult.spatialData) {
    const replacement = kChar.bbox ? charTextMap.get(kChar.offset) : undefined;

    if (replacement !== undefined) {
      if (replacement.text === "") continue; // Skip chars removed due to count mismatch
      hybridChars.push({
        text: replacement.text,
        bbox: kChar.bbox,
        confidence: replacement.confidence,
        offset,
      });
      offset += replacement.text.length;
    } else {
      hybridChars.push({ ...kChar, offset });
      offset += kChar.text.length;
    }
  }

  const rawText = hybridChars.map((c) => c.text).join("");

  return {
    spatialData: hybridChars,
    rawText,
    pageWidth: kandiResult.pageWidth,
    pageHeight: kandiResult.pageHeight,
  };
}

// ── Standalone conversion (for non-hybrid Kim Hán Nôm mode) ──

function convertToSpatialData(data: KimHanNomRawOcr): KimHanNomResult {
  const { result_ocr_text, result_bbox } = data;

  const bboxMap = new Map<string, { coords: number[][]; confidence: number }>();
  for (const entry of result_bbox) {
    const [coords, [text, confidence]] = entry;
    bboxMap.set(text, { coords, confidence });
  }

  let maxX = 1;
  let maxY = 1;
  for (const entry of result_bbox) {
    const [coords] = entry;
    for (const [x, y] of coords) {
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  const pageWidth = Math.ceil(maxX * 1.05);
  const pageHeight = Math.ceil(maxY * 1.05);

  const spatialData: SpatialCharacter[] = [];
  let offset = 0;

  for (const lineText of result_ocr_text) {
    const bbox = bboxMap.get(lineText);
    const chars = [...lineText];

    if (bbox && chars.length > 0) {
      const { coords, confidence } = bbox;
      const x1 = coords[0][0];
      const y1 = coords[0][1];
      const x2 = coords[1][0];
      const y2 = coords[2][1];

      const lineW = Math.abs(x2 - x1);
      const lineH = Math.abs(y2 - y1);
      const isVertical = lineH > lineW;

      for (let i = 0; i < chars.length; i++) {
        let charBbox: Array<{ x: number; y: number }>;

        if (isVertical) {
          const charH = lineH / chars.length;
          const cy1 = y1 + i * charH;
          const cy2 = y1 + (i + 1) * charH;
          charBbox = [
            { x: x1 / pageWidth, y: cy1 / pageHeight },
            { x: x2 / pageWidth, y: cy1 / pageHeight },
            { x: x2 / pageWidth, y: cy2 / pageHeight },
            { x: x1 / pageWidth, y: cy2 / pageHeight },
          ];
        } else {
          const charW = lineW / chars.length;
          const cx1 = x1 + i * charW;
          const cx2 = x1 + (i + 1) * charW;
          charBbox = [
            { x: cx1 / pageWidth, y: y1 / pageHeight },
            { x: cx2 / pageWidth, y: y1 / pageHeight },
            { x: cx2 / pageWidth, y: y2 / pageHeight },
            { x: cx1 / pageWidth, y: y2 / pageHeight },
          ];
        }

        spatialData.push({
          text: chars[i],
          bbox: charBbox,
          confidence,
          offset,
        });
        offset += chars[i].length;
      }
    } else {
      for (const char of chars) {
        spatialData.push({
          text: char,
          bbox: null,
          confidence: 0.5,
          offset,
        });
        offset += char.length;
      }
    }

    spatialData.push({
      text: "\n",
      bbox: null,
      confidence: 1,
      offset,
    });
    offset += 1;
  }

  const rawText = spatialData.map((c) => c.text).join("");
  return { spatialData, rawText, pageWidth, pageHeight };
}
