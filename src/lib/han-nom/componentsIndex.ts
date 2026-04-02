import { readFileSync } from "fs";
import { join } from "path";

// Load via fs to avoid webpack mishandling the [locale] directory in the path
let classificationData: Record<string, string[]> = {};
try {
  const jsonPath = join(
    process.cwd(),
    "src/app/[locale]/tools/han-nom-tools/nom-character-classification-and-analysis-tool/hn_classifcation.json"
  );
  classificationData = JSON.parse(readFileSync(jsonPath, "utf-8"));
  console.log("[componentsIndex] Loaded JSON from", jsonPath);
} catch (err) {
  console.error("[componentsIndex] Failed to load classification JSON:", err);
}

// IDS operators (U+2FF0–U+2FFB)
const IDS_OPERATORS = new Set([..."⿰⿱⿲⿳⿴⿵⿶⿷⿸⿹⿺⿻"]);

export function isCJKChar(char: string): boolean {
  const cp = char.codePointAt(0);
  if (cp === undefined) return false;
  return (
    (cp >= 0x4e00 && cp <= 0x9fff) ||    // CJK Unified Ideographs
    (cp >= 0x3400 && cp <= 0x4dbf) ||    // Extension A
    (cp >= 0x20000 && cp <= 0x2a6df) ||  // Extension B
    (cp >= 0x2a700 && cp <= 0x2b73f) ||  // Extension C
    (cp >= 0x2b740 && cp <= 0x2b81f) ||  // Extension D
    (cp >= 0x2b820 && cp <= 0x2ceaf) ||  // Extension E
    (cp >= 0x2ceb0 && cp <= 0x2ebef) ||  // Extension F
    (cp >= 0x30000 && cp <= 0x3134f) ||  // Extension G
    (cp >= 0x31350 && cp <= 0x323af) ||  // Extension H
    (cp >= 0xf900 && cp <= 0xfaff)  ||   // Compatibility Ideographs
    (cp >= 0x2e80 && cp <= 0x2fdf)        // CJK Radicals Supplement + Kangxi Radicals
  );
}

/**
 * Normalization map: variant/simplified forms → canonical form.
 * Only radical stroke-form variants are listed manually here — these cannot
 * be derived from the classification data. All other simplified↔traditional
 * and variant↔canonical pairs are built automatically from C1/C2 entries below.
 */
const CHAR_NORM: Record<string, string> = {
  // Radical stroke-form variants (positional forms used only as components)
  "亻": "人",   // person-left
  "刂": "刀",   // knife-right
  "扌": "手",   // hand-left
  "忄": "心",   // heart-left
  "㣺": "心",   // heart-bottom
  "氵": "水",   // water-left
  "氺": "水",   // water-bottom
  "灬": "火",   // fire-bottom
  "爫": "爪",   // claw-top
  "牜": "牛",   // ox-left
  "犭": "犬",   // dog-left
  "耂": "老",   // old-top
  "艹": "艸",   // grass-top
  "覀": "西",   // cover-top (西 form)
  "襾": "西",   // cover-top (襾 form)
  "罒": "网",   // net-top
  "肀": "聿",   // brush stroke form
  "丬": "爿",   // bed/plank left form
  "攵": "攴",   // tap/rap
  "礻": "示",   // spirit-left
  "衤": "衣",   // clothes-left
  "纟": "糸",   // thread-left (simplified)
  "糹": "糸",   // thread-left (traditional)
  "讠": "言",   // speech-left
  "钅": "金",   // metal-left
  "饣": "食",   // food-left
  "虫": "蟲",   // insect (simplified component form)
  // Shape/form variants
  "尣": "尢",   // lame radical variant
  "户": "戶",   // door (simplified)
  "戸": "戶",   // door (Japanese form)
  "靑": "青",   // blue/green variant
  "鼔": "鼓",   // drum variant
  "鼡": "鼠",   // rat/mouse variant
  // Simplified → Traditional (not derivable from Han-Nom C1/C2 classification data)
  "见": "見",
  "贝": "貝",
  "车": "車",
  "长": "長",
  "门": "門",
  "页": "頁",
  "风": "風",
  "飞": "飛",
  "马": "馬",
  "鱼": "魚",
  "鸟": "鳥",
  "卤": "鹵",
  "麦": "麥",
  "黄": "黃",
  "黾": "黽",
  "齐": "齊",
  "齿": "齒",
  "龙": "龍",
  "竜": "龍",   // Japanese simplified form
  "𬺞": "龜",   // modern simplified form
  "韦": "韋",
  // CJK Radicals Supplement block variants
  "⺮": "竹",
  "釒": "金",
  "⺼": "肉",
  "⻍": "辶",
};

