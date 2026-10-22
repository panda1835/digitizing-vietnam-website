import { loadRecords } from "./records";
import sourceList from "../../../data/nom-explorer/sources.json";
import mcData from "../../../data/nom-explorer/mc.json";
import { bestComparison, parseSyllable, phoneticScore, type Comparison, type Syllable, type Tone } from "./viet";

// ---------------------------------------------------------------------------
// Raw records (data/index.json, built by scripts/build-index.mjs)

export type Role =
  | "member" // F part before its role is inferred
  | "marker" // 亇/个: marks a Nôm reading, spells no sound
  | "semantic"
  | "phonetic"
  | "part"
  | "loan-phonetic"
  | "loan-semantic"
  | "modified";

export interface Part {
  ch: string;
  role: Role;
  src?: string;
  sv?: string;
  basis?: RoleBasis; // how an F part's role was decided
  // In a two-phonetic (D) cluster spelling, which part of the syllable this
  // phonetic spells; absent means the whole syllable.
  seg?: "onset" | "rime";
}

// "sound": one part's SV reading is clearly closer to the Nôm reading.
// "precedent": too close to call by sound; decided by how each component
// behaves in the clear cases. "layout": no evidence either way; the second
// part is taken as phonetic.
// "reviewed": set by a person on the Review page.
export type RoleBasis = "sound" | "precedent" | "layout" | "reviewed";

export interface Analysis {
  codes: string[];
  parts: Part[];
  notes: string[];
  compound: boolean;
  sv?: string;
}

export interface Record {
  c: string; // character
  r: string; // Nôm reading
  s: string; // structure string as printed in the dictionary
  a: Analysis[];
  d: string; // first definition, truncated
  n: number; // citation count
  src: [string, number][]; // citations per source (short title)
}

// ---------------------------------------------------------------------------
// Variant normalization: radical forms and simplified/traditional pairs are
// treated as one component. Mirrors CHAR_NORM in the DVN site's
// src/lib/han-nom/componentsIndex.ts.

const CHAR_NORM: { [k: string]: string } = {
  亻: "人", 刂: "刀", 扌: "手", 忄: "心", 㣺: "心", 氵: "水", 氺: "水",
  灬: "火", 爫: "爪", 牜: "牛", 犭: "犬", 耂: "老", 艹: "艸", 覀: "西",
  襾: "西", 罒: "网", 肀: "聿", 丬: "爿", 攵: "攴", 礻: "示", 衤: "衣",
  纟: "糸", 糹: "糸", 讠: "言", 钅: "金", 饣: "食", 飠: "食", 虫: "蟲",
  尣: "尢", 户: "戶", 戸: "戶", 靑: "青", 鼔: "鼓", 鼡: "鼠", 见: "見",
  贝: "貝", 车: "車", 长: "長", 门: "門", 页: "頁", 风: "風", 飞: "飛",
  马: "馬", 鱼: "魚", 鸟: "鳥", 卤: "鹵", 麦: "麥", 黄: "黃", 黾: "黽",
  齐: "齊", 齿: "齒", 龙: "龍", 竜: "龍", "𬺞": "龜", 韦: "韋", "⺮": "竹",
  釒: "金", "⺼": "肉", "⻍": "辶", "⻌": "辶",
  // Simplified forms the dictionary writes for a named component (廬 → 卢).
  娄: "婁", 礼: "禮", 会: "會", 卢: "盧", 対: "對", 离: "離", 灵: "靈", 荣: "榮",
};

export function normalize(ch: string): string {
  return CHAR_NORM[ch] ?? ch;
}

export function variantsOf(key: string): string[] {
  return [key, ...Object.keys(CHAR_NORM).filter((k) => CHAR_NORM[k] === key)];
}

// ---------------------------------------------------------------------------
// Index

export interface Use {
  rec: Record;
  part: Part;
  analysis: Analysis;
  written: string; // the form as written in this character
  viaSource: boolean; // matched through "source → written" (e.g. 廬 → 卢)
  partner?: Part; // the other part of a compound
}

interface Db {
  records: Record[];
  byChar: Map<string, Record[]>;
  uses: Map<string, Use[]>; // normalized component → uses
  parents: Map<string, Set<string>>; // normalized component → chars containing it
  svOf: Map<string, Map<string, number>>; // normalized char → SV reading counts
}

let db: Db | null = null;

// Reviewed phonetic choices: analysis key → the phonetic character.
let roleOverrides = new Map<string, string>();

export function analysisKey(rec: Record, index: number) {
  return `${rec.c}|${rec.r}|${index}`;
}

// Apply reviewed choices and recompute everything that depends on roles.
export function setRoleOverrides(overrides: Map<string, string>) {
  roleOverrides = overrides;
  db = null;
  statsCache = null;
  pairCache = null;
  variantCache = null;
}

