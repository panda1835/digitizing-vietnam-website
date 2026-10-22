// Quốc ngữ syllable analysis: initial, rime, tone.
// Initials are grouped phonologically, so spelling alternants that are one
// sound (c/k/q, g/gh, ng/ngh) count as the same initial.

export const TONES = ["ngang", "huyền", "sắc", "hỏi", "ngã", "nặng"] as const;
export type Tone = (typeof TONES)[number];

const TONE_MARKS: Record<string, Tone> = {
  "̀": "huyền",
  "́": "sắc",
  "̉": "hỏi",
  "̃": "ngã",
  "̣": "nặng",
};

// High (phù) and low (trầm) registers; ngang/huyền, hỏi/ngã, sắc/nặng are the
// register pairs.
export const REGISTER: Record<Tone, "high" | "low"> = {
  ngang: "high",
  sắc: "high",
  hỏi: "high",
  huyền: "low",
  ngã: "low",
  nặng: "low",
};
export const BANG_TRAC: Record<Tone, "bằng" | "trắc"> = {
  ngang: "bằng",
  huyền: "bằng",
  sắc: "trắc",
  hỏi: "trắc",
  ngã: "trắc",
  nặng: "trắc",
};

const INITIALS = [
  "ngh", "ng", "nh", "ch", "gh", "gi", "kh", "ph", "th", "tr", "qu",
  "b", "c", "d", "đ", "g", "h", "k", "l", "m", "n", "p", "r", "s", "t", "v", "x",
];

const INITIAL_GROUP: Record<string, string> = {
  c: "c/k",
  k: "c/k",
  g: "g/gh",
  gh: "g/gh",
  ng: "ng/ngh",
  ngh: "ng/ngh",
};

const VOWELS = /[aăâeêioôơuưy]/;

export interface Syllable {
  text: string;
  initial: string; // phonological group, "∅" for none
  rime: string; // toneless rime, e.g. "ương"
  tone: Tone;
  checked: boolean; // ends in -p/-t/-c/-ch
}

export function parseSyllable(raw: string): Syllable | null {
  const text = raw.trim().toLowerCase().normalize("NFC");
  if (!text || !/^[a-zà-ỹđ]+$/u.test(text)) return null;

  let tone: Tone = "ngang";
  const base = Array.from(text.normalize("NFD"))
    .filter((c) => {
      const t = TONE_MARKS[c];
      if (t) tone = t;
      return !t;
    })
    .join("")
    .normalize("NFC");

  let initial = "";
  for (const candidate of INITIALS) {
    if (base.startsWith(candidate)) {
      initial = candidate;
      break;
    }
  }
  let rime = base.slice(initial.length);

  // "gi" before a consonant or at the end keeps its vowel: gì = gi + i.
  if (initial === "gi" && !VOWELS.test(rime[0] ?? "")) rime = "i" + rime;
  // "qu" is /kw/: keep "qu" as the onset and leave the rime as written.
  if (!rime || !VOWELS.test(rime)) return null;

  return {
    text,
    initial: INITIAL_GROUP[initial] ?? (initial || "∅"),
    rime,
    tone,
    checked: /(p|t|c|ch)$/.test(rime),
  };
}

export type MatchKind =
  | "identical"
  | "tone only"
  | "initial"
  | "rime"
  | "initial + rime";

export const MATCH_KINDS: MatchKind[] = [
  "identical",
  "tone only",
  "initial",
  "rime",
  "initial + rime",
];

export const MATCH_LABEL: Record<MatchKind, string> = {
  identical: "Identical",
  "tone only": "Tone differs",
  initial: "Initial differs",
  rime: "Rime differs",
  "initial + rime": "Initial & rime differ",
};

// A rime as vowel (with any medial) + final: "ương" → ươ + ng, "ai" → a + i.
// Final semivowels count as finals except in "uy", where y is the vowel.
// Spelling is undone where it encodes vowel length rather than the final:
// "ay" and "au" are short ă + i/u (beside long "ai", "ao"), and final "o"
// is the glide u, so ai/ay and ao/au differ in the vowel, not the final.
export function splitRime(rime: string): { vowel: string; final: string } {
  if (/^u?y[êe]?$/.test(rime) || rime === "uy") return { vowel: rime, final: "" };
  const m = rime.match(/^(.+?)(ng|nh|ch|[ptcmn]|(?<=[aăâeêioôơuưy])[iyou])$/);
  if (!m) return { vowel: rime, final: "" };
  let [, vowel, final] = m;
  if (final === "y") {
    final = "i";
    if (vowel.endsWith("a")) vowel = vowel.slice(0, -1) + "ă";
  } else if (final === "u" && vowel.endsWith("a")) vowel = vowel.slice(0, -1) + "ă";
  else if (final === "o") final = "u";
  return { vowel, final };
}

