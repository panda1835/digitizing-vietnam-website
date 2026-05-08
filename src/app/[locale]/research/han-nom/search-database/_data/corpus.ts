import fs from "fs/promises";
import path from "path";
import { parseStringPromise } from "xml2js";
import pool from "@/lib/db";
import { hanVariants } from "@/lib/han-variants";
import {
  titles,
  flattenItems,
  titleToTopicId,
  topicIdToImage,
  isDvskttSlug,
  topicIdToTitle,
  resolveTopicTitle,
  topicIdToBookAndTopic,
  topicIdToSlug,
} from "./dvsktt-utils";

type QueryRow = Record<string, any>;

async function queryRows<T extends QueryRow = QueryRow>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  const [rows] = await pool.query(query, params);
  return (rows as T[]) || [];
}

export interface CorpusLine {
  n: string;
  text: string;
}

export interface CorpusPage {
  n: string;
  image?: string;
  imagePath?: string;
  hanNom: CorpusLine[];
  transliteration: CorpusLine[];
  notes: { id: string; target: string; content: string }[];
}

export type CorpusLanguage = "Hán" | "Nôm" | "Hán-Nôm" | "Quốc ngữ";
export type CorpusGenre =
  | "Poetry"
  | "History"
  | "Fiction"
  | "Philosophy"
  | "Religion"
  | "Legal"
  | "Other";
export type AttributionRole =
  | "Author"
  | "Compiler"
  | "Translator"
  | "Editor"
  | "Commentator"
  | "Scribe"
  | "Printer"
  | "Other";
/** curated = reviewed and approved by DVN staff; wiki = user-submitted or unverified OCR/upload */
export type CorpusCurationStatus = "curated" | "wiki";

export interface Attribution {
  name: string;
  role: AttributionRole;
  note?: string;
}

export interface CorpusWork {
  slug: string;
  title: string;
  date?: string;
  year?: number;
  filePath?: string;
  externalPath?: string;
  collectionId?: string;
  documentId?: string;
  pages: number;
  type: "xml" | "db";
  genre?: CorpusGenre;
  language?: CorpusLanguage;
  attributions?: Attribution[];
  curationStatus?: CorpusCurationStatus;
  ocrStatus?: "partial" | "complete" | "corrected";
}

