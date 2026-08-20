"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Merriweather } from "next/font/google";
import {
  AlertTriangle,
  BookOpen,
  Loader2,
  Search,
  Sparkles,
  SquareArrowOutUpRight,
} from "lucide-react";

import { Link, useRouter } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

type Mode = "hybrid" | "keyword" | "exact" | "semantic";

interface Source {
  slug: string;
  title: string;
  author: string | null;
  year: number | null;
  pageCount: number;
  meanConfidence: number | null;
  provenance: string;
}

interface Result {
  slug: string;
  title: string;
  pageNumber: number;
  pageLabel: string | null;
  confidence: number | null;
  start: number | null;
  end: number | null;
  snippetBefore: string;
  snippetMatch: string;
  snippetAfter: string;
  via: Mode[];
}

interface Citation {
  id: string;
  slug: string;
  title: string;
  pageNumber: number;
  pageLabel: string | null;
  confidence: number | null;
  quote: string;
  spanMatch: string;
  spanSimilarity: number;
  href: string;
}

interface Answer {
  status: "answered" | "insufficient_evidence";
  claims: { text: string; citations: string[] }[];
  citations: Citation[];
  caveats: string[];
  unsupportedNote: string | null;
  verification: { claimsProposed: number; claimsKept: number; citationsDropped: number };
  model: string;
  latencyMs: number;
  /** How the response was produced: a real call, a cache hit, or a guard. */
  served?: "model" | "cache" | "gated" | "budget-exhausted";
  costUsd?: number;
}

/** What /api/corpus/retrieve returns — rendered before the prose arrives. */
interface Evidence {
  sessionId: string;
  passages: {
    ref: string;
    slug: string;
    title: string;
    pageNumber: number;
    pageLabel: string | null;
    confidence: number | null;
    text: string;
  }[];
  topScore: number;
  relevant: boolean;
  model: string;
  latencyMs: number;
}

const MODES: { key: Mode; en: string; vi: string; hintEn: string; hintVi: string }[] = [
  { key: "hybrid", en: "Hybrid", vi: "Kết hợp", hintEn: "Keyword and meaning combined", hintVi: "Kết hợp từ khoá và ngữ nghĩa" },
  { key: "keyword", en: "Keyword", vi: "Từ khoá", hintEn: "Ignores tone marks and case", hintVi: "Bỏ qua dấu và chữ hoa" },
  { key: "exact", en: "Exact", vi: "Chính xác", hintEn: "Literal match, diacritics respected", hintVi: "Khớp nguyên văn, có dấu" },
  { key: "semantic", en: "Semantic", vi: "Ngữ nghĩa", hintEn: "Finds passages that mean the same", hintVi: "Tìm đoạn có nghĩa tương tự" },
];