export interface Comparison {
  kind: MatchKind;
  sameTone: boolean;
  sameRegister: boolean;
  sameInitial: boolean;
  sameRime: boolean;
  sameVowel: boolean;
  sameFinal: boolean;
}

export function compare(nom: Syllable, sv: Syllable): Comparison {
  const sameInitial = nom.initial === sv.initial;
  const sameRime = nom.rime === sv.rime;
  const sameTone = nom.tone === sv.tone;
  let kind: MatchKind;
  if (sameInitial && sameRime) kind = sameTone ? "identical" : "tone only";
  else if (sameRime) kind = "initial";
  else if (sameInitial) kind = "rime";
  else kind = "initial + rime";
  const a = splitRime(nom.rime);
  const b = splitRime(sv.rime);
  return {
    kind,
    sameTone,
    sameRegister: REGISTER[nom.tone] === REGISTER[sv.tone],
    sameInitial,
    sameRime,
    sameVowel: a.vowel === b.vowel,
    sameFinal: a.final === b.final,
  };
}

const KIND_RANK: Record<MatchKind, number> = {
  identical: 0,
  "tone only": 1,
  initial: 2,
  rime: 2,
  "initial + rime": 3,
};

// A phonetic sometimes carries alternative readings ("thiêu|khiêu"); compare
// against whichever is closest to the Nôm reading.
export function bestComparison(
  nomReading: string,
  svReadings: string
): { sv: Syllable; cmp: Comparison } | null {
  const nom = parseSyllable(nomReading);
  if (!nom) return null;
  let best: { sv: Syllable; cmp: Comparison } | null = null;
  for (const alt of svReadings.split("|")) {
    const sv = parseSyllable(alt);
    if (!sv) continue;
    const cmp = compare(nom, sv);
    if (!best || KIND_RANK[cmp.kind] < KIND_RANK[best.cmp.kind]) best = { sv, cmp };
  }
  return best;
}

// How closely an SV reading could have spelled a Nôm syllable, with the rime
// weighted above the initial: Nôm phonetics keep the rime far more reliably
// than the initial (改 cải for khảy, 巾 cân for khăn). Range 0–7.
export function phoneticScore(nomReading: string, svReadings: string | undefined): number {
  const nom = parseSyllable(nomReading);
  if (!nom || !svReadings) return 0;
  let best = 0;
  for (const alt of svReadings.split("|")) {
    const sv = parseSyllable(alt);
    if (!sv) continue;
    let s = sv.initial === nom.initial ? 2 : 0;
    if (sv.rime === nom.rime) s += 4;
    else {
      const a = splitRime(nom.rime);
      const b = splitRime(sv.rime);
      const base = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (a.vowel === b.vowel) s += 1.5;
      else if (base(a.vowel) === base(b.vowel)) s += 0.75;
      if (a.final === b.final) s += 1.5;
    }
    s += sv.tone === nom.tone ? 1 : REGISTER[sv.tone] === REGISTER[nom.tone] ? 0.5 : 0;
    best = Math.max(best, s);
  }
  return best;
}

// How closely an SV reading could have spelled a Nôm syllable, for deciding
// which part of a compound is the phonetic. Initial and rime weigh most;
// a shared final or nucleus earns partial credit.
export function soundScore(nomReading: string, svReadings: string | undefined): number {
  const nom = parseSyllable(nomReading);
  if (!nom || !svReadings) return 0;
  let best = 0;
  for (const alt of svReadings.split("|")) {
    const sv = parseSyllable(alt);
    if (!sv) continue;
    let s = 0;
    if (sv.initial === nom.initial) s += 3;
    if (sv.rime === nom.rime) s += 3;
    else {
      const fin = (r: string) => r.match(/(ng|nh|ch|[ptcmniyou])$/)?.[0] ?? "";
      const nuc = (r: string) => r.replace(/^[uo](?=[aăâeêơ])/, "").match(/[aăâeêioôơuưy]/)?.[0] ?? "";
      if (fin(sv.rime) === fin(nom.rime)) s += 1;
      const base = (v: string) => v.normalize("NFD").charAt(0).replace("y", "i");
      if (nuc(sv.rime) === nuc(nom.rime)) s += 1;
      else if (base(nuc(sv.rime)) === base(nuc(nom.rime))) s += 0.5; // o/ô/ơ, a/ă/â, u/ư …
    }
    if (sv.tone === nom.tone) s += 1;
    else if (REGISTER[sv.tone] === REGISTER[nom.tone]) s += 0.5;
    best = Math.max(best, s);
  }
  return best;
}

// For readings whose rime differs: which part of the rime moved.
export type RimeChange = "vowel" | "final" | "vowel + final";
export function rimeChange(cmp: Comparison): RimeChange | null {
  if (cmp.sameRime) return null;
  if (!cmp.sameVowel && !cmp.sameFinal) return "vowel + final";
  return cmp.sameVowel ? "final" : "vowel";
}
