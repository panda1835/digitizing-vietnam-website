import fs from "fs/promises";
import path from "path";
import { parseStringPromise } from "xml2js";
import pool from "@/lib/db";
import { titles, flattenItems, titleToTopicId, topicIdToImage, isDvskttSlug, topicIdToTitle, topicIdToBookAndTopic, topicIdToSlug } from "./dvsktt-utils";

type QueryRow = Record<string, any>;

async function queryRows<T extends QueryRow = QueryRow>(query: string, params: any[] = []): Promise<T[]> {
    const result: any = await (pool as any).query(query, params);
    if (Array.isArray(result)) return (result[0] || []) as T[];
    if (result?.rows && Array.isArray(result.rows)) return result.rows as T[];
    return [];
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
export type CorpusGenre = "Poetry" | "History" | "Fiction" | "Philosophy" | "Religion" | "Legal" | "Other";
export type AttributionRole = "Author" | "Compiler" | "Translator" | "Editor" | "Commentator" | "Scribe" | "Printer" | "Other";
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
    type: "xml" | "db" | "research";
    genre?: CorpusGenre;
    language?: CorpusLanguage;
    attributions?: Attribution[];
    curationStatus?: CorpusCurationStatus;
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
        externalPath: "/our-collections/truyen-kieu/truyen-kieu-1866"
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
        externalPath: "/our-collections/truyen-kieu/truyen-kieu-1870"
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
        externalPath: "/our-collections/truyen-kieu/truyen-kieu-1871"
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
        externalPath: "/our-collections/truyen-kieu/truyen-kieu-1872"
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
        externalPath: "/our-collections/truyen-kieu/truyen-kieu-1902"
    },
    {
        slug: "truyen-kieu",
        title: "Truyện Kiều (Kim Vân Kiều Tân Truyện)",
        pages: 3254,
        type: "db",
        genre: "Poetry",
        language: "Nôm",
        attributions: [{ name: "Nguyễn Du", role: "Author" }],
        curationStatus: "curated",
        collectionId: "truyen-kieu",
        documentId: "truyen-kieu-1866" // Default to 1866 edition if the generic slug is used
    },
    {
        slug: "luc-van-tien",
        title: "Lục Vân Tiên",
        date: "",
        filePath: "data/luc-van-tien/Luc_Van_Tien.xml",
        pages: 150,
        type: "xml",
        genre: "Poetry",
        language: "Nôm",
        attributions: [{ name: "Nguyễn Đình Chiểu", role: "Author" }],
        curationStatus: "wiki",
        collectionId: "luc-van-tien",
        documentId: "van-tien-co-tich-tan-truyen"
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
        externalPath: "/our-collections/dai-viet-su-ky-toan-thu/quyen-thu"
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
        externalPath: "/our-collections/dai-viet-su-ky-toan-thu/ngoai-ky"
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
        externalPath: "/our-collections/dai-viet-su-ky-toan-thu/ban-ky-toan-thu"
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
        externalPath: "/our-collections/dai-viet-su-ky-toan-thu/ban-ky-thuc-luc"
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
        externalPath: "/our-collections/dai-viet-su-ky-toan-thu/ban-ky-tuc-bien"
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
            { name: "Đoàn Thị Điểm", role: "Translator" }
        ],
        curationStatus: "curated",
        collectionId: "chinh-phu-ngam-khuc",
        documentId: "chinh-phu-ngam-khuc",
        externalPath: "/our-collections/chinh-phu-ngam-khuc/chinh-phu-ngam-khuc"
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
        externalPath: "/our-collections/quoc-am-thi-tap/nguyen-trai-quoc-am-thi-tap"
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
        externalPath: "/our-collections/tho-ho-xuan-huong/tinh-hoa-mua-xuan"
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
        externalPath: "/our-collections/luc-van-tien/van-tien-co-tich-tan-truyen"
    }
];