function confidenceTone(confidence: number | null) {
  if (confidence === null) return { label: "—", className: "bg-branding-black/5 text-branding-black/50" };
  if (confidence >= 0.95) return { label: `${Math.round(confidence * 100)}%`, className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (confidence >= 0.85) return { label: `${Math.round(confidence * 100)}%`, className: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: `${Math.round(confidence * 100)}%`, className: "bg-red-50 text-red-700 border-red-200" };
}

export default function CorpusSearch({ locale }: { locale: string }) {
  const vi = locale === "vi";
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [mode, setMode] = useState<Mode>((searchParams.get("mode") as Mode) ?? "hybrid");
  const [sources, setSources] = useState<Source[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [ran, setRan] = useState(false);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const [asking, setAsking] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  const lastRun = useRef<string>("");

  const runSearch = useCallback(
    async (text: string, searchMode: Mode) => {
      const trimmed = text.trim();
      if (!trimmed) {
        setResults([]);
        setRan(false);
        return;
      }
      setSearching(true);
      setSearchError(null);
      try {
        const response = await fetch(
          `/api/corpus/search?q=${encodeURIComponent(trimmed)}&mode=${searchMode}&limit=60`
        );
        const json = await response.json();
        if (json.sources) setSources(json.sources);
        if (!response.ok) throw new Error(json.error || "Search failed");
        setResults(json.results ?? []);
        setRan(true);
      } catch (error: any) {
        setSearchError(error?.message ?? "Search failed");
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    []
  );

  // Load the catalogue on mount, and honour ?q= arriving from the hub card.
  useEffect(() => {
    fetch("/api/corpus/search?q=")
      .then((response) => response.json())
      .then((json) => setSources(json.sources ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const initial = searchParams.get("q");
    if (initial && lastRun.current !== initial) {
      lastRun.current = initial;
      runSearch(initial, mode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    lastRun.current = query;
    router.replace(`/research/han-nom/corpus?q=${encodeURIComponent(query)}&mode=${mode}`);
    runSearch(query, mode);
  };

  const changeMode = (next: Mode) => {
    setMode(next);
    if (query.trim()) runSearch(query, next);
  };

  // Two-step: retrieve the evidence first and render it immediately, then ask
  // for the prose. The reader sees what the answer is built from before the
  // answer exists, and neither call goes near Netlify's function timeout.
  const ask = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;

    setAsking(true);
    setAskError(null);
    setAnswer(null);
    setEvidence(null);

    try {
      const retrieveResponse = await fetch("/api/corpus/retrieve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, language: locale }),
      });
      const retrieved = await retrieveResponse.json();
      if (!retrieveResponse.ok) {
        throw new Error(retrieved.error || "Could not search the corpus");
      }

      setEvidence(retrieved);

      // Nothing relevant was found, so the model is never called — this costs
      // nothing rather than ~$0.005 to be told the same thing.
      if (!retrieved.relevant) {
        setAnswer({
          status: "insufficient_evidence",
          claims: [],
          citations: [],
          caveats: [],
          unsupportedNote:
            locale === "vi"
              ? "Không tìm thấy đoạn nào trong kho tài liệu liên quan đến câu hỏi này."
              : "Nothing in the corpus is relevant to this question.",
          verification: { claimsProposed: 0, claimsKept: 0, citationsDropped: 0 },
          model: retrieved.model,
          served: "gated",
          latencyMs: retrieved.latencyMs,
        } as Answer);
        return;
      }

      setAnswering(true);
      const answerResponse = await fetch("/api/corpus/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: retrieved.sessionId }),
      });
      const json = await answerResponse.json();
      if (!answerResponse.ok) {
        throw new Error(json.error || "The assistant could not answer");
      }
      setAnswer(json);
    } catch (error: any) {
      setAskError(error?.message ?? "The assistant could not answer");
    } finally {
      setAsking(false);
      setAnswering(false);
    }
  };

  const citationById = new Map((answer?.citations ?? []).map((c) => [c.id, c]));

  return (
    <div className="space-y-12">
      {/* ---------------- search ---------------- */}
      <section>
        <h2 className={`${merriweather.className} text-xl text-branding-black mb-4`}>
          {vi ? "Tìm kiếm" : "Search"}
        </h2>

        <form onSubmit={submit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={vi ? "Ví dụ: chữ Nôm, Hải Dương phong vật khúc…" : "e.g. chữ Nôm, Hải Dương phong vật khúc…"}
              className="pl-9 h-11"
            />
          </div>
          <Button type="submit" className="h-11 px-6" disabled={searching}>
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : vi ? "Tìm" : "Search"}
          </Button>
        </form>

        <div className="flex flex-wrap gap-2 mt-3">
          {MODES.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => changeMode(option.key)}
              title={vi ? option.hintVi : option.hintEn}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs border transition-colors",
                mode === option.key
                  ? "bg-branding-brown text-white border-branding-brown"
                  : "bg-white text-branding-black/70 border-branding-brown/20 hover:border-branding-brown/50"
              )}
            >
              {vi ? option.vi : option.en}
            </button>
          ))}
          <span className="text-xs text-muted-foreground self-center ml-1">
            {vi ? MODES.find((m) => m.key === mode)?.hintVi : MODES.find((m) => m.key === mode)?.hintEn}
          </span>
        </div>

        {searchError && (
          <p className="mt-4 text-sm text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> {searchError}
          </p>
        )}

        {ran && !searching && (
          <p className="mt-5 text-sm text-muted-foreground">
            {results.length === 0
              ? vi
                ? "Không tìm thấy đoạn nào."
                : "No passages found."
              : vi
              ? `${results.length} đoạn khớp`
              : `${results.length} matching passage${results.length === 1 ? "" : "s"}`}
          </p>
        )}

        <div className="mt-4 space-y-3">
          {results.map((result, index) => {
            const tone = confidenceTone(result.confidence);
            const href =
              `/research/han-nom/corpus/${result.slug}?page=${result.pageNumber}` +
              (result.start !== null ? `&s=${result.start}&e=${result.end}` : "") +
              `&q=${encodeURIComponent(result.snippetMatch.slice(0, 120))}`;
            return (
              <Link
                key={`${result.slug}-${result.pageNumber}-${result.start}-${index}`}
                href={href}
                className="block rounded-xl border border-branding-brown/15 bg-white p-4 hover:border-branding-brown/40 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <span className="text-branding-brown font-medium">
                    {vi ? "tr." : "p."} {result.pageLabel ?? result.pageNumber}
                  </span>
                  <span className="text-muted-foreground truncate">{result.title}</span>
                  <Badge variant="outline" className={cn("ml-auto font-normal shrink-0", tone.className)}>
                    OCR {tone.label}
                  </Badge>
                  {result.via.map((leg) => (
                    <Badge key={leg} variant="outline" className="font-normal shrink-0 text-[10px]">
                      {leg}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-branding-black/80">
                  <span className="text-muted-foreground">…{result.snippetBefore}</span>
                  <mark className="bg-yellow-200 px-0.5 rounded-sm">{result.snippetMatch}</mark>
                  <span className="text-muted-foreground">{result.snippetAfter}…</span>
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ---------------- ask ---------------- */}
      <section className="rounded-3xl border border-branding-brown/15 bg-branding-gray/40 p-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-4 w-4 text-branding-brown" />
          <h2 className={`${merriweather.className} text-xl text-branding-black`}>
            {vi ? "Hỏi kho tài liệu" : "Ask the corpus"}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {vi
            ? "Mọi câu trả lời đều phải dẫn nguồn. Bấm vào trích dẫn để mở đúng trang quét và tự kiểm chứng."
            : "Every claim must cite a passage. Click a citation to open the scanned page and check it yourself."}
        </p>

        <form onSubmit={ask} className="space-y-3">
          <Textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={3}
            placeholder={
              vi
                ? "Ví dụ: Trần Công Hiến là ai, và ông có vai trò gì với Hải Dương phong vật khúc?"
                : "e.g. Who was Trần Công Hiến, and what was his role in Hải Dương phong vật khúc?"
            }
            className="bg-white"
          />
          <Button type="submit" disabled={asking || !question.trim()}>
            {asking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {answering
                  ? vi
                    ? "Đang soạn câu trả lời…"
                    : "Writing the answer…"
                  : vi
                  ? "Đang tra cứu…"
                  : "Searching the sources…"}
              </>
            ) : vi ? (
              "Hỏi"
            ) : (
              "Ask"
            )}
          </Button>
        </form>

        {askError && (
          <p className="mt-4 text-sm text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> {askError}
          </p>
        )}

        {/* Evidence lands first — the reader sees the basis before the prose. */}
        {evidence && !answer && (
          <div className="mt-6">
            <h3 className="text-xs uppercase tracking-widest text-branding-brown/70 font-bold mb-2">
              {vi
                ? `Đã tìm thấy ${evidence.passages.length} đoạn`
                : `Found ${evidence.passages.length} passages`}
            </h3>
            <div className="space-y-2">
              {evidence.passages.slice(0, 5).map((passage) => (
                <div
                  key={passage.ref}
                  className="rounded-lg border border-branding-brown/15 bg-white/70 p-3"
                >
                  <div className="flex items-center gap-2 text-xs mb-1">
                    <span className="text-branding-brown font-medium">
                      {vi ? "tr." : "p."} {passage.pageLabel ?? passage.pageNumber}
                    </span>
                    <span className="text-muted-foreground truncate">{passage.title}</span>
                  </div>
                  <p className="text-sm text-branding-black/60 line-clamp-2">
                    {passage.text.slice(0, 180)}…
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {answer && (
          <div className="mt-6 space-y-4">
            {answer.status === "insufficient_evidence" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 text-amber-800 font-medium text-sm mb-1">
                  <AlertTriangle className="h-4 w-4" />
                  {vi ? "Không đủ căn cứ" : "Insufficient evidence"}
                </div>
                <p className="text-sm text-amber-900/80">
                  {answer.unsupportedNote}
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-white border border-branding-brown/15 p-5 space-y-3">
                {answer.claims.map((claim, index) => (
                  <p key={index} className="text-[15px] leading-relaxed text-branding-black">
                    {claim.text}{" "}
                    {claim.citations.map((id) => {
                      const citation = citationById.get(id);
                      if (!citation) return null;
                      return (
                        <Link
                          key={id}
                          href={citation.href}
                          className="inline-flex items-center gap-1 align-baseline mx-0.5 px-1.5 py-0.5 rounded bg-branding-brown/10 text-branding-brown text-xs hover:bg-branding-brown/20"
                          title={citation.quote}
                        >
                          {vi ? "tr." : "p."} {citation.pageLabel ?? citation.pageNumber}
                          <SquareArrowOutUpRight className="h-3 w-3" />
                        </Link>
                      );
                    })}
                  </p>
                ))}
              </div>
            )}

            {answer.caveats?.length > 0 && (
              <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                {answer.caveats.map((caveat, index) => (
                  <li key={index}>{caveat}</li>
                ))}
              </ul>
            )}

            {/* Evidence panel — what the answer was actually built on. */}
            {answer.citations.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-widest text-branding-brown/70 font-bold mb-2">
                  {vi ? "Chứng cứ" : "Evidence"}
                </h3>
                <div className="space-y-2">
                  {answer.citations.map((citation) => {
                    const tone = confidenceTone(citation.confidence);
                    return (
                      <Link
                        key={citation.id}
                        href={citation.href}
                        className="block rounded-lg border border-branding-brown/15 bg-white p-3 hover:border-branding-brown/40"
                      >
                        <div className="flex items-center gap-2 text-xs mb-1">
                          <span className="text-branding-brown font-medium">
                            {vi ? "tr." : "p."} {citation.pageLabel ?? citation.pageNumber}
                          </span>
                          <span className="text-muted-foreground truncate">{citation.title}</span>
                          <Badge variant="outline" className={cn("ml-auto font-normal shrink-0", tone.className)}>
                            OCR {tone.label}
                          </Badge>
                          {citation.spanMatch !== "exact" && (
                            <Badge
                              variant="outline"
                              className="font-normal shrink-0 bg-amber-50 text-amber-700 border-amber-200"
                              title={
                                vi
                                  ? "Trích dẫn được định vị gần đúng do lỗi OCR"
                                  : "Quote located approximately, because of OCR variance"
                              }
                            >
                              ≈ {citation.spanSimilarity}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-branding-black/75 italic">“{citation.quote}”</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              {answer.served === "cache" && (
                <span className="mr-1 rounded bg-branding-brown/10 px-1.5 py-0.5 text-branding-brown">
                  {vi ? "đã lưu" : "cached"}
                </span>
              )}
              {answer.model} · {(answer.latencyMs / 1000).toFixed(1)}s ·{" "}
              {vi
                ? `${answer.verification.claimsKept}/${answer.verification.claimsProposed} luận điểm có dẫn chứng đã kiểm chứng`
                : `${answer.verification.claimsKept}/${answer.verification.claimsProposed} claims survived citation checking`}
              {answer.verification.citationsDropped > 0 &&
                (vi
                  ? `, ${answer.verification.citationsDropped} trích dẫn bị loại`
                  : `, ${answer.verification.citationsDropped} citation(s) dropped`)}
            </p>
          </div>
        )}
      </section>
      {/* ---------------- catalogue ---------------- */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className={`${merriweather.className} text-xl text-branding-black`}>
            {vi ? "Nguồn trong kho" : "Sources in the corpus"}
          </h2>
          <span className="text-xs text-muted-foreground">
            {sources.length} {vi ? "tài liệu" : sources.length === 1 ? "work" : "works"}
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {sources.map((source) => {
            const tone = confidenceTone(source.meanConfidence);
            return (
              <Link
                key={source.slug}
                href={`/research/han-nom/corpus/${source.slug}`}
                className="group rounded-2xl border border-branding-brown/15 bg-white p-5 hover:border-branding-brown/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-branding-black font-medium leading-snug">{source.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {[source.author, source.year].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <BookOpen className="h-4 w-4 text-branding-brown/50 shrink-0 mt-1 group-hover:text-branding-brown" />
                </div>
                <div className="flex items-center gap-2 mt-4 text-xs">
                  <span className="text-muted-foreground">
                    {source.pageCount} {vi ? "trang quét" : "scanned pages"}
                  </span>
                  <Badge variant="outline" className={cn("font-normal", tone.className)}>
                    OCR {tone.label}
                  </Badge>
                </div>
              </Link>
            );
          })}
          {sources.length === 0 && (
            <div className="text-sm text-muted-foreground">
              {vi ? "Chưa có tài liệu nào được nạp." : "No sources ingested yet."}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