const CORPUS_REGISTRY: CorpusWork[] = [
  {
    slug: "truyen-kieu-1866",
    title: "Truyện Kiều (1866)",
    date: "1866",
    year: 1866,
    filePath: "data/truyen-kieu/Kieu1866.xml",
    pages: 140,
    type: "xml",
    genre: "Poetry",
    language: "Nôm",
    attributions: [{ name: "Nguyễn Du", role: "Author" }],
    curationStatus: "curated",
    collectionId: "truyen-kieu",
    documentId: "truyen-kieu-1866",
    externalPath: "/our-collections/truyen-kieu/truyen-kieu-1866",
  },
  {
    slug: "truyen-kieu-1870",
    title: "Truyện Kiều (1870)",
    date: "1870",
    year: 1870,
    filePath: "data/truyen-kieu/Kieu1870.xml",
    pages: 130,
    type: "xml",
    genre: "Poetry",
    language: "Nôm",
    attributions: [{ name: "Nguyễn Du", role: "Author" }],
    curationStatus: "curated",
    collectionId: "truyen-kieu",
    documentId: "truyen-kieu-1870",
    externalPath: "/our-collections/truyen-kieu/truyen-kieu-1870",
  },
  {
    slug: "truyen-kieu-1871",
    title: "Truyện Kiều (1871)",
    date: "1871",
    year: 1871,
    filePath: "data/truyen-kieu/Kieu1871.xml",
    pages: 120,
    type: "xml",
    genre: "Poetry",
    language: "Nôm",
    attributions: [{ name: "Nguyễn Du", role: "Author" }],
    curationStatus: "curated",
    collectionId: "truyen-kieu",
    documentId: "truyen-kieu-1871",
    externalPath: "/our-collections/truyen-kieu/truyen-kieu-1871",
  },
  {
    slug: "truyen-kieu-1872",
    title: "Truyện Kiều (1872)",
    date: "1872",
    year: 1872,
    filePath: "data/truyen-kieu/Kieu1872.xml",
    pages: 130,
    type: "xml",
    genre: "Poetry",
    language: "Nôm",
    attributions: [{ name: "Nguyễn Du", role: "Author" }],
    curationStatus: "curated",
    collectionId: "truyen-kieu",
    documentId: "truyen-kieu-1872",
    externalPath: "/our-collections/truyen-kieu/truyen-kieu-1872",
  },
  {
    slug: "truyen-kieu-1902",
    title: "Truyện Kiều (1902)",
    date: "1902",
    year: 1902,
    filePath: "data/truyen-kieu/Kieu1902.xml",
    pages: 110,
    type: "xml",
    genre: "Poetry",
    language: "Nôm",
    attributions: [{ name: "Nguyễn Du", role: "Author" }],
    curationStatus: "curated",
    collectionId: "truyen-kieu",
    documentId: "truyen-kieu-1902",
    externalPath: "/our-collections/truyen-kieu/truyen-kieu-1902",
  },
  {
    slug: "quyen-thu",
    title: "Đại Việt sử ký toàn thư: Quyển Thủ (大越史記全書 - 卷首)",
    date: "1697",
    year: 1697,
    pages: 107,
    type: "db",
    genre: "History",
    language: "Hán",
    attributions: [{ name: "Ngô Sĩ Liên", role: "Compiler" }],
    curationStatus: "curated",
    collectionId: "dai-viet-su-ky-toan-thu",
    documentId: "quyen-thu",
    externalPath: "/our-collections/dai-viet-su-ky-toan-thu/quyen-thu",
  },
  {
    slug: "ngoai-ky",
    title: "Đại Việt sử ký toàn thư: Ngoại kỷ (大越史記全書 - 外紀)",
    date: "1697",
    year: 1697,
    pages: 171,
    type: "db",
    genre: "History",
    language: "Hán",
    attributions: [{ name: "Ngô Sĩ Liên", role: "Compiler" }],
    curationStatus: "curated",
    collectionId: "dai-viet-su-ky-toan-thu",
    documentId: "ngoai-ky",
    externalPath: "/our-collections/dai-viet-su-ky-toan-thu/ngoai-ky",
  },
  {
    slug: "ban-ky-toan-thu",
    title: "Đại Việt sử ký toàn thư: Bản kỷ Toàn thư (大越史記全書 - 本紀全書)",
    date: "1697",
    year: 1697,
    pages: 500,
    type: "db",
    genre: "History",
    language: "Hán",
    attributions: [{ name: "Ngô Sĩ Liên", role: "Compiler" }],
    curationStatus: "curated",
    collectionId: "dai-viet-su-ky-toan-thu",
    documentId: "ban-ky-toan-thu",
    externalPath: "/our-collections/dai-viet-su-ky-toan-thu/ban-ky-toan-thu",
  },
  {
    slug: "ban-ky-thuc-luc",
    title: "Đại Việt sử ký toàn thư: Bản kỷ Thực lục (大越史記全書 - 本紀實錄)",
    date: "1697",
    year: 1697,
    pages: 500,
    type: "db",
    genre: "History",
    language: "Hán",
    attributions: [{ name: "Ngô Sĩ Liên", role: "Compiler" }],
    curationStatus: "curated",
    collectionId: "dai-viet-su-ky-toan-thu",
    documentId: "ban-ky-thuc-luc",
    externalPath: "/our-collections/dai-viet-su-ky-toan-thu/ban-ky-thuc-luc",
  },
  {
    slug: "ban-ky-tuc-bien",
    title: "Đại Việt sử ký toàn thư: Bản kỷ Tục biên (大越史記全書 - 本紀續編)",
    date: "1675",
    year: 1675,
    pages: 500,
    type: "db",
    genre: "History",
    language: "Hán",
    attributions: [{ name: "Phạm Công Trứ", role: "Compiler" }],
    curationStatus: "curated",
    collectionId: "dai-viet-su-ky-toan-thu",
    documentId: "ban-ky-tuc-bien",
    externalPath: "/our-collections/dai-viet-su-ky-toan-thu/ban-ky-tuc-bien",
  },
  {
    slug: "chinh-phu-ngam-khuc",
    title: "Chinh phụ Ngâm khúc (征婦吟曲)",
    date: "1741",
    year: 1741,
    pages: 64,
    type: "db",
    genre: "Poetry",
    language: "Hán-Nôm",
    attributions: [
      { name: "Đặng Trần Côn", role: "Author" },
      { name: "Đoàn Thị Điểm", role: "Translator" },
    ],
    curationStatus: "curated",
    collectionId: "chinh-phu-ngam-khuc",
    documentId: "chinh-phu-ngam-khuc",
    externalPath: "/our-collections/chinh-phu-ngam-khuc/chinh-phu-ngam-khuc",
  },
  {
    slug: "quoc-am-thi-tap",
    title: "Quốc âm Thi tập (國音詩集)",
    date: "1480",
    year: 1480,
    pages: 254,
    type: "db",
    genre: "Poetry",
    language: "Nôm",
    attributions: [{ name: "Nguyễn Trãi", role: "Author" }],
    curationStatus: "curated",
    collectionId: "quoc-am-thi-tap",
    documentId: "nguyen-trai-quoc-am-thi-tap",
    externalPath:
      "/our-collections/quoc-am-thi-tap/nguyen-trai-quoc-am-thi-tap",
  },
  {
    slug: "tinh-hoa-mua-xuan",
    title: "Tinh hoa Mùa xuân (Poetry of Hồ Xuân Hương)",
    date: "1800",
    year: 1800,
    pages: 50,
    type: "db",
    genre: "Poetry",
    language: "Nôm",
    attributions: [{ name: "Hồ Xuân Hương", role: "Author" }],
    curationStatus: "curated",
    collectionId: "tho-ho-xuan-huong",
    documentId: "tinh-hoa-mua-xuan",
    externalPath: "/our-collections/tho-ho-xuan-huong/tinh-hoa-mua-xuan",
  },
  {
    slug: "van-tien-co-tich-tan-truyen",
    title: "Lục Vân Tiên (Vân Tiên cổ tích tân truyện)",
    date: "1864",
    year: 1864,
    pages: 104,
    type: "db",
    genre: "Poetry",
    language: "Nôm",
    attributions: [{ name: "Nguyễn Đình Chiểu", role: "Author" }],
    curationStatus: "curated",
    collectionId: "luc-van-tien",
    documentId: "van-tien-co-tich-tan-truyen",
    externalPath: "/our-collections/luc-van-tien/van-tien-co-tich-tan-truyen",
  },
];