// Automatically build variant→canonical from C1/C2 entries in the classification data.
// Format: "C1: reading canonical → variant1 → variant2 ..."
// The first CJK character after the type prefix is the canonical form;
// subsequent CJK characters (separated by →) are variant/simplified forms.
for (const classifications of Object.values(classificationData)) {
  for (const cls of classifications) {
    if (!cls.startsWith("C1:") && !cls.startsWith("C2:") && !cls.startsWith("D1:") && !cls.startsWith("D2:")) continue;
    const rest = cls.slice(4).trim();
    const tokens = rest.split(" ");
    const chain: string[] = [];
    for (const tok of tokens) {
      if (tok === "→") continue;
      const cjkInTok = [...tok].filter(isCJKChar);
      if (cjkInTok.length === 1) chain.push(cjkInTok[0]);
      else break; // hit a reading syllable or multi-char token — stop
    }
    if (chain.length >= 2) {
      const canonical = chain[0];
      for (let i = 1; i < chain.length; i++) {
        const variant = chain[i];
        // Manual radical entries take priority; don't overwrite them
        if (!(variant in CHAR_NORM)) {
          CHAR_NORM[variant] = canonical;
        }
      }
    }
  }
}
console.log("[componentsIndex] Norm map size:", Object.keys(CHAR_NORM).length);

function normalize(char: string): string {
  return CHAR_NORM[char] ?? char;
}

function makeKey(a: string, b: string): string {
  const na = normalize(a);
  const nb = normalize(b);
  // Sort by codepoint so the key is order-agnostic
  const pair = [na, nb].sort((x, y) => (x.codePointAt(0) ?? 0) - (y.codePointAt(0) ?? 0));
  return pair.join("");
}

// Reverse index: sorted-normalized-pair-string → list of target Han/Nom characters
const index: Map<string, string[]> = new Map();

function parseAndIndex(targetChar: string, classStr: string): void {
  // A single classification string may have multiple entries separated by |
  const parts = classStr.split("|");
  for (const part of parts) {
    const chars = Array.from(part.trim());

    // Find the first IDS operator
    let opIdx = -1;
    for (let i = 0; i < chars.length; i++) {
      if (IDS_OPERATORS.has(chars[i])) {
        opIdx = i;
        break;
      }
    }
    if (opIdx === -1) continue; // No IDS operator → skip (A1, C1, C2 type entries)

    // Find radical: first CJK char immediately before the operator (skip spaces)
    let radical: string | null = null;
    for (let i = opIdx - 1; i >= 0; i--) {
      if (chars[i] === " ") continue;
      if (isCJKChar(chars[i])) { radical = chars[i]; break; }
      break; // non-space non-CJK before operator → stop
    }
    if (!radical) continue;

    // Find component: first CJK char after the operator (skip spaces, stop at →)
    let component: string | null = null;
    for (let i = opIdx + 1; i < chars.length; i++) {
      if (chars[i] === " ") continue;
      if (chars[i] === "→") break;
      if (isCJKChar(chars[i])) { component = chars[i]; break; }
      break; // non-space non-CJK non-arrow → stop
    }
    if (!component) continue;

    // Index under the canonical sorted pair
    const key = makeKey(radical, component);
    if (!index.has(key)) index.set(key, []);
    const arr = index.get(key)!;
    if (!arr.includes(targetChar)) arr.push(targetChar);
  }
}

// Build the index at module load time (singleton — runs once on server startup)
for (const [targetChar, classifications] of Object.entries(classificationData)) {
  for (const classStr of classifications) {
    parseAndIndex(targetChar, classStr);
  }
}
console.log("[componentsIndex] Index built with", index.size, "entries");

/**
 * Returns all characters related to the given character via CHAR_NORM:
 * the character itself, its canonical form, and all known variants that
 * share the same canonical. Useful for matching radical stroke-form
 * variants when filtering a radical list.
 */
export function getRelatedChars(char: string): string[] {
  const canonical = normalize(char);
  const related = new Set<string>([char, canonical]);
  for (const [variant, canon] of Object.entries(CHAR_NORM)) {
    if (canon === canonical) related.add(variant);
  }
  return Array.from(related);
}

/**
 * Find all Han/Nom characters whose IDS decomposition contains the given
 * components (in either order). Supports radical stroke-form variants and
 * simplified↔traditional equivalents derived automatically from the data.
 *
 * @param query - 2+ CJK characters representing the desired components
 * @returns Deduplicated list of matching Han/Nom characters
 */
export function findCharsByComponents(query: string): string[] {
  const cjkChars: string[] = [];
  for (const ch of query) {
    if (isCJKChar(ch)) cjkChars.push(ch);
  }

  if (cjkChars.length < 2) return [];

  if (cjkChars.length === 2) {
    const key = makeKey(cjkChars[0], cjkChars[1]);
    return index.get(key) ?? [];
  }

  // 3+ chars: collect results for all pairs, deduplicated
  const seen = new Set<string>();
  const results: string[] = [];
  for (let i = 0; i < cjkChars.length; i++) {
    for (let j = i + 1; j < cjkChars.length; j++) {
      const key = makeKey(cjkChars[i], cjkChars[j]);
      for (const ch of index.get(key) ?? []) {
        if (!seen.has(ch)) {
          seen.add(ch);
          results.push(ch);
        }
      }
    }
  }
  return results;
}