// The dictionary lists an F compound's parts in layout order (口⿰可 but
// 句⿰鳥), so the phonetic has to be identified. Two kinds of evidence:
//  - sound: whose SV reading is closer to the Nôm reading (rime-weighted);
//  - precedent: how each element behaves across the clear cases. 口 is
//    semantic in over a thousand characters, so a chance kh- match with
//    khảy does not make it the phonetic of 𠳚 (口 + 改 cải).
// Strong, contrasting precedent overrules sound unless the sound evidence is
// overwhelming; otherwise clear sound decides, then weaker precedent, then
// layout. Precedent is re-estimated once from the first round's decisions.
function inferRoles(records: Record[]) {
  type Pair = { rec: Record; a: Part; b: Part; sa: number; sb: number };
  const pairs: Pair[] = [];
  const assign = (ph: Part, se: Part, basis: RoleBasis) => {
    ph.role = "phonetic";
    se.role = "semantic";
    ph.basis = se.basis = basis;
  };

  // Start over on a re-run (after a review), so earlier choices don't stick.
  for (const rec of records)
    for (const an of rec.a)
      for (const p of an.parts)
        if (p.basis) {
          p.role = "member";
          delete p.basis;
        }

  const fixed: [Part, Part][] = []; // reviewed: [phonetic, semantic]
  for (const rec of records)
    rec.a.forEach((an, index) => {
      const members = an.parts.filter((p) => p.role === "member");
      if (members.length === 1) members[0].role = "phonetic";
      if (members.length !== 2) return;
      const [a, b] = members;
      const reviewed = roleOverrides.get(analysisKey(rec, index));
      const chosen = reviewed ? members.find((p) => p.ch === reviewed || p.src === reviewed) : undefined;
      if (chosen) {
        const other = chosen === a ? b : a;
        assign(chosen, other, "reviewed");
        fixed.push([chosen, other]);
        return;
      }
      pairs.push({ rec, a, b, sa: phoneticScore(rec.r, a.sv), sb: phoneticScore(rec.r, b.sv) });
    });

  const keyOf = (p: Part) => normalize(p.src ?? p.ch);
  const leanFrom = (decided: [Part, Part][]) => {
    const ph = new Map<string, number>();
    const se = new Map<string, number>();
    for (const [p, s] of decided) {
      ph.set(keyOf(p), (ph.get(keyOf(p)) ?? 0) + 1);
      se.set(keyOf(s), (se.get(keyOf(s)) ?? 0) + 1);
    }
    // −1 always semantic … +1 always phonetic, shrunk toward 0 when rare.
    return (p: Part) => {
      const x = ph.get(keyOf(p)) ?? 0;
      const y = se.get(keyOf(p)) ?? 0;
      return (x - y) / (x + y + 2);
    };
  };

  // Round 1: precedent from clear sound cases only.
  let lean = leanFrom([...fixed, ...pairs.filter((x) => Math.abs(x.sa - x.sb) >= 3).map((x) => (x.sa > x.sb ? [x.a, x.b] : [x.b, x.a]) as [Part, Part])]);
  const decide = () => {
    const out: [Part, Part][] = [...fixed];
    for (const { a, b, sa, sb } of pairs) {
      const sound = sa - sb; // > 0: a sounds more like the phonetic
      const prec = lean(a) - lean(b); // > 0: a behaves more like a phonetic
      let ph: Part, basis: RoleBasis;
      if (Math.abs(prec) >= 0.6 && Math.sign(prec) !== Math.sign(sound) && Math.abs(sound) < 5) {
        ph = prec > 0 ? a : b;
        basis = "precedent";
      } else if (Math.abs(sound) >= 2) {
        ph = sound > 0 ? a : b;
        basis = "sound";
      } else if (Math.abs(prec) >= 0.2) {
        ph = prec > 0 ? a : b;
        basis = "precedent";
      } else if (sound !== 0) {
        ph = sound > 0 ? a : b;
        basis = "sound";
      } else {
        ph = b;
        basis = "layout";
      }
      const se = ph === a ? b : a;
      assign(ph, se, basis);
      out.push([ph, se]);
    }
    return out;
  };
  // Round 2: re-estimate precedent from round 1's decisions and decide again.
  lean = leanFrom(decide());
  decide();
}

// Two-phonetic compounds that spell an old cluster (𪩮 trăng = 巴 b- + 夌
// lăng): one element gives the onset, the other the rime. These are the D2
// (head + modifier) compounds, and D1 ones the dictionary marks with a
// cluster note. The rime element is the one read with l- (the cluster's
// second consonant) when a note names a cluster, otherwise the one whose
// rime and tone are closer to the Nôm reading.
export const CLUSTER_NOTE = /(^|[^a-zđ])\*?[a-zđʔ]{1,2}[lr]-/;