export async function getCorpusRegistry(): Promise<CorpusWork[]> {
  // Include completed/corrected OCR documents from the OCR index
  let ocrWorks: CorpusWork[] = [];
  try {
    const { getIndex } = await import("@/lib/ocr-store");
    const { getHanNomManifestEntryByItemId } = await import("@/lib/han-nom-collection");
    const index = await getIndex();
    for (const [slug, entry] of Object.entries(index)) {
      if (entry.status !== "partial" && entry.status !== "complete" && entry.status !== "corrected") continue;
      if (entry.pageCount <= 0) continue;
      // Skip if already in the static registry
      if (CORPUS_REGISTRY.some((w) => w.slug === slug)) continue;

      // Look up metadata from the han-nom collection
      const manifest = entry.itemId ? getHanNomManifestEntryByItemId(entry.itemId) : null;

      // Map languages to corpus language type
      const langMap: Record<string, CorpusLanguage> = {
        "Chinese": "Hán",
        "Vietnamese": "Nôm",
      };
      const langs = manifest?.languages ?? [];
      let language: CorpusLanguage | undefined;
      if (langs.length >= 2) language = "Hán-Nôm";
      else if (langs.length === 1) language = langMap[langs[0]] ?? undefined;

      // Map names to attributions
      const attributions: Attribution[] = (manifest?.names ?? []).map((name) => ({
        name,
        role: "Author" as AttributionRole,
      }));

      ocrWorks.push({
        slug,
        title: entry.title ?? manifest?.title ?? slug,
        pages: entry.pageCount,
        type: "ocr" as any,
        year: manifest?.yearStart ?? undefined,
        date: manifest?.yearStart
          ? manifest.yearEnd && manifest.yearEnd !== manifest.yearStart
            ? `${manifest.yearStart}–${manifest.yearEnd}`
            : String(manifest.yearStart)
          : undefined,
        language,
        attributions: attributions.length > 0 ? attributions : undefined,
        curationStatus: entry.status === "corrected" ? "curated" : "wiki",
        ocrStatus: entry.status as "partial" | "complete" | "corrected",
        collectionId: entry.collectionSlug || "han-nom-collection",
        documentId: entry.itemId ?? slug,
        externalPath: entry.itemId
          ? `/reading-workshop/${entry.itemId}`
          : undefined,
      });
    }
  } catch {
    // OCR index not available — continue with static registry only
  }

  const all = [...CORPUS_REGISTRY, ...ocrWorks];
  all.sort((a, b) => a.title.localeCompare(b.title, "vi"));
  return all;
}

export async function getWorkBySlug(slug: string) {
  return CORPUS_REGISTRY.find((w) => w.slug === slug);
}

export async function parseCorpusPage(
  slug: string,
  pageNumber: number,
  options?: any
): Promise<CorpusPage | null> {
  const work = await getWorkBySlug(slug);
  if (!work) return null;

  if (work.type === "db" && isDvskttSlug(slug)) {
    // Automatically inject correct book index if not provided
    if (!options?.book) {
      const bookIdx =
        slug === "quyen-thu"
          ? "0"
          : slug === "ngoai-ky"
          ? "1"
          : slug === "ban-ky-toan-thu"
          ? "2"
          : slug === "ban-ky-thuc-luc"
          ? "3"
          : slug === "ban-ky-tuc-bien"
          ? "4"
          : "1";
      options = { ...options, book: bookIdx };
    }
    return parseDvskttPage(pageNumber, options);
  }

  try {
    const fullPath = path.join(process.cwd(), work.filePath!);
    const xmlData = await fs.readFile(fullPath, "utf-8");
    const result = await parseStringPromise(xmlData);

    const pages = result.TEI.text[0].body[0].page;
    const pageData = pages[pageNumber - 1];

    if (!pageData) return null;

    const hanNomDiv = pageData.div.find((d: any) => d.$.type === "text");
    const transDiv = pageData.div.find(
      (d: any) => d.$.type === "transliteration"
    );
    const noteGroup = pageData.noteg ? pageData.noteg[0] : null;

    const hanNomLines =
      hanNomDiv?.lg[0].l.map((l: any) => ({
        n: l.$.n,
        text: typeof l === "string" ? l : l._ || "",
      })) || [];

    const transLines =
      transDiv?.lg[0].l.map((l: any) => ({
        n: l.$.n,
        text: typeof l === "string" ? l : l._ || "",
      })) || [];

    const notes =
      noteGroup?.note?.map((n: any) => ({
        id: n.$.id,
        target: n.$.target,
        content: typeof n === "string" ? n : n._ || "",
      })) || [];

    return {
      n: pageData.$.n,
      image: pageData.$.pi,
      hanNom: hanNomLines,
      transliteration: transLines,
      notes,
    };
  } catch (error) {
    console.error(`Error parsing corpus page ${slug}:${pageNumber}`, error);
    return null;
  }
}

