"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Volume2 } from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const TONES = [
  {
    number: 1,
    nameVi: "Thanh ngang",
    nameEn: "Level / Mid",
    mark: "(none)",
    markChar: "",
    ipaHanoi: "˧ (mid level)",
    ipaSaigon: "˧ (mid level)",
    contour: "flat",
    exampleWord: "ma",
    exampleMeaning: "ghost",
    color: "text-stone-700 bg-stone-100 border-stone-300",
    dot: "bg-stone-400",
  },
  {
    number: 2,
    nameVi: "Thanh huyền",
    nameEn: "Falling / Grave",
    mark: "`  (grave accent)",
    markChar: "`",
    ipaHanoi: "˨˩ (low falling)",
    ipaSaigon: "˨˩ (low falling)",
    contour: "falling",
    exampleWord: "mà",
    exampleMeaning: "but / however",
    color: "text-blue-700 bg-blue-50 border-blue-200",
    dot: "bg-blue-400",
  },
  {
    number: 3,
    nameVi: "Thanh sắc",
    nameEn: "Rising / Acute",
    mark: "´  (acute accent)",
    markChar: "´",
    ipaHanoi: "˧˥ (high rising)",
    ipaSaigon: "˧˥ (high rising)",
    contour: "rising",
    exampleWord: "má",
    exampleMeaning: "cheek / mother (informal)",
    color: "text-green-700 bg-green-50 border-green-200",
    dot: "bg-green-500",
  },
  {
    number: 4,
    nameVi: "Thanh hỏi",
    nameEn: "Dipping / Hook",
    mark: "?  (hook above)",
    markChar: "?",
    ipaHanoi: "˧˩˧ (dipping)",
    ipaSaigon: "˨˩ (merged with huyền in South)",
    contour: "dipping",
    exampleWord: "mả",
    exampleMeaning: "grave / tomb",
    color: "text-amber-700 bg-amber-50 border-amber-200",
    dot: "bg-amber-500",
  },
  {
    number: 5,
    nameVi: "Thanh ngã",
    nameEn: "Broken Rising / Tilde",
    mark: "~  (tilde)",
    markChar: "~",
    ipaHanoi: "˧˩ʔ˥ (creaky rising)",
    ipaSaigon: "˧˥ (merged with sắc in South)",
    contour: "broken-rising",
    exampleWord: "mã",
    exampleMeaning: "horse / code",
    color: "text-purple-700 bg-purple-50 border-purple-200",
    dot: "bg-purple-500",
  },
  {
    number: 6,
    nameVi: "Thanh nặng",
    nameEn: "Heavy / Dot Below",
    mark: ".  (dot below)",
    markChar: ".",
    ipaHanoi: "˨˩ʔ (low glottalised)",
    ipaSaigon: "˨˩ (low falling, less glottal)",
    contour: "heavy",
    exampleWord: "mạ",
    exampleMeaning: "rice seedling",
    color: "text-red-700 bg-red-50 border-red-200",
    dot: "bg-red-500",
  },
];

const ALPHABET = [
  { letter: "A a", note: "Like 'ah'" },
  { letter: "Ă ă", note: "Short 'a', like 'u' in 'cut'" },
  { letter: "Â â", note: "Short, central vowel" },
  { letter: "B b", note: "Like English 'b'" },
  { letter: "C c", note: "Like 'k'" },
  { letter: "D d", note: "North: like 'y'; South: like 'z'" },
  { letter: "Đ đ", note: "Like English 'd'" },
  { letter: "E e", note: "Like 'e' in 'bed'" },
  { letter: "Ê ê", note: "Like 'a' in 'they'" },
  { letter: "G g", note: "Like English 'g'" },
  { letter: "H h", note: "Like English 'h'" },
  { letter: "I i", note: "Like 'ee'" },
  { letter: "K k", note: "Like English 'k'" },
  { letter: "L l", note: "Like English 'l'" },
  { letter: "M m", note: "Like English 'm'" },
  { letter: "N n", note: "Like English 'n'" },
  { letter: "O o", note: "Like 'aw'" },
  { letter: "Ô ô", note: "Like 'o' in 'go'" },
  { letter: "Ơ ơ", note: "Like 'er' (no 'r' sound)" },
  { letter: "P p", note: "Only in loanwords" },
  { letter: "Q q", note: "Always with 'u' → 'qu'" },
  { letter: "R r", note: "North: like 'z'; South: rolled 'r'" },
  { letter: "S s", note: "North: like 'sh'; South: like 's'" },
  { letter: "T t", note: "Like English 't' (unaspirated)" },
  { letter: "U u", note: "Like 'oo'" },
  { letter: "Ư ư", note: "Like 'u' with lips unrounded" },
  { letter: "V v", note: "North: like 'v'; South: like 'y'" },
  { letter: "X x", note: "Like English 's'" },
  { letter: "Y y", note: "Like 'ee' (vowel use)" },
];