function rimeScore(reading: string, sv?: string): number {
  const best = sv ? bestComparison(reading, sv) : null;
  if (!best) return 0;
  const c = best.cmp;
  return (c.sameRime ? 3 : (c.sameVowel ? 1 : 0) + (c.sameFinal ? 1 : 0)) + (c.sameTone ? 1 : c.sameRegister ? 0.5 : 0);
}

// Reading marks (dấu cá) that sit in a D compound but spell no sound.
const MARKS = new Set(["亇", "个"]);

function twoPhonetics(an: Analysis): [Part, Part] | null {
  const ph = an.parts.filter((p) => p.role === "phonetic");
  return ph.length === 2 && an.codes[0].startsWith("D") ? [ph[0], ph[1]] : null;
}

function assignSegments(records: Record[]) {
  const pending: { rec: Record; an: Analysis; index: number; a: Part; b: Part; cluster: boolean }[] = [];
  for (const rec of records)
    rec.a.forEach((an, index) => {
      for (const p of an.parts) {
        delete p.seg;
        if (p.role === "marker") p.role = "phonetic";
      }
      for (const p of an.parts) if (p.role === "phonetic" && MARKS.has(p.src ?? p.ch) && an.codes[0].startsWith("D")) p.role = "marker";
      const pair = twoPhonetics(an);
      if (pair) pending.push({ rec, an, index, a: pair[0], b: pair[1], cluster: an.notes.some((n) => CLUSTER_NOTE.test(n)) });
    });

  const isL = (p: Part) => (p.sv ?? "").split("|").some((r) => parseSyllable(r)?.initial === "l");
  const split = (rec: Record, a: Part, b: Part, cluster: boolean): Part => {
    if (cluster && isL(a) !== isL(b)) return isL(a) ? b : a;
    const sa = rimeScore(rec.r, a.sv);
    const sb = rimeScore(rec.r, b.sv);
    return sa > sb ? b : a; // the onset is the element with the weaker rime
  };

  // Cluster onsets attested by the dictionary's own notes.
  const noted = new Map<string, number>();
  for (const x of pending)
    if (x.cluster && x.an.codes[0] !== "D1|F1") {
      const onset = split(x.rec, x.a, x.b, true);
      const k = normalize(onset.src ?? onset.ch);
      noted.set(k, (noted.get(k) ?? 0) + 1);
    }

  for (const { rec, an, index, a, b, cluster } of pending) {
    const reviewed = roleOverrides.get(analysisKey(rec, index) + "|onset");
    let onset: Part | null = null;
    if (reviewed !== undefined) onset = [a, b].find((p) => p.ch === reviewed || p.src === reviewed) ?? null;
    else {
      const guess = split(rec, a, b, cluster);
      const established = (noted.get(normalize(guess.src ?? guess.ch)) ?? 0) >= 2;
      if (cluster || (an.codes[0] === "D2" && established)) onset = guess;
    }
    if (!onset) continue;
    onset.seg = "onset";
    (onset === a ? b : a).seg = "rime";
  }
}

// A few structure lines give the two readings in the opposite order to the
// characters ("F1: mục 末⿰目 mạt", where 目 is mục and 末 mạt). Each
// character's reading elsewhere in the dictionary shows this: when the
// readings fit the characters much better crossed than straight, swap them.
export interface LabelFix {
  char: string;
  reading: string;
  struct: string;
}
export let labelFixes: LabelFix[] = [];

function fixSwappedLabels(records: Record[]) {
  const seen = new Map<string, Map<string, number>>();
  const note = (g: string, sv: string | undefined, w: number) => {
    if (!sv) return;
    const m = seen.get(g) ?? new Map<string, number>();
    m.set(sv, (m.get(sv) ?? 0) + w);
    seen.set(g, m);
  };
  for (const rec of records)
    for (const an of rec.a) {
      if (!an.compound) note(rec.c, an.sv, 3); // a character's own entry
      for (const p of an.parts) note(p.src ?? p.ch, p.sv, 1);
    }
  const support = (g: string, sv?: string) => {
    const m = seen.get(g);
    if (!m || !sv) return 0;
    let total = 0;
    for (const n of m.values()) total += n;
    return (m.get(sv) ?? 0) / total;
  };
  const fixes: LabelFix[] = [];
  for (const rec of records)
    for (const an of rec.a) {
      const ps = an.parts.filter((p) => p.sv);
      if (!an.compound || ps.length !== 2 || (an as { swapped?: boolean }).swapped) continue;
      const [a, b] = ps;
      const ga = a.src ?? a.ch;
      const gb = b.src ?? b.ch;
      const straight = support(ga, a.sv) + support(gb, b.sv);
      const crossed = support(ga, b.sv) + support(gb, a.sv);
      if (crossed > straight + 0.5) {
        [a.sv, b.sv] = [b.sv, a.sv];
        (an as { swapped?: boolean }).swapped = true;
        fixes.push({ char: rec.c, reading: rec.r, struct: rec.s });
      }
    }
  if (fixes.length) labelFixes = fixes;
}