async function parseDvskttPage(
  pageNumber: number,
  options?: any
): Promise<CorpusPage | null> {
  const book = options?.book || "1";
  const topic = options?.topic || "1";

  try {
    const flatItems = flattenItems(titles[Number(book)].children);
    const topicTitle = flatItems[Number(topic) - 1].title;
    const topicId = titleToTopicId(topicTitle);

    let data: any[] = [];
    try {
      let query = "";
      let params: any[] = [];

      if (book === "0") {
        // Try to find by topicId (Quyen column)
        const checkRows = await queryRows<any>(
          `SELECT count(*) as count FROM tbl_quyenthu WHERE Quyen = ?`,
          [topicId]
        );
        if (parseInt(checkRows?.[0]?.count || "0", 10) > 0) {
          query = `SELECT * FROM tbl_quyenthu WHERE Quyen = ? ORDER BY id`;
          params = [topicId];
        } else {
          // Desperate fallback for corrupted DB (NULL Quyen)
          // We fetch all rows and we'll "simulate" chapters by chunking if needed
          // For now, let's just fetch all so the user sees content
          query = `SELECT * FROM tbl_quyenthu ORDER BY ctid`;
          params = [];
        }
      } else {
        query = `SELECT * FROM tbl_dvsk_data WHERE (MaTrieuDai = ? OR MaTenHieu = ?) ORDER BY MaQN`;
        params = [topicId, topicId];
      }

      data = await queryRows<any>(query, params);
    } catch (dbError) {
      console.warn(
        "Database query failed, falling back to local Wikisource data",
        dbError
      );
    }

    // Fallback to local Wikisource data if DB is empty or failed
    if (data.length === 0) {
      const localDataPath = path.join(
        process.cwd(),
        "src/app/[locale]/research/han-nom/search-database/_data/dvsktt_data.json"
      );
      try {
        const localDataString = await fs.readFile(localDataPath, "utf-8");
        const localData = JSON.parse(localDataString);
        const bookData = localData[book];
        if (bookData && bookData[topicId]) {
          const paragraphs = bookData[topicId];
          const para = paragraphs[pageNumber - 1];
          if (!para) return null;

          return {
            n: pageNumber.toString(),
            image: "", // Local text doesn't have specific images yet
            imagePath: topicIdToImage(topicId),
            hanNom: [], // Wikisource version is primarily Quoc Ngu
            transliteration: [{ n: "1", text: para }],
            notes: [],
          };
        }
      } catch (fsError) {
        console.error("Failed to read local DVSKTT data", fsError);
      }
    }

    const item = data[pageNumber - 1];
    if (!item) return null;

    return {
      n: pageNumber.toString(),
      image: item.toso || item.ToSo || "",
      imagePath: topicIdToImage(topicId),
      hanNom: (item.nom || "")
        .split("@")
        .map((t: string, i: number) => ({ n: (i + 1).toString(), text: t })),
      transliteration: (
        item.QuocNgu ||
        item.quocngu ||
        item.phien_am ||
        item.transcription ||
        ""
      )
        .split("@")
        .map((t: string, i: number) => ({
          n: (i + 1).toString(),
          text: t.replace(/<[^>]*>/g, ""),
        })),
      notes: [],
    };
  } catch (error) {
    console.error("Error parsing DVSKTT page", error);
    return null;
  }
}

const getText = (node: any): string => {
  if (!node) return "";
  if (typeof node === "string") return node;
  let text = node._ || "";
  if (node.seg) {
    const segTexts = node.seg.map((s: any) => getText(s)).join("");
    // Join seg text with main text, usually seg comes first in these files
    text = segTexts + text;
  }
  return text.trim();
};