const DIGRAPHS = [
  { combo: "ch", sound: "/c/" , note: "Like 'ch' in 'chair' (initial); like 'k' (final)" },
  { combo: "gh", sound: "/ɣ/", note: "Like a voiced 'g', before i/e/ê" },
  { combo: "gi", sound: "/z/ or /j/", note: "North: 'z'; South: 'y'" },
  { combo: "kh", sound: "/x/", note: "Like 'ch' in Scottish 'loch'" },
  { combo: "ng", sound: "/ŋ/", note: "Like 'ng' in 'sing' — can start a word!" },
  { combo: "ngh", sound: "/ŋ/", note: "Same as ng, used before i/e/ê" },
  { combo: "nh", sound: "/ɲ/", note: "Like 'ny' in 'canyon'" },
  { combo: "ph", sound: "/f/", note: "Like English 'f'" },
  { combo: "qu", sound: "/kw/", note: "Like English 'qu'" },
  { combo: "th", sound: "/tʰ/", note: "Aspirated 't' — NOT like English 'th'" },
  { combo: "tr", sound: "/ʈ͡ʂ/ or /tɕ/", note: "North: retroflex; South: like 'ch'" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function SpeakButton({ text, className = "" }: { text: string; className?: string }) {
  const [playing, setPlaying] = useState(false);

  const speak = () => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "vi-VN";
    u.rate = 0.8;
    setPlaying(true);
    u.onend = () => setPlaying(false);
    window.speechSynthesis.speak(u);
  };

  return (
    <button
      onClick={speak}
      title={`Play: ${text}`}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
        playing
          ? "bg-red-100 text-red-700"
          : "bg-stone-100 hover:bg-stone-200 text-stone-600"
      } ${className}`}
    >
      <Volume2 className="w-3 h-3" />
      {playing ? "Playing…" : "Play"}
    </button>
  );
}

function ToneContourSVG({ contour }: { contour: string }) {
  const paths: Record<string, string> = {
    flat:          "M 10 30 L 70 30",
    falling:       "M 10 10 L 70 50",
    rising:        "M 10 50 L 70 10",
    dipping:       "M 10 25 Q 40 55 70 20",
    "broken-rising": "M 10 30 Q 35 50 45 40 L 70 10",
    heavy:         "M 10 20 L 55 50",
  };
  return (
    <svg viewBox="0 0 80 60" className="w-16 h-10" aria-hidden>
      <path d={paths[contour] ?? paths.flat} stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OrthographyPage() {
  const [activeSection, setActiveSection] = useState<"tones" | "alphabet" | "digraphs">("tones");

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link
          href="../course"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 mb-8 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Course
        </Link>

        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-widest text-red-700 mb-2">
            Reference
          </div>
          <h1 className="text-3xl font-bold text-stone-900">Vietnamese Orthography</h1>
          <p className="text-stone-500 mt-2 max-w-2xl">
            Vietnamese is written in a Latin-based script with tone marks and additional diacritics.
            Click <Volume2 className="inline w-3.5 h-3.5 mb-0.5" /> to hear any example pronounced.
          </p>
        </div>

        {/* Section tabs */}
        <div className="flex border-b border-stone-200 mb-8 gap-0">
          {(["tones", "alphabet", "digraphs"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              className={`px-5 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeSection === s
                  ? "border-red-700 text-red-700"
                  : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
            >
              {s === "tones" ? "The 6 Tones" : s === "alphabet" ? "Alphabet" : "Digraphs"}
            </button>
          ))}
        </div>

        {/* ── Tones section ── */}
        {activeSection === "tones" && (
          <div className="space-y-4">
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              <strong>Key insight:</strong> Every Vietnamese syllable carries exactly one of six tones.
              Changing the tone changes the meaning entirely — "ma" can mean six different things!
              Southern Vietnamese merges tones <em>hỏi+huyền</em> and <em>ngã+sắc</em>, leaving four
              distinct tones in everyday Saigon speech.
            </div>

            {TONES.map((tone) => (
              <div
                key={tone.number}
                className={`rounded-xl border p-5 ${tone.color}`}
              >
                <div className="flex items-start gap-5 flex-wrap">
                  {/* Example word + play */}
                  <div className="text-center shrink-0">
                    <div className="text-5xl font-bold mb-1">{tone.exampleWord}</div>
                    <div className="text-xs opacity-70 mb-2">"{tone.exampleMeaning}"</div>
                    <SpeakButton text={tone.exampleWord} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-48 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-lg">{tone.nameVi}</span>
                      <span className="text-sm opacity-75">— {tone.nameEn}</span>
                      <span className="text-xs font-mono bg-white/60 px-2 py-0.5 rounded border border-current/20">
                        {tone.mark}
                      </span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div><span className="font-medium opacity-75">Hà Nội: </span>{tone.ipaHanoi}</div>
                      <div><span className="font-medium opacity-75">Sài Gòn: </span>{tone.ipaSaigon}</div>
                    </div>
                  </div>

                  {/* Contour diagram */}
                  <div className="shrink-0 opacity-70">
                    <div className="text-xs font-medium mb-1 opacity-75">Pitch contour</div>
                    <ToneContourSVG contour={tone.contour} />
                  </div>
                </div>
              </div>
            ))}

            {/* "ma" comparison table */}
            <div className="mt-6 rounded-xl border border-stone-200 overflow-hidden">
              <div className="bg-stone-100 px-4 py-2 text-xs font-semibold text-stone-600 uppercase tracking-wide">
                All six tones on one syllable: ma
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-y divide-stone-200">
                {TONES.map((t) => (
                  <div key={t.number} className="p-3 text-center">
                    <div className="text-2xl font-bold mb-1">{t.exampleWord}</div>
                    <div className="text-xs text-stone-500 mb-2">{t.exampleMeaning}</div>
                    <SpeakButton text={t.exampleWord} className="mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Alphabet section ── */}
        {activeSection === "alphabet" && (
          <div>
            <p className="text-sm text-stone-600 mb-6">
              Vietnamese uses 29 letters derived from the Latin alphabet, augmented with diacritics
              for additional vowel sounds. Note: <strong>F, J, W, Z</strong> are not in the standard
              alphabet (they appear only in foreign loanwords).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {ALPHABET.map(({ letter, note }) => {
                const spoken = letter.split(" ")[0]; // just the uppercase version
                return (
                  <div
                    key={letter}
                    className="rounded-xl border border-stone-200 bg-white p-3 flex items-center gap-3"
                  >
                    <span className="text-2xl font-bold text-stone-800 w-12 shrink-0">{letter}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-stone-500 leading-snug">{note}</p>
                      <SpeakButton text={spoken} className="mt-1.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Digraphs section ── */}
        {activeSection === "digraphs" && (
          <div>
            <p className="text-sm text-stone-600 mb-6">
              Vietnamese uses several two-letter combinations (digraphs) to represent single sounds.
              Many of these differ significantly between Northern and Southern dialects.
            </p>
            <div className="space-y-3">
              {DIGRAPHS.map(({ combo, sound, note }) => (
                <div
                  key={combo}
                  className="rounded-xl border border-stone-200 bg-white p-4 flex items-center gap-4 flex-wrap"
                >
                  <span className="text-3xl font-bold text-stone-800 w-14 shrink-0 font-mono">{combo}</span>
                  <span className="font-mono text-sm text-violet-700 bg-violet-50 px-2 py-0.5 rounded shrink-0">
                    {sound}
                  </span>
                  <p className="text-sm text-stone-600 flex-1 min-w-48">{note}</p>
                  <SpeakButton text={combo} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