export function getDb(): Db {
  if (db) return db;
  const records = loadRecords() as Record[];
  fixSwappedLabels(records);
  inferRoles(records);
  assignSegments(records);
  const byChar = new Map<string, Record[]>();
  const uses = new Map<string, Use[]>();
  const parents = new Map<string, Set<string>>();
  const svOf = new Map<string, Map<string, number>>();

  const push = <K, V>(m: Map<K, V[]>, k: K, v: V) => {
    const list = m.get(k);
    if (list) list.push(v);
    else m.set(k, [v]);
  };
  const countSv = (ch: string, sv?: string) => {
    if (!sv) return;
    const key = normalize(ch);
    const m = svOf.get(key) ?? new Map<string, number>();
    m.set(sv, (m.get(sv) ?? 0) + 1);
    svOf.set(key, m);
  };

  for (const rec of records) {
    push(byChar, rec.c, rec);
    for (const analysis of rec.a) {
      if (!analysis.compound && analysis.sv) countSv(rec.c, analysis.sv);
      for (const part of analysis.parts) {
        const partner = analysis.compound
          ? analysis.parts.find((p) => p !== part)
          : undefined;
        const forms = [{ key: normalize(part.ch), viaSource: false }];
        if (part.src && normalize(part.src) !== normalize(part.ch))
          forms.push({ key: normalize(part.src), viaSource: true });
        for (const { key, viaSource } of forms) {
          if (key === normalize(rec.c)) continue;
          push(uses, key, { rec, part, analysis, written: part.ch, viaSource, partner });
          const set = parents.get(key) ?? new Set<string>();
          set.add(rec.c);
          parents.set(key, set);
        }
        countSv(part.src ?? part.ch, part.sv);
      }
    }
  }

  db = { records, byChar, uses, parents, svOf };
  return db;
}

export function svReadings(ch: string): string[] {
  const m = getDb().svOf.get(normalize(ch));
  if (!m) return [];
  // Keep the readings that recur; one-off labels are usually a slip in a
  // single structure line.
  const ranked = Array.from(m.entries()).sort((a, b) => b[1] - a[1]);
  const floor = Math.max(2, 0.05 * ranked[0][1]);
  return [ranked[0], ...ranked.slice(1).filter(([, n]) => n >= floor)].map(([r]) => r);
}

// ---------------------------------------------------------------------------
// Component analysis

export interface PhoneticUse {
  rec: Record;
  char: string;
  reading: string;
  sv: string;
  code: string;
  written: string;
  viaSource: boolean;
  semantic?: string; // semantic partner for F compounds
  partnerRole?: Role;
  notes: string[];
  def: string;
  cites: number;
  wholeLoan: boolean;
  basis?: RoleBasis;
  seg?: "onset" | "rime";
  partner?: Part; // the other element of a compound
  mc: McInfo | null;
  nom: Syllable | null;
  svSyl: Syllable | null;
  cmp: Comparison | null;
}

export interface DeepUse {
  char: string;
  readings: string[];
  path: string[]; // component → … → char
  depth: number;
}

export interface ComponentReport {
  key: string;
  forms: string[]; // written forms seen
  sv: string[];
  phonetic: PhoneticUse[];
  semantic: Use[];
  other: Use[]; // G modifications, A/B loans, unlabelled parts
  ownLoans: PhoneticUse[]; // the component itself borrowed for sound (C1/C2)
  ownRecords: Record[];
  deep: DeepUse[];
  directChars: number;
}

function toPhonetic(use: {
  rec: Record;
  analysis: Analysis;
  part?: Part;
  sv?: string;
  written: string;
  viaSource: boolean;
  partner?: Part;
  wholeLoan: boolean;
}): PhoneticUse {
  const sv = use.sv ?? svReadings(use.written)[0] ?? "";
  const best = sv ? bestComparison(use.rec.r, sv) : null;
  return {
    rec: use.rec,
    char: use.rec.c,
    reading: use.rec.r,
    sv,
    code: use.analysis.codes.join("|"),
    written: use.written,
    viaSource: use.viaSource,
    semantic: use.partner?.ch,
    partnerRole: use.partner?.role,
    notes: use.analysis.notes,
    def: use.rec.d,
    cites: use.rec.n,
    wholeLoan: use.wholeLoan,
    basis: use.part?.basis,
    seg: use.part?.seg,
    partner: use.partner,
    mc: mcFor([use.part?.src, use.written], sv),
    nom: parseSyllable(use.rec.r),
    svSyl: best?.sv ?? null,
    cmp: best?.cmp ?? null,
  };
}