export async function getCorpusRegistry() {
    const works: CorpusWork[] = [];

    // 0. Start with hardcoded works
    works.push(...CORPUS_REGISTRY);

    // 1. Fetch from v2 corpus_works
    try {
        const rows = await queryRows<any>(
            "SELECT slug, title, metadata FROM public.corpus_works ORDER BY title ASC"
        );
        rows.forEach((row: any) => {
            works.push({
                slug: row.slug,
                title: row.title,
                pages: 0,
                type: "db",
                genre: row.metadata?.genre || "Other",
                curationStatus: row.metadata?.curationStatus || "curated",
                externalPath: `/our-collections/${row.slug}`
            });
        });
    } catch (error) {
        console.error("Error fetching v2 corpus works:", error);
    }

    // 2. Fetch from research_texts
    try {
        const rows = await queryRows<any>(
            "SELECT id, title, slug, page_count, created_at FROM research_texts WHERE is_public = TRUE ORDER BY updated_at DESC"
        );
        rows.forEach((row: any) => {
            let year: number | undefined = undefined;
            try {
                if (row.created_at) {
                    const d = new Date(row.created_at);
                    if (!isNaN(d.getTime())) year = d.getFullYear();
                }
            } catch (e) { }

            works.push({
                slug: `text-${row.id}`,
                title: row.title || "Untitled Research",
                date: year ? year.toString() : "",
                year: year,
                pages: row.page_count || 1,
                type: "research",
                curationStatus: "wiki",
                genre: "Other",
                language: "Hán-Nôm"
            });
        });
    } catch (error) {
        console.error("Error fetching research texts for registry:", error);
    }

    // Combine and deduplicate by slug (Hardcoded/V2 take priority)
    const seen = new Set();
    const uniqueWorks = works.filter(w => {
        if (seen.has(w.slug)) return false;
        seen.add(w.slug);
        return true;
    });

    return identifierRegistryMerge(uniqueWorks);
}

function identifierRegistryMerge(dbWorks: CorpusWork[]) {
    // If we have hardcoded metadata in CORPUS_REGISTRY, merge it
    return dbWorks.map(dbW => {
        const hardcoded = CORPUS_REGISTRY.find(h => h.slug === dbW.slug);
        return hardcoded ? { ...dbW, ...hardcoded } : dbW;
    });
}

export async function getWorkBySlug(slug: string) {
    if (slug.startsWith("text-")) {
        const id = slug.replace("text-", "");
        try {
            const rows = await queryRows<any>(
                "SELECT id, title, slug, page_count, created_at FROM research_texts WHERE id = $1",
                [id]
            );
            if (rows.length > 0) {
                const row = rows[0];
                return {
                    slug: `text-${row.id}`,
                    title: row.title || "Untitled Research",
                    date: row.created_at ? new Date(row.created_at).getFullYear().toString() : "",
                    year: row.created_at ? new Date(row.created_at).getFullYear() : undefined,
                    pages: row.page_count || 1,
                    type: "research" as const,
                    curationStatus: "wiki" as const,
                    genre: "Other" as const,
                    language: "Hán-Nôm" as const,
                    filePath: undefined
                };
            }
        } catch (error) {
            console.error(`Error fetching research work by slug ${slug}:`, error);
        }
    }
    return CORPUS_REGISTRY.find(w => w.slug === slug);
}

