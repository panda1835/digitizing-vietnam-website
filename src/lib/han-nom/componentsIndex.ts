import { readFileSync } from "fs";
import { join } from "path";

let classificationData: Record<string, string[]> = {};

try {
  const jsonPath = join(
    process.cwd(),
    "src/app/[locale]/tools/han-nom-tools/nom-character-classification-and-analysis-tool/hn_classifcation.json"
  );
  classificationData = JSON.parse(readFileSync(jsonPath, "utf-8"));
} catch (error) {
  console.error("[componentsIndex] Failed to load classification data:", error);
}

const IDS_OPERATORS = new Set(Array.from("⿰⿱⿲⿳⿴⿵⿶⿷⿸⿹⿺⿻"));

export function isCJKChar(char: string): boolean {
  const codePoint = char.codePointAt(0);
  if (codePoint === undefined) return false;

  return (
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
    (codePoint >= 0x20000 && codePoint <= 0x2ebef) ||
    (codePoint >= 0x30000 && codePoint <= 0x323af) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0x2e80 && codePoint <= 0x2fdf)
  );
}

const CHAR_NORM: Record<string, string> = {
  亻: "人",
  刂: "刀",
  扌: "手",
  忄: "心",
  㣺: "心",
  氵: "水",
  氺: "水",
  灬: "火",
  爫: "爪",
  牜: "牛",
  犭: "犬",
  耂: "老",
  艹: "艸",
  覀: "西",
  襾: "西",
  罒: "网",
  肀: "聿",
  丬: "爿",
  攵: "攴",
  礻: "示",
  衤: "衣",
  纟: "糸",
  糹: "糸",
  讠: "言",
  钅: "金",
  饣: "食",
  虫: "蟲",
  尣: "尢",
  户: "戶",
  戸: "戶",
  靑: "青",
  鼔: "鼓",
  鼡: "鼠",
  见: "見",
  贝: "貝",
  车: "車",
  长: "長",
  门: "門",
  页: "頁",
  风: "風",
  飞: "飛",
  马: "馬",
  鱼: "魚",
  鸟: "鳥",
  卤: "鹵",
  麦: "麥",
  黄: "黃",
  黾: "黽",
  齐: "齊",
  齿: "齒",
  龙: "龍",
  竜: "龍",
  "𬺞": "龜",
  韦: "韋",
  "⺮": "竹",
  釒: "金",
  "⺼": "肉",
  "⻍": "辶",
};

for (const classifications of Object.values(classificationData)) {
  for (const classification of classifications) {
    if (
      !classification.startsWith("C1:") &&
      !classification.startsWith("C2:") &&
      !classification.startsWith("D1:") &&
      !classification.startsWith("D2:")
    ) {
      continue;
    }

    const chain: string[] = [];
    for (const token of classification.slice(4).trim().split(" ")) {
      if (token === "→") continue;
      const characters = Array.from(token).filter(isCJKChar);
      if (characters.length !== 1) break;
      chain.push(characters[0]);
    }

    if (chain.length < 2) continue;
    const canonical = chain[0];
    for (const variant of chain.slice(1)) {
      if (!(variant in CHAR_NORM)) CHAR_NORM[variant] = canonical;
    }
  }
}

function normalize(char: string): string {
  return CHAR_NORM[char] ?? char;
}

function makeKey(first: string, second: string): string {
  return [normalize(first), normalize(second)]
    .sort(
      (left, right) => (left.codePointAt(0) ?? 0) - (right.codePointAt(0) ?? 0)
    )
    .join("");
}

const componentIndex = new Map<string, string[]>();

function parseAndIndex(targetChar: string, classification: string): void {
  for (const part of classification.split("|")) {
    const characters = Array.from(part.trim());
    const operatorIndex = characters.findIndex((char) =>
      IDS_OPERATORS.has(char)
    );
    if (operatorIndex === -1) continue;

    let radical: string | undefined;
    for (let index = operatorIndex - 1; index >= 0; index -= 1) {
      const char = characters[index];
      if (char === " ") continue;
      if (isCJKChar(char)) radical = char;
      break;
    }

    let component: string | undefined;
    for (let index = operatorIndex + 1; index < characters.length; index += 1) {
      const char = characters[index];
      if (char === " ") continue;
      if (char !== "→" && isCJKChar(char)) component = char;
      break;
    }

    if (!radical || !component) continue;
    const key = makeKey(radical, component);
    const matches = componentIndex.get(key) ?? [];
    if (!matches.includes(targetChar)) matches.push(targetChar);
    componentIndex.set(key, matches);
  }
}

for (const [targetChar, classifications] of Object.entries(
  classificationData
)) {
  for (const classification of classifications) {
    parseAndIndex(targetChar, classification);
  }
}

export function getRelatedChars(char: string): string[] {
  const canonical = normalize(char);
  const related = new Set<string>([char, canonical]);

  for (const [variant, normalized] of Object.entries(CHAR_NORM)) {
    if (normalized === canonical) related.add(variant);
  }

  return Array.from(related);
}

export function findCharsByComponents(query: string): string[] {
  const queryCharacters = Array.from(query).filter(isCJKChar);
  if (queryCharacters.length < 2) return [];

  if (queryCharacters.length === 2) {
    return (
      componentIndex.get(makeKey(queryCharacters[0], queryCharacters[1])) ?? []
    );
  }

  const matches = new Set<string>();
  for (let first = 0; first < queryCharacters.length; first += 1) {
    for (let second = first + 1; second < queryCharacters.length; second += 1) {
      const pairMatches =
        componentIndex.get(
          makeKey(queryCharacters[first], queryCharacters[second])
        ) ?? [];
      for (const match of pairMatches) matches.add(match);
    }
  }

  return Array.from(matches);
}