export function analyzeComponent(input: string): ComponentReport {
  const { uses, parents, byChar } = getDb();
  const key = normalize(input);
  const list = uses.get(key) ?? [];

  const phonetic: PhoneticUse[] = [];
  const semantic: Use[] = [];
  const other: Use[] = [];
  for (const u of list) {
    if (u.part.role === "phonetic" || u.part.role === "loan-phonetic")
      phonetic.push(
        toPhonetic({ ...u, sv: u.part.sv, wholeLoan: u.part.role === "loan-phonetic" })
      );
    else if (u.part.role === "semantic") semantic.push(u);
    else other.push(u);
  }

  // The component used whole for its sound (C1/C2), e.g. 工 read cong, trong.
  const ownRecords = variantsOf(key).flatMap((v) => byChar.get(v) ?? []);
  const ownLoans: PhoneticUse[] = [];
  for (const rec of ownRecords)
    for (const analysis of rec.a)
      if (analysis.codes.some((c) => c.startsWith("C")) && !analysis.parts.length)
        ownLoans.push(
          toPhonetic({ rec, analysis, sv: analysis.sv, written: rec.c, viaSource: false, wholeLoan: true })
        );

  // Characters that contain the component at a deeper level, following the
  // dictionary's own analyses through intermediate Nôm characters.
  const direct = parents.get(key) ?? new Set<string>();
  const seen = new Set<string>([key, ...direct]);
  const deep: DeepUse[] = [];
  let frontier = Array.from(direct).map((c) => ({ char: c, path: [key, c] }));
  for (let depth = 2; depth <= 4 && frontier.length; depth++) {
    const next: typeof frontier = [];
    for (const { char, path } of frontier) {
      for (const parent of parents.get(normalize(char)) ?? []) {
        if (seen.has(parent)) continue;
        seen.add(parent);
        const p = [...path, parent];
        next.push({ char: parent, path: p });
        deep.push({
          char: parent,
          readings: Array.from(new Set((byChar.get(parent) ?? []).map((r) => r.r))),
          path: p,
          depth,
        });
      }
    }
    frontier = next;
  }

  const forms = Array.from(new Set(list.map((u) => u.written)));
  return {
    key,
    forms,
    sv: svReadings(key),
    phonetic,
    semantic,
    other,
    ownLoans,
    ownRecords,
    deep,
    directChars: direct.size,
  };
}

// ---------------------------------------------------------------------------
// Corpus-wide statistics for the insights page

export interface ComponentStat {
  key: string;
  chars: number;
  records: number;
  readings: number;
  initials: number;
  rimes: number;
  sv: string;
  faithful: number; // share identical or tone-only
}

let statsCache: {
  phonetic: ComponentStat[];
  semantic: ComponentStat[];
} | null = null;

export function componentStats() {
  if (statsCache) return statsCache;
  const { uses } = getDb();
  const phonetic: ComponentStat[] = [];
  const semantic: ComponentStat[] = [];
  for (const [key, all] of uses) {
    // Rank each use under the component the dictionary names, so that a
    // substituted form (礼 written for 禮) does not double the count.
    const list = all.filter((u) => normalize(u.part.src ?? u.part.ch) === key);
    const ph = list.filter((u) => u.part.role === "phonetic");
    const se = list.filter((u) => u.part.role === "semantic");
    if (ph.length) {
      const sv = svReadings(key)[0] ?? "";
      const comps = ph
        .filter((u) => u.part.seg !== "onset")
        .map((u) => bestComparison(u.rec.r, u.part.sv ?? sv))
        .filter((x): x is NonNullable<typeof x> => !!x);
      const nomSyls = ph.map((u) => u.rec.r);
      const initials = new Set<string>();
      const rimes = new Set<string>();
      for (const r of nomSyls) {
        const syl = parseSyllable(r);
        if (syl) initials.add(syl.initial), rimes.add(syl.rime);
      }
      phonetic.push({
        key,
        chars: new Set(ph.map((u) => u.rec.c)).size,
        records: ph.length,
        readings: new Set(nomSyls).size,
        initials: initials.size,
        rimes: rimes.size,
        sv,
        faithful: comps.length
          ? comps.filter((c) => c.cmp.kind === "identical" || c.cmp.kind === "tone only").length /
            comps.length
          : 0,
      });
    }
    if (se.length)
      semantic.push({
        key,
        chars: new Set(se.map((u) => u.rec.c)).size,
        records: se.length,
        readings: new Set(se.map((u) => u.rec.r)).size,
        initials: 0,
        rimes: 0,
        sv: svReadings(key)[0] ?? "",
        faithful: 0,
      });
  }
  phonetic.sort((a, b) => b.chars - a.chars);
  semantic.sort((a, b) => b.chars - a.chars);
  statsCache = { phonetic, semantic };
  return statsCache;
}