function getSmartSnippet(
  text: string,
  query: string,
  type: "han" | "nom" | "qn" = "qn"
): string {
  if (!text) return "";

  const queryLower = query.toLowerCase();
  const isQn = type === "qn";
  // For CJK content, a DB hit may come from a simplified/traditional variant.
  // Match and highlight any variant so results from variant hits still render.
  const snippetVariants = isQn ? [query] : hanVariants(query);
  const lowerSnippetVariants = snippetVariants.map((v) => v.toLowerCase());
  const variantAlternation = snippetVariants
    .map(escapeRegExp)
    .join("|");
  const hasHanChars = (s: string): boolean => {
    for (const ch of s) {
      const cp = ch.codePointAt(0) || 0;
      if (
        (cp >= 0x3400 && cp <= 0x4dbf) || // CJK Ext A
        (cp >= 0x4e00 && cp <= 0x9fff) || // CJK Unified
        (cp >= 0xf900 && cp <= 0xfaff) || // CJK Compatibility Ideographs
        (cp >= 0x20000 && cp <= 0x2a6df) || // CJK Ext B
        (cp >= 0x2a700 && cp <= 0x2b73f) || // CJK Ext C
        (cp >= 0x2b740 && cp <= 0x2b81f) || // CJK Ext D
        (cp >= 0x2b820 && cp <= 0x2ceaf) || // CJK Ext E
        (cp >= 0x2ceb0 && cp <= 0x2ebef) || // CJK Ext F
        (cp >= 0x30000 && cp <= 0x3134f) // CJK Ext G
      ) {
        return true;
      }
    }
    return false;
  };
  const isMatch = (s: string): boolean => {
    if (isQn) return containsWholeWord(s, query);
    const low = s.toLowerCase();
    return lowerSnippetVariants.some((v) => low.includes(v));
  };

  const highlight = (s: string): string => {
    const escaped = s.replace(/[&<>"']/g, (m) => {
      const map: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return map[m];
    });
    try {
      if (isQn) {
        const escapedQuery = escapeRegExp(query);
        return escaped.replace(
          new RegExp(
            `(^|[^\\p{L}\\p{N}_])(${escapedQuery})(?=$|[^\\p{L}\\p{N}_])`,
            "giu"
          ),
          "$1<mark class='bg-yellow-200 dark:bg-yellow-800/50 text-branding-black dark:text-zinc-100 rounded px-0.5'>$2</mark>"
        );
      }
      return escaped.replace(
        new RegExp(`(${variantAlternation})`, "gi"),
        "<mark class='bg-yellow-200 dark:bg-yellow-800/50 text-branding-black dark:text-zinc-100 rounded px-0.5'>$1</mark>"
      );
    } catch {
      return escaped;
    }
  };

  // 1. @-separated segments (DVSKTT nom/QuocNgu style)
  if (text.includes("@")) {
    const segments = text
      .split("@")
      .map((s) =>
        s
          .replace(/<[^>]*>/g, "")
          .replace(/\|/g, " ")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter(Boolean);
    const match = segments.find(isMatch);
    const fallback = isQn ? segments.find((s) => !hasHanChars(s)) : undefined;
    return highlight(match || fallback || segments[0] || "");
  }

  // 2. XML <l> line elements (Truyen Kieu XML, Chinh Phu Ngam, Luc Van Tien, Quoc Am Thi Tap)
  const lTagRegex = /<l[^>]*>([\s\S]*?)<\/l>/g;
  const lLines: string[] = [];
  let lMatch: RegExpExecArray | null;
  while ((lMatch = lTagRegex.exec(text)) !== null) {
    const inner = lMatch[1]
      .replace(/<[^>]*>/g, "")
      .replace(/\|/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (inner) lLines.push(inner);
  }
  if (lLines.length > 0) {
    const matchLine = lLines.find(isMatch);
    const fallback = isQn ? lLines.find((l) => !hasHanChars(l)) : undefined;
    return highlight(matchLine || fallback || lLines[0]);
  }

  // 3. Clean text — if already short, return as-is (single-line data like HXH, Kieu rows)
  const cleanText = text
    .replace(/<[^>]*>/g, "")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (cleanText.length <= 150) return highlight(cleanText);

  // 4. Try splitting on newlines
  const newlineLines = text
    .replace(/<[^>]*>/g, "")
    .split(/[\n\r]+/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  if (newlineLines.length > 1) {
    const matchLine = newlineLines.find(isMatch);
    if (matchLine)
      return highlight(
        matchLine.length > 200 ? matchLine.substring(0, 200) + "…" : matchLine
      );
    if (isQn) {
      const fallback = newlineLines.find((l) => !hasHanChars(l));
      if (fallback)
        return highlight(
          fallback.length > 200 ? fallback.substring(0, 200) + "…" : fallback
        );
    }
  }

  // 5. Character-window fallback
  let idx = -1;
  if (isQn) {
    const exactWord = new RegExp(
      `(^|[^\\p{L}\\p{N}_])(${escapeRegExp(query)})(?=$|[^\\p{L}\\p{N}_])`,
      "iu"
    ).exec(cleanText);
    if (exactWord) idx = (exactWord.index || 0) + (exactWord[1]?.length || 0);
  } else {
    const low = cleanText.toLowerCase();
    for (const v of lowerSnippetVariants) {
      const i = low.indexOf(v);
      if (i !== -1 && (idx === -1 || i < idx)) idx = i;
    }
  }
  if (idx === -1) {
    if (isQn && hasHanChars(cleanText)) return "";
    return highlight(
      cleanText.substring(0, 100) + (cleanText.length > 100 ? "…" : "")
    );
  }
  const radius = 60;
  const start = Math.max(0, idx - radius);
  const end = Math.min(cleanText.length, idx + query.length + radius);
  return highlight(
    (start > 0 ? "…" : "") +
      cleanText.substring(start, end) +
      (end < cleanText.length ? "…" : "")
  );
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsWholeWord(text: string, query: string): boolean {
  const normalizedText = (text || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\|/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const normalizedQuery = (query || "").replace(/\s+/g, " ").trim();
  if (!normalizedText || !normalizedQuery) return false;

  // Treat letters/digits/underscore as "word" characters (Unicode-aware).
  const pattern = `(?:^|[^\\p{L}\\p{N}_])${escapeRegExp(
    normalizedQuery
  )}(?=$|[^\\p{L}\\p{N}_])`;
  try {
    return new RegExp(pattern, "iu").test(normalizedText);
  } catch {
    return normalizedText
      .toLowerCase()
      .split(/\s+/)
      .includes(normalizedQuery.toLowerCase());
  }
}

function likeAny(colExpr: string, variantCount: number): string {
  const part = `CONVERT(${colExpr} USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE CONVERT(? USING utf8mb4) COLLATE utf8mb4_unicode_ci`;
  if (variantCount <= 1) return part;
  return `(${Array(variantCount).fill(part).join(" OR ")})`;
}

function anyVariantIncludes(text: string, lowerVariants: string[]): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  for (const v of lowerVariants) {
    if (v && t.includes(v)) return true;
  }
  return false;
}

export async function searchCorpus(query: string) {
  const results: any[] = [];
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return results;

  // Expand CJK queries to simplified/traditional variants so either form matches.
  // Non-CJK queries return as [query] — existing behavior is preserved.
  const variants = hanVariants(query.trim());
  const lowerVariants = variants.map((v) => v.toLowerCase());
  const wildcards = lowerVariants.map((v) => `%${v}%`);
  const vCount = wildcards.length;
  const wildcard = wildcards[0];

  try {
    const allWorks = await getCorpusRegistry();
    const workMap = new Map(allWorks.map((w) => [w.slug, w]));

    // 1. Search Truyện Kiều Editions
    const kieuEditions = [
      {
        table: "1866data",
        slug: "truyen-kieu-1866",
        title: "Truyện Kiều (1866)",
      },
      {
        table: "1870data",
        slug: "truyen-kieu-1870",
        title: "Truyện Kiều (1870)",
      },
      {
        table: "1871data",
        slug: "truyen-kieu-1871",
        title: "Truyện Kiều (1871)",
      },
      {
        table: "1872data",
        slug: "truyen-kieu-1872",
        title: "Truyện Kiều (1872)",
      },
      {
        table: "1902data",
        slug: "truyen-kieu-1902",
        title: "Truyện Kiều (1902)",
      },
    ];

    for (const ed of kieuEditions) {
      try {
        // Increased limit for Kiều editions
        const kieuRows = await queryRows<any>(
          `SELECT id, qn, unicode, special, page FROM ${ed.table}
           WHERE ${likeAny("qn", vCount)}
              OR ${likeAny("unicode", vCount)}
              OR ${likeAny("special", vCount)}
           LIMIT 200`,
          [...wildcards, ...wildcards, ...wildcards]
        );
        kieuRows.forEach((row) => {
          const isNomMatch =
            anyVariantIncludes(row.unicode || "", lowerVariants) ||
            anyVariantIncludes(row.special || "", lowerVariants);
          const isQnMatch = containsWholeWord(row.qn || "", query);
          if (!isNomMatch && !isQnMatch) return;
          results.push({
            work: ed.title,
            location: `Page ${row.page || ""}, ID ${row.id}`,
            slug: ed.slug,
            type: isNomMatch ? "nom" : "qn",
            text: getSmartSnippet(
              isNomMatch ? row.unicode || row.special : row.qn,
              query,
              isNomMatch ? "nom" : "qn"
            ),
            externalPath: `/our-collections/truyen-kieu/${ed.slug}${
              row.page ? `?page=${row.page}` : ""
            }`,
          });
        });
      } catch (e) {
        console.error(`Search ${ed.table} failed`, e);
      }
    }

    // 2. Search DVSKTT (Sections & Quyển Thủ)
    try {
      // Fetch results with correlated subqueries to compute the local 1-indexed page
      // within each topic. MaQN is the global physical page; the viewer needs the local
      // row index. We mirror the API's column logic exactly:
      //   topicId 1–14  → grouped by MaTrieuDai → local_page_trd
      //   topicId >= 15 → grouped by MaTenHieu  → local_page_th
      // CASE guards prevent counting against NULL/0 values in the wrong column.
      const dvskRows = await queryRows<any>(
        `SELECT t.*,
                    CASE WHEN t.MaTrieuDai >= 1 AND t.MaTrieuDai <= 14
                         THEN (SELECT COUNT(*) FROM tbl_dvsk_data s WHERE s.MaTrieuDai = t.MaTrieuDai AND s.MaQN < t.MaQN) + 1
                         ELSE NULL END AS local_page_trd,
                    CASE WHEN t.MaTrieuDai >= 1 AND t.MaTrieuDai <= 14
                         THEN (SELECT COUNT(*) FROM tbl_dvsk_data s WHERE s.MaTrieuDai = t.MaTrieuDai)
                         ELSE NULL END AS total_trd,
                    CASE WHEN t.MaTenHieu >= 15
                         THEN (SELECT COUNT(*) FROM tbl_dvsk_data s WHERE s.MaTenHieu = t.MaTenHieu AND s.MaQN < t.MaQN) + 1
                         ELSE NULL END AS local_page_th,
                    CASE WHEN t.MaTenHieu >= 15
                         THEN (SELECT COUNT(*) FROM tbl_dvsk_data s WHERE s.MaTenHieu = t.MaTenHieu)
                         ELSE NULL END AS total_th
                 FROM tbl_dvsk_data t
                 WHERE ${likeAny("t.nom", vCount)}
                    OR ${likeAny("COALESCE(t.phien_am, '')", vCount)}
                 LIMIT 1000`,
        [...wildcards, ...wildcards]
      );
      dvskRows.forEach((row) => {
        const maTD = Number(row.MaTrieuDai || 0);
        const maTH = Number(row.MaTenHieu || 0);

        // Choose topicId and localPage using the same column the API will query.
        // Clamp localPage to [1, total] — if our count exceeds the topic's actual
        // row count (e.g. due to MaQN gaps or ordering quirks), fall back to page 1.
        let topicId: number;
        let localPage: number;
        if (maTD >= 1 && maTD <= 14 && row.local_page_trd != null) {
          topicId = maTD;
          const total = Number(row.total_trd || 1);
          localPage = Math.min(Number(row.local_page_trd), total);
        } else if (maTH >= 15 && row.local_page_th != null) {
          topicId = maTH;
          const total = Number(row.total_th || 1);
          localPage = Math.min(Number(row.local_page_th), total);
        } else {
          return; // no valid topic mapping — skip
        }

        const topicTitle = resolveTopicTitle(topicId);
        const isNomMatch = anyVariantIncludes(row.nom || "", lowerVariants);
        const isQnMatch = containsWholeWord(row.phien_am || "", query);
        if (!isNomMatch && !isQnMatch) return;
        const { topic } = topicIdToBookAndTopic(topicId);
        results.push({
          work: "Đại Việt sử ký toàn thư",
          location: `${topicTitle || "Unknown Section"}, Page ${localPage}`,
          slug: "dai-viet-su-ky-toan-thu",
          topic: Number(topic),
          page: localPage,
          type: isNomMatch ? "nom" : "qn",
          text: getSmartSnippet(
            isNomMatch ? row.nom : row.phien_am || row.QuocNgu || "",
            query,
            isNomMatch ? "nom" : "qn"
          ),
          externalPath: `/our-collections/dai-viet-su-ky-toan-thu/${topicIdToSlug(
            topicId
          )}?page=${localPage}&topic=${topic}`,
        });
      });

      const qtRows = await queryRows<any>(
        `SELECT qt.*,
                    (SELECT COUNT(*) FROM tbl_quyenthu s WHERE s.Quyen = qt.Quyen AND s.MaQN < qt.MaQN) + 1 AS local_page
                 FROM tbl_quyenthu qt
                 WHERE CONVERT(COALESCE(qt.phien_am, '') USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE CONVERT(? USING utf8mb4) COLLATE utf8mb4_unicode_ci
                 LIMIT 200`,
        [wildcard]
      );
      qtRows.forEach((row) => {
        if (!containsWholeWord(row.phien_am || "", query)) return;
        // Quyen stores the topicId (100-106); subtract 99 to get local 1-indexed topic
        const quyenTopicId = Number(row.Quyen || 100);
        const localTopic =
          quyenTopicId >= 100 ? quyenTopicId - 99 : quyenTopicId;
        const localPage = Number(row.local_page || 1);
        results.push({
          work: "Đại Việt sử ký toàn thư: Quyển Thủ",
          location: `Quyển Thủ, Page ${localPage}`,
          slug: "quyen-thu",
          type: "qn",
          text: getSmartSnippet(row.phien_am || row.QuocNgu || "", query, "qn"),
          externalPath: `/our-collections/dai-viet-su-ky-toan-thu/quyen-thu?page=${localPage}&topic=${localTopic}`,
        });
      });
    } catch (e) {
      console.error("Search DVSKTT failed", e);
    }

    // 3. Search Other Major Works
    const otherWorks = [
      {
        table: "chinh_phu_ngam",
        title: "Chinh phụ ngâm khúc",
        col: "text",
        type: "qn" as const,
        path: "/our-collections/chinh-phu-ngam-khuc/chinh-phu-ngam-khuc",
      },
      {
        table: "luc_van_tien",
        title: "Lục Vân Tiên",
        col: "text",
        type: "qn" as const,
        path: "/our-collections/luc-van-tien/van-tien-co-tich-tan-truyen",
      },
    ];

    for (const w of otherWorks) {
      try {
        const rows = await queryRows<any>(
          `SELECT * FROM ${w.table}
           WHERE CONVERT(${w.col} USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE CONVERT(? USING utf8mb4) COLLATE utf8mb4_unicode_ci
           LIMIT 100`,
          [wildcard]
        );
        rows.forEach((row) => {
          if (!containsWholeWord(row[w.col] || "", query)) return;
          const snippet = getSmartSnippet(row[w.col], query, w.type);
          if (!snippet) return;
          const pageNum = row.textNo || row.id || 1;
          results.push({
            work: w.title,
            location: `Page ${pageNum}`,
            type: w.type,
            text: snippet,
            externalPath: `${w.path}?page=${pageNum}`,
          });
        });
      } catch (e) {
        console.error(`Search ${w.table} failed`, e);
      }
    }

    // 4. Search Hồ Xuân Hương (tho_hxh)
    try {
      const hxhRows = await queryRows<any>(
        `SELECT * FROM tho_hxh
         WHERE ${likeAny("qn", vCount)}
            OR ${likeAny("nom", vCount)}
         LIMIT 100`,
        [...wildcards, ...wildcards]
      );
      hxhRows.forEach((row) => {
        const isNomMatch = anyVariantIncludes(row.nom || "", lowerVariants);
        const isQnMatch = containsWholeWord(row.qn || "", query);
        if (!isNomMatch && !isQnMatch) return;
        results.push({
          work: "Thơ Hồ Xuân Hương",
          location: row.qn_topic || "Poem",
          slug: "tho-ho-xuan-huong",
          type: isNomMatch ? "nom" : "qn",
          text: getSmartSnippet(
            isNomMatch ? row.nom : row.qn,
            query,
            isNomMatch ? "nom" : "qn"
          ),
          externalPath: `/our-collections/tho-ho-xuan-huong/tinh-hoa-mua-xuan?topic=${encodeURIComponent(
            row.qn_topic || ""
          )}`,
        });
      });
    } catch (e) {
      console.error("Search tho_hxh failed", e);
    }

    // 5. Search Quốc âm Thi tập (qatt)
    try {
      const qattRows = await queryRows<any>(
        `SELECT * FROM qatt
         WHERE ${likeAny("qn_body", vCount)}
            OR ${likeAny("hn_body", vCount)}
         LIMIT 100`,
        [...wildcards, ...wildcards]
      );
      qattRows.forEach((row) => {
        const isNomMatch = anyVariantIncludes(row.hn_body || "", lowerVariants);
        const isQnMatch = containsWholeWord(row.qn_body || "", query);
        if (!isNomMatch && !isQnMatch) return;
        results.push({
          work: "Quốc âm Thi tập",
          location: row.qn_title || "Poem",
          slug: "quoc-am-thi-tap",
          type: isNomMatch ? "nom" : "qn",
          text: getSmartSnippet(
            isNomMatch ? row.hn_body : row.qn_body,
            query,
            isNomMatch ? "nom" : "qn"
          ),
          externalPath: `/our-collections/quoc-am-thi-tap/nguyen-trai-quoc-am-thi-tap?topic=${row.id}`,
        });
      });
    } catch (e) {
      console.error("Search qatt failed", e);
    }
  } catch (error) {
    console.error("Multi-table search failed", error);
  }

  // 6. Search OCR documents (in-memory cached search index)
  try {
    const { getIndex, getAllSearchIndexes } = await import("@/lib/ocr-store");
    const [index, searchIndexes] = await Promise.all([getIndex(), getAllSearchIndexes()]);

    for (const [slug, entry] of Object.entries(index)) {
      if (entry.status !== "partial" && entry.status !== "complete" && entry.status !== "corrected") continue;
      if (entry.pageCount <= 0) continue;

      const searchIdx = searchIndexes[slug];
      if (!searchIdx) continue;

      let docHits = 0;
      for (const pg of searchIdx.pages) {
        if (docHits >= 50) break;
        if (!anyVariantIncludes(pg.textLower, lowerVariants)) continue;

        const snippet = getSmartSnippet(pg.text, query, "han");
        if (!snippet) continue;

        results.push({
          work: entry.title ?? slug,
          location: `Page ${pg.page}`,
          slug,
          page: pg.page,
          type: "han",
          text: snippet,
          externalPath: entry.itemId
            ? `/reading-workshop/${entry.itemId}?page=${pg.page}`
            : undefined,
        });
        docHits++;
      }
    }
  } catch (e) {
    console.error("Search OCR documents failed", e);
  }

  return results;
}