export async function parseCorpusPage(slug: string, pageNumber: number, options?: any): Promise<CorpusPage | null> {
    const work = await getWorkBySlug(slug);
    if (!work) return null;

    if (work.type === "research" && slug.startsWith("text-")) {
        const id = slug.replace("text-", "");
        try {
            const rows = await queryRows<any>(
                "SELECT transcription, metadata FROM research_texts WHERE id = $1",
                [id]
            );
            if (rows.length > 0) {
                const row = rows[0];
                const metadata = row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : {};

                // Map research text to CorpusPage structure
                return {
                    n: pageNumber.toString(),
                    image: metadata.source_url || "",
                    hanNom: [], // Research texts are usually raw string for now
                    transliteration: (row.transcription || "").split("\n").map((line: string, i: number) => ({
                        n: (i + 1).toString(),
                        text: line
                    })),
                    notes: []
                };
            }
        } catch (error) {
            console.error(`Error parsing research page ${slug}:${pageNumber}`, error);
            return null;
        }
    }

    if (work.type === "db" && isDvskttSlug(slug)) {
        // Automatically inject correct book index if not provided
        if (!options?.book) {
            const bookIdx = slug === "quyen-thu" ? "0" :
                slug === "ngoai-ky" ? "1" :
                    slug === "ban-ky-toan-thu" ? "2" :
                        slug === "ban-ky-thuc-luc" ? "3" :
                            slug === "ban-ky-tuc-bien" ? "4" : "1";
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
        const transDiv = pageData.div.find((d: any) => d.$.type === "transliteration");
        const noteGroup = pageData.noteg ? pageData.noteg[0] : null;

        const hanNomLines = hanNomDiv?.lg[0].l.map((l: any) => ({
            n: l.$.n,
            text: typeof l === "string" ? l : l._ || ""
        })) || [];

        const transLines = transDiv?.lg[0].l.map((l: any) => ({
            n: l.$.n,
            text: typeof l === "string" ? l : l._ || ""
        })) || [];

        const notes = noteGroup?.note?.map((n: any) => ({
            id: n.$.id,
            target: n.$.target,
            content: typeof n === "string" ? n : n._ || ""
        })) || [];

        return {
            n: pageData.$.n,
            image: pageData.$.pi,
            hanNom: hanNomLines,
            transliteration: transLines,
            notes
        };
    } catch (error) {
        console.error(`Error parsing corpus page ${slug}:${pageNumber}`, error);
        return null;
    }
}

async function parseDvskttPage(pageNumber: number, options?: any): Promise<CorpusPage | null> {
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
                const checkRows = await queryRows<any>(`SELECT count(*) as count FROM tbl_quyenthu WHERE "Quyen" = $1`, [topicId]);
                if (parseInt(checkRows?.[0]?.count || "0", 10) > 0) {
                    query = `SELECT * FROM tbl_quyenthu WHERE "Quyen" = $1 ORDER BY "id"`;
                    params = [topicId];
                } else {
                    // Desperate fallback for corrupted DB (NULL Quyen)
                    // We fetch all rows and we'll "simulate" chapters by chunking if needed
                    // For now, let's just fetch all so the user sees content
                    query = `SELECT * FROM tbl_quyenthu ORDER BY ctid`;
                    params = [];
                }
            } else {
                query = `SELECT * FROM tbl_dvsk_data WHERE ("MaTrieuDai" = $1 OR "MaTenHieu" = $1) ORDER BY "MaQN"`;
                params = [topicId];
            }

            data = await queryRows<any>(query, params);
        } catch (dbError) {
            console.warn("Database query failed, falling back to local Wikisource data", dbError);
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
                        notes: []
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
            hanNom: (item.nom || "").split("@").map((t: string, i: number) => ({ n: (i + 1).toString(), text: t })),
            transliteration: (item.QuocNgu || item.quocngu || item.phien_am || item.transcription || "").split("@").map((t: string, i: number) => ({ n: (i + 1).toString(), text: t.replace(/<[^>]*>/g, "") })),
            notes: []
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

function getSmartSnippet(text: string, query: string, type: "han" | "nom" | "qn" = "qn"): string {
    if (!text) return "";

    const queryLower = query.toLowerCase();

    // Helper to highlight and escape
    const finalize = (snippet: string, isTruncatedStart: boolean, isTruncatedEnd: boolean) => {
        let result = snippet;
        if (isTruncatedStart) result = "..." + result;
        if (isTruncatedEnd) result = result + "...";

        // Escaping
        const escaped = result.replace(/[&<>"']/g, (m) => {
            const map: any = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
            return map[m];
        });

        // Highlighting
        const escapedQueryForRegex = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        try {
            const regex = new RegExp(`(${escapedQueryForRegex})`, "gi");
            return escaped.replace(regex, "<mark class='bg-yellow-200 dark:bg-yellow-800/50 text-branding-black dark:text-zinc-100 rounded px-0.5'>$1</mark>");
        } catch {
            return escaped;
        }
    };

    // Poetry/Line isolation logic: if text contains '|', find the specific line matching the query
    if (text.includes("|")) {
        const rawLines = text.split("|");
        for (const rawLine of rawLines) {
            const cleanLine = rawLine.replace(/<[^>]*>?/gm, "").trim();
            if (cleanLine.toLowerCase().includes(queryLower)) {
                return finalize(cleanLine, false, false);
            }
        }
    }

    // Clean text for surrounding context: remove HTML tags and normalize whitespace
    const cleanText = text.replace(/<[^>]*>?/gm, "").replace(/\|/g, " ").replace(/\s+/g, " ").trim();

    if (type === "qn") {
        const words = cleanText.split(/\s+/);
        const matchIdx = words.findIndex(w => w.toLowerCase().includes(queryLower));
        if (matchIdx !== -1) {
            const radius = 12; // 12 words context
            const start = Math.max(0, matchIdx - radius);
            const end = Math.min(words.length, matchIdx + radius + 1);
            return finalize(words.slice(start, end).join(" "), start > 0, end < words.length);
        }
    }

    // Character based for Han/Nom or if word match failed
    const textLower = cleanText.toLowerCase();
    const charMatchIndex = textLower.indexOf(queryLower);
    const charRadius = 40;

    if (charMatchIndex === -1) {
        const snippet = cleanText.substring(0, charRadius * 2);
        return finalize(snippet, false, cleanText.length > charRadius * 2);
    }

    const start = Math.max(0, charMatchIndex - charRadius);
    const end = Math.min(cleanText.length, charMatchIndex + query.length + charRadius);
    return finalize(cleanText.substring(start, end), start > 0, end < cleanText.length);
}

export async function searchCorpus(query: string) {
    const results: any[] = [];
    const normalizedQuery = query.toLowerCase();

    try {
        const allWorks = await getCorpusRegistry();
        const workMap = new Map(allWorks.map(w => [w.slug, w]));

        // Direct search on Unified Table only
        const queryStr = `
            SELECT 
                u.id as unified_id,
                u.work_slug as source_work,
                u.topic_id,
                u.page_index,
                u.script_layer1,
                u.script_layer2,
                u.script_layer3,
                u.script_layer4,
                u.metadata as u_metadata
            FROM public.unified_corpus_data u
            WHERE (u.script_layer1 ILIKE $1)
               OR (u.script_layer2 ILIKE $1)
               OR (u.script_layer3 ILIKE $1)
               OR (u.script_layer4 ILIKE $1)
            ORDER BY 
                u.work_slug, 
                u.topic_id,
                u.page_index
            LIMIT 1000
        `;

        const dbRows = await queryRows<any>(queryStr, [`%${query}%`]);

        dbRows.forEach(row => {
            const workSlug = row.source_work;
            const work = workMap.get(workSlug);
            // Determine clean work title
            let workTitle = work?.title;
            if (!workTitle) {
                // Special mapping for common slugs if not in registry
                if (workSlug === 'truyen-kieu') workTitle = 'Truyện Kiều';
                else if (workSlug === 'chinh-phu-ngam-khuc') workTitle = 'Chinh phụ ngâm khúc';
                else if (workSlug === 'luc-van-tien') workTitle = 'Lục Vân Tiên';
                else if (workSlug === 'quoc-am-thi-tap') workTitle = 'Quốc âm thi tập';
                else if (isDvskttSlug(workSlug)) workTitle = 'Đại Việt sử ký toàn thư';
                else {
                    // Generic fallback: capitalize and remove hyphens
                    workTitle = workSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                }
            }

            // Determine location title (descriptive section/page info)
            let locationTitle = row.u_metadata?.title || row.u_metadata?.qn_title || row.u_metadata?.qn_topic;

            // DVSKTT specific title resolution
            if (isDvskttSlug(workSlug) && row.topic_id) {
                const topicTitle = topicIdToTitle(Number(row.topic_id));
                if (topicTitle) {
                    locationTitle = topicTitle;
                    if (row.page_index) {
                        locationTitle += `, Page ${row.page_index}`;
                    }
                }
            }

            // Poetry specific labeling
            if (workSlug === 'quoc-am-thi-tap' || workSlug === 'luc-van-tien' || workSlug === 'chinh-phu-ngam-khuc') {
                const prefix = workSlug === 'quoc-am-thi-tap' ? 'Poem' : 'Section';
                locationTitle = `${prefix} ${row.topic_id}${locationTitle ? `: ${locationTitle}` : ''}`;
            } else if (workSlug === 'tho-ho-xuan-huong' || workSlug === 'tinh-hoa-mua-xuan') {
                locationTitle = `Poem: ${locationTitle || row.topic_id}`;
            }

            // Fallback logic for location titles
            if (!locationTitle || locationTitle.toLowerCase().startsWith('page ')) {
                if (row.page_index && row.page_index !== '1') {
                    locationTitle = `Page ${row.page_index}`;
                } else if (row.topic_id && row.topic_id !== '1') {
                    locationTitle = `Section ${row.topic_id}`;
                } else if (row.page_index) {
                    locationTitle = `Page ${row.page_index}`;
                } else {
                    locationTitle = `Entry ${row.unified_id}`;
                }
            }

            // Determine which layer had the match for snippet
            const layers = [
                { text: row.script_layer3 || row.script_layer4, type: "qn" },
                { text: row.script_layer2, type: "nom" },
                { text: row.script_layer1, type: "han" }
            ];

            const matchLayer = layers.find(l => l.text && l.text.toLowerCase().includes(normalizedQuery)) || layers[0];
            const excerpt = getSmartSnippet(matchLayer.text || "", query, matchLayer.type as any);

            // Construct external path
            let externalPath = `/our-collections/${workSlug}/${row.topic_id || row.page_index || row.unified_id}`;

            if (isDvskttSlug(workSlug)) {
                // SPECIAL CASE: For DVSKTT, we always derive the document slug from topic_id if possible
                const resolvedSlug = row.topic_id ? topicIdToSlug(Number(row.topic_id)) : workSlug;
                externalPath = `/our-collections/dai-viet-su-ky-toan-thu/${resolvedSlug}`;
            } else if (work) {
                if (work.collectionId && work.documentId) {
                    externalPath = `/our-collections/${work.collectionId}/${work.documentId}`;
                } else if (work.externalPath) {
                    externalPath = work.externalPath;
                }
            } else {
                // Truyen Kieu fallbacks
                if (workSlug.includes('truyen-kieu')) {
                    externalPath = `/our-collections/truyen-kieu/${workSlug}`;
                }
            }

            // DVSKTT book/topic resolution
            let bookIdx: string | undefined = undefined;
            let topicParam = row.topic_id;
            if (isDvskttSlug(workSlug) && row.topic_id) {
                const mapping = topicIdToBookAndTopic(Number(row.topic_id));
                bookIdx = mapping.book;
                topicParam = mapping.topic;
            }

            results.push({
                work: workTitle, // Main title ONLY
                location: locationTitle, // Details (page/section) for excerpts/dropdowns
                slug: workSlug,
                page: row.page_index,
                book: bookIdx,
                topic: topicParam,
                externalPath: externalPath,
                text: excerpt,
                type: matchLayer.type as "han" | "nom" | "qn"
            });

        });

        // Fallback to legacy research search if no v2 results found or merged
        if (results.length < 50) {
            // ... (Optional: add research text search here)
        }

    } catch (error) {
        console.error("Hierarchical search failed", error);
    }

    return results;
}