export function dvnLookupUrl(ch: string) {
  return `https://www.digitizingvietnam.com/en/tools/han-nom-dictionaries/general?q=${encodeURIComponent(ch)}`;
}

// ---------------------------------------------------------------------------
// Every phonetic relation in the dictionary: compound phonetics (F, D) and
// characters borrowed whole for sound (C), one row per char + reading + phonetic.

export interface PhoneticPair {
  char: string;
  reading: string;
  comp: string;
  written: string;
  sv: string;
  code: string;
  notes: string[];
  whole: boolean;
  seg?: "onset" | "rime";
  mc: McInfo | null;
  nom: Syllable | null;
  svSyl: Syllable | null;
  cmp: Comparison | null;
}

let pairCache: PhoneticPair[] | null = null;

export function allPhoneticPairs(): PhoneticPair[] {
  if (pairCache) return pairCache;
  const out = new Map<string, PhoneticPair>();
  const add = (
    rec: Record,
    analysis: Analysis,
    comp: string,
    written: string,
    sv: string | undefined,
    whole: boolean,
    seg?: "onset" | "rime"
  ) => {
    const svr = sv ?? svReadings(comp)[0] ?? "";
    const key = `${rec.c}|${rec.r}|${comp}`;
    if (out.has(key)) return;
    const best = svr ? bestComparison(rec.r, svr) : null;
    out.set(key, {
      char: rec.c,
      reading: rec.r,
      comp,
      written,
      sv: svr,
      code: analysis.codes.join("|"),
      notes: analysis.notes,
      whole,
      seg,
      mc: mcFor([comp, written], svr),
      nom: parseSyllable(rec.r),
      svSyl: best?.sv ?? null,
      cmp: best?.cmp ?? null,
    });
  };
  for (const rec of getDb().records)
    for (const analysis of rec.a) {
      if (analysis.codes.some((c) => c.startsWith("C")) && !analysis.compound)
        add(rec, analysis, normalize(analysis.parts[0]?.ch ?? rec.c), rec.c, analysis.sv, true);
      for (const part of analysis.parts)
        if (part.role === "phonetic")
          add(rec, analysis, normalize(part.src ?? part.ch), part.ch, part.sv, false, part.seg);
    }
  pairCache = Array.from(out.values());
  return pairCache;
}

// ---------------------------------------------------------------------------
// Sources and dating (data/sources.json, transcribed from the dictionary's
// source notes in tdcndg_refs.xml)

export interface Source {
  short: string;
  title: string;
  hn: string;
  composed: number | null; // approximate year the work or its Nôm version was made
  composedBasis: string;
  copy: number | null; // year of the copy or edition the dictionary quotes
  copyBasis: string;
  check?: string; // inconsistency found in the dictionary's note
}

export const SOURCES = sourceList as Source[];
const sourceByShort = new Map(SOURCES.map((s) => [s.short, s]));

export function sourceInfo(short: string): Source | undefined {
  return sourceByShort.get(short);
}

export { PERIODS, periodOf, type DateMode, type SourceCount } from "./periods";
import type { DateMode, SourceCount } from "./periods";

// Citations for a set of entries, per source.
export function attestation(records: Record[]): SourceCount[] {
  const m = new Map<string, { cites: number; chars: Set<string> }>();
  for (const rec of records)
    for (const [short, n] of rec.src ?? []) {
      const e = m.get(short) ?? { cites: 0, chars: new Set<string>() };
      e.cites += n;
      e.chars.add(rec.c);
      m.set(short, e);
    }
  return Array.from(m, ([short, e]) => ({
    short,
    cites: e.cites,
    chars: e.chars.size,
    composed: sourceInfo(short)?.composed ?? null,
    copy: sourceInfo(short)?.copy ?? null,
  })).sort((a, b) => b.cites - a.cites);
}

// The earliest dated source quoting an entry.
export function earliest(rec: Record, mode: DateMode = "copy"): { short: string; year: number } | null {
  let best: { short: string; year: number } | null = null;
  for (const [short] of rec.src ?? []) {
    const year = sourceInfo(short)?.[mode];
    if (year != null && (!best || year < best.year)) best = { short, year };
  }
  return best;
}

