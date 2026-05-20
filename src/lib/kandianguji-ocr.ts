import { SpatialCharacter } from "./ocr-store";
import { isAllowedSpatialChar } from "./punctuation";
import { buildRawText } from "./reading-order";

interface KandiangujiWord {
  text: string;
  choices?: string;
  confidence: number;
  position?: [number, number, number, number];
  det_confidence?: number;
  classes?: number;
}

interface KandiangujiTextLine {
  position?: [number, number][];
  text: string;
  layout_classes_id?: number;
  words?: KandiangujiWord[];
}

interface KandiangujiData {
  width: number;
  height: number;
  text_angel: number;
  text_angel_confidence: number;
  texts?: KandiangujiTextLine[];
  text_lines?: KandiangujiTextLine[];
  layout?: Array<{ position: number[]; classes: number }>;
}

interface KandiangujiResponse {
  message: string;
  id: string;
  info: string;
  data?: KandiangujiData;
}

export interface KandiangujiResult {
  spatialData: SpatialCharacter[];
  candidateData: SpatialCharacter[];
  rawText: string;
  pageWidth: number;
  pageHeight: number;
}

/**
 * Call the Kandianguji OCR API with a base64-encoded image and return
 * SpatialCharacter[] in the same format the rest of the app expects.
 */
export async function callKandianguji(
  imageBase64: string,
  options?: { detMode?: string; detLayout?: boolean }
): Promise<KandiangujiResult> {
  const token = process.env.KANDIANGUJI_TOKEN;
  const email = process.env.KANDIANGUJI_EMAIL;

  if (!token || !email) {
    throw new Error(
      "KANDIANGUJI_TOKEN and KANDIANGUJI_EMAIL not set. Add them to your .env.local file."
    );
  }

  const detMode = options?.detMode ?? "auto";
  // Default OFF. Kandianguji's layout output is unused by DVN (we run our
  // own detectColumns), and measurement showed det_layout:true actually
  // returns a *smaller* glyph set (it filters by detected layout) while
  // costing the layout stage — det_layout:false returned the complete
  // page (e.g. 143 vs 93 glyphs on a test page). Opt back in explicitly
  // if a caller ever needs Kandianguji's own layout.
  const detLayout = options?.detLayout ?? false;

  const ocrRes = await fetch("https://ocr.kandianguji.com/ocr_api", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      email,
      image: imageBase64,
      det_mode: detMode,
      return_position: true,
      return_choices: true,
      version: "v2",
      det_layout: detLayout,
      return_layout: detLayout,
    }),
  });

  if (!ocrRes.ok) {
    const text = await ocrRes.text();
    throw new Error(`Kandianguji OCR error ${ocrRes.status}: ${text}`);
  }

  const ocrData: KandiangujiResponse = await ocrRes.json();

  if (ocrData.message !== "success" || !ocrData.data) {
    throw new Error(
      `Kandianguji OCR error: ${ocrData.info || "Unknown error"}`
    );
  }

  return kandiangujiToSpatialData(ocrData.data);
}

function kandiangujiToSpatialData(data: KandiangujiData): KandiangujiResult {
  const { width: pageWidth, height: pageHeight } = data;
  const texts = data.text_lines ?? data.texts ?? [];
  const w = pageWidth || 1;
  const h = pageHeight || 1;

  const spatialData: SpatialCharacter[] = [];
  const candidateData: SpatialCharacter[] = [];
  let offset = 0;

  for (const line of texts) {
    if (line.words && line.words.length > 0) {
      for (const word of line.words) {
        const text = word.text;
        if (!text) continue;
        // Strict CJK / PUA whitelist: punctuation, Latin, digits, and any
        // multi-char paste artifacts get dropped. Punct bboxes also warp
        // downstream column auto-detection thresholds.
        if (!isAllowedSpatialChar(text)) continue;

        let bbox: Array<{ x: number; y: number }> | null = null;
        if (word.position) {
          const [x1, y1, x2, y2] = word.position;
          bbox = [
            { x: x1 / w, y: y1 / h },
            { x: x2 / w, y: y1 / h },
            { x: x2 / w, y: y2 / h },
            { x: x1 / w, y: y2 / h },
          ];
        }

        const choices = word.choices
          ? Array.from(word.choices).slice(1)
          : undefined;

        const layoutClass = word.classes ?? line.layout_classes_id;

        const char: SpatialCharacter & { choices?: string[]; layoutClass?: number } = {
          text,
          originalText: text,
          bbox,
          confidence: word.confidence ?? 0.9,
          offset,
          ...(choices && choices.length > 0 ? { choices } : {}),
          ...(layoutClass !== undefined ? { layoutClass } : {}),
        };

        spatialData.push(char);
        offset += text.length;
      }
    } else if (typeof line.text === "string" && line.text.length > 0) {
      for (const char of line.text) {
        if (!isAllowedSpatialChar(char)) continue;
        spatialData.push({
          text: char,
          originalText: char,
          bbox: null,
          confidence: 0.8,
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

  const rawText = buildRawText(spatialData);

  return { spatialData, candidateData, rawText, pageWidth, pageHeight };
}