// ---------------------------------------------------------------------------
// One syllable: every character the dictionary reads that way

export interface Spelling {
  rec: Record;
  analysis: Analysis;
  phonetic?: Part;
  onset?: Part; // a cluster element that gives only the initial
  semantic?: Part;
  code: string;
}

// How one entry spells its syllable, from its first (main) analysis. A C-type
// loan is its own phonetic.
function spellingOf(rec: Record): Spelling | null {
  const analysis = rec.a[0];
  if (!analysis) return null;
  const phonetic =
    analysis.parts.find((p) => (p.role === "phonetic" && p.seg !== "onset") || p.role === "loan-phonetic") ??
    (analysis.codes.some((c) => c.startsWith("C")) ? { ch: rec.c, role: "loan-phonetic" as Role, sv: analysis.sv } : undefined);
  return {
    rec,
    analysis,
    phonetic,
    onset: analysis.parts.find((p) => p.seg === "onset"),
    semantic: analysis.parts.find((p) => p.role === "semantic"),
    code: analysis.codes.join("|"),
  };
}

export function spellingsOf(reading: string): Spelling[] {
  return getDb()
    .records.filter((rec) => rec.r === reading)
    .map(spellingOf)
    .filter((x): x is Spelling => !!x);
}

// ---------------------------------------------------------------------------
// Variant spellings: different characters the dictionary gives the same
// reading and the same gloss, i.e. one word written more than one way.

export type VariantKind =
  | "semantic added"
  | "phonetic varies"
  | "semantic varies"
  | "both vary"
  | "same parts"
  | "different strategies";

export const VARIANT_KINDS: VariantKind[] = [
  "semantic added",
  "phonetic varies",
  "semantic varies",
  "both vary",
  "same parts",
  "different strategies",
];

export const VARIANT_LABEL: { [k in VariantKind]: string } = {
  "semantic added": "Sound loan alongside the same phonetic with a semantic element added",
  "phonetic varies": "Same semantic element (or none), different phonetic",
  "semantic varies": "Same phonetic, different semantic elements",
  "both vary": "Both elements differ",
  "same parts": "Same elements, different form (layout, simplification)",
  "different strategies": "A spelling without a phonetic (meaning loan, modified or meaning compound) beside others",
};

export interface VariantGroup {
  reading: string;
  gloss: string;
  members: Spelling[];
  kind: VariantKind;
  cites: number;
}

let variantCache: VariantGroup[] | null = null;

export function variantGroups(): VariantGroup[] {
  if (variantCache) return variantCache;
  const groups = new Map<string, Spelling[]>();
  for (const rec of getDb().records) {
    const sp = rec.d ? spellingOf(rec) : null;
    if (!sp) continue;
    const k = `${rec.r}|${rec.d}`;
    const list = groups.get(k) ?? [];
    if (!list.some((x) => x.rec.c === rec.c)) list.push(sp);
    groups.set(k, list);
  }
  const key = (p?: Part) => (p ? normalize(p.src ?? p.ch) : "");
  variantCache = Array.from(groups.values())
    .filter((members) => members.length > 1)
    .map((members) => {
      const phon = new Set(members.map((m) => key(m.phonetic)));
      const sem = new Set(members.map((m) => key(m.semantic)));
      let kind: VariantKind;
      if (members.some((m) => !m.phonetic)) kind = "different strategies";
      else if (phon.size === 1 && sem.size === 1) kind = "same parts";
      else if (phon.size === 1) kind = sem.has("") ? "semantic added" : "semantic varies";
      else if (sem.size === 1) kind = "phonetic varies";
      else kind = "both vary";
      return {
        reading: members[0].rec.r,
        gloss: members[0].rec.d,
        members,
        kind,
        cites: members.reduce((n, m) => n + m.rec.n, 0),
      };
    })
    .sort((a, b) => b.cites - a.cites);
  return variantCache;
}

// ---------------------------------------------------------------------------
// Review: F analyses whose phonetic was not settled by sound

export interface ReviewItem {
  kind: "phonetic" | "onset";
  key: string;
  char: string;
  reading: string;
  struct: string;
  code: string;
  parts: { ch: string; src?: string; sv?: string }[];
  phonetic: string; // phonetic kind: the part taken as phonetic; onset kind: the part taken as initial only ("" = neither)
  basis: RoleBasis;
  cites: number;
  gloss: string;
}

export function reviewItems(): ReviewItem[] {
  const out: ReviewItem[] = [];
  for (const rec of getDb().records)
    rec.a.forEach((an, i) => {
      const ph = an.parts.find((p) => p.basis && p.role === "phonetic");
      if (!ph || ph.basis === "sound") return;
      out.push({
        kind: "phonetic",
        key: analysisKey(rec, i),
        char: rec.c,
        reading: rec.r,
        struct: rec.s,
        code: an.codes.join("|"),
        parts: an.parts.map((p) => ({ ch: p.ch, src: p.src, sv: p.sv })),
        phonetic: ph.ch,
        basis: ph.basis!,
        cites: rec.n,
        gloss: rec.d,
      });
    });
  return out.sort((a, b) => b.cites - a.cites);
}

// Two-phonetic compounds: which element, if either, spells only the initial.
export function onsetReviewItems(): ReviewItem[] {
  const out: ReviewItem[] = [];
  for (const rec of getDb().records)
    rec.a.forEach((an, i) => {
      const pair = twoPhonetics(an);
      if (!pair) return;
      const key = analysisKey(rec, i) + "|onset";
      const onset = pair.find((p) => p.seg === "onset");
      out.push({
        kind: "onset",
        key,
        char: rec.c,
        reading: rec.r,
        struct: rec.s,
        code: an.codes.join("|") + (an.notes.length ? ` [${an.notes.join("; ")}]` : ""),
        parts: pair.map((p) => ({ ch: p.ch, src: p.src, sv: p.sv })),
        phonetic: onset?.ch ?? "",
        basis: roleOverrides.has(key) ? "reviewed" : an.notes.some((n) => CLUSTER_NOTE.test(n)) ? "sound" : "precedent",
        cites: rec.n,
        gloss: rec.d,
      });
    });
  return out.sort((a, b) => b.cites - a.cites);
}

// ---------------------------------------------------------------------------
// Middle Chinese (Guangyun readings via tshet-uinh; data/mc.json)

interface McReading {
  tone: "平" | "上" | "去" | "入";
  voice: "全清" | "次清" | "全濁" | "次濁";
  initial: string;
  desc: string; // e.g. 幫二麻平
  fanqie: string;
}

// Tone classes by tone and initial: voiceless (清, aspirated or not),
// sonorant (次濁) and voiced obstruent (全濁), the three-way split that
// Sino-Vietnamese tone follows.
export const MC_CLASSES = [
  "平清", "平次濁", "平全濁",
  "上清", "上次濁", "上全濁",
  "去清", "去次濁", "去全濁",
  "入清", "入次濁", "入全濁",
] as const;
export type McClass = (typeof MC_CLASSES)[number];

// The regular Sino-Vietnamese tone for each class: sonorants pattern with
// voiceless initials in 平 (龍 long) but with voiced ones in 去 and 入 (例 lệ,
// 月 nguyệt); 上 sonorants give ngã (馬 mã), voiced obstruents mostly nặng.
export const MC_SV_TONE: { [k in McClass]: Tone[] } = {
  平清: ["ngang"],
  平次濁: ["ngang"],
  平全濁: ["huyền"],
  上清: ["hỏi"],
  上次濁: ["ngã"],
  上全濁: ["nặng", "ngã"],
  去清: ["sắc"],
  去次濁: ["nặng"],
  去全濁: ["nặng"],
  入清: ["sắc"],
  入次濁: ["nặng"],
  入全濁: ["nặng"],
};

function mcClass(r: McReading): McClass {
  const voice = r.voice.endsWith("清") ? "清" : r.voice;
  return `${r.tone}${voice}` as McClass;
}

export interface McInfo {
  cls: McClass;
  desc: string;
  fanqie: string;
  // "regular": the SV reading's tone is this class's regular reflex.
  // "irregular": only one class available and the SV tone doesn't fit it.
  // "ambiguous": several readings, none fitting; the first is shown.
  fit: "regular" | "irregular" | "ambiguous";
}

const MC = mcData as { [ch: string]: McReading[] };

export function mcReadings(ch: string): McReading[] {
  return MC[ch] ?? MC[normalize(ch)] ?? [];
}

// The Guangyun reading of a phonetic that matches the SV reading the
// dictionary gives it: the one whose class regularly yields that SV tone.
export function mcFor(chars: (string | undefined)[], sv: string | undefined): McInfo | null {
  let readings: McReading[] = [];
  for (const ch of chars) if (ch && !readings.length) readings = mcReadings(ch);
  if (!readings.length) return null;
  const svTones = (sv ?? "").split("|").map((x) => parseSyllable(x)?.tone).filter(Boolean) as Tone[];
  const fitting = readings.find((r) => MC_SV_TONE[mcClass(r)].some((t) => svTones.includes(t)));
  const r = fitting ?? readings[0];
  const classes = new Set(readings.map(mcClass));
  return {
    cls: mcClass(r),
    desc: r.desc,
    fanqie: r.fanqie,
    fit: fitting ? "regular" : classes.size === 1 ? "irregular" : "ambiguous",
  };
}
