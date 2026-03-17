import Link from "next/link";
import { PenLine, BookOpen, Sparkles, ArrowRight } from "lucide-react";
import ArticleCard from "@/components/language-lab/ArticleCard";

const DIFFICULTIES = ["all", "beginner", "intermediate", "advanced"];

const TOPICS = [
  { id: "all", label: "All Topics" },
  { id: "current-events", label: "Thời Sự" },
  { id: "culture", label: "Văn Hóa" },
  { id: "entertainment", label: "Giải Trí" },
  { id: "youth", label: "Giới Trẻ" },
  { id: "education", label: "Giáo Dục" },
];

const LEVEL_BADGE = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-yellow-100 text-yellow-700",
  advanced: "bg-red-100 text-red-700",
};

async function getArticles({ difficulty, tag }: { difficulty: string; tag: string }) {
  const params = new URLSearchParams();
  if (difficulty && difficulty !== "all") params.set("difficulty", difficulty);
  if (tag && tag !== "all") params.set("tag", tag);
  params.set("limit", "24");

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/language-lab/feed?${params}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  return (await res.json()).articles ?? [];
}

async function getFeaturedReadings() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/language-lab/readings?limit=100`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const all: any[] = (await res.json()).readings ?? [];
    // Pick 2 from each level for the preview
    const pick = (lvl: string) =>
      all.filter((r) => r.level === lvl).slice(0, 2);
    return [...pick("beginner"), ...pick("intermediate"), ...pick("advanced")];
  } catch {
    return [];
  }
}

export default async function LanguageLabPage({ searchParams }: { searchParams: any }) {
  const difficulty = searchParams?.difficulty ?? "all";
  const tag = searchParams?.tag ?? "all";

  const [articles, featuredReadings] = await Promise.all([
    getArticles({ difficulty, tag }),
    getFeaturedReadings(),
  ]);

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 py-12">

        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-6 mb-10 flex-wrap">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-red-700 mb-2">
              Pedagogy → Vietnamese Language Lab
            </div>
            <h1 className="text-3xl font-bold text-stone-900">Study Materials</h1>
            <p className="text-stone-500 mt-1 max-w-lg">
              Structured language study materials — curated readings, live news articles, and a
              beginner course, all with vocabulary, grammar, and comprehension tools.
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="./language-lab/course"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white font-medium text-sm transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Vietnamese Course
            </Link>
            <Link
              href="./language-lab/generate"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-medium text-sm transition-colors"
            >
              <PenLine className="w-4 h-4" />
              Generate from your own source
            </Link>
          </div>
        </div>

        {/* ── Curated Readings section ── */}
        {featuredReadings.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-600" />
                <h2 className="text-lg font-bold text-stone-900">Curated Readings</h2>
                <span className="text-xs text-stone-400">
                  — original passages written for learners at every level
                </span>
              </div>
              <Link
                href="./language-lab/readings"
                className="flex items-center gap-1 text-sm text-red-700 hover:text-red-900 font-medium transition-colors"
              >
                View all 30
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredReadings.map((r: any) => {
                const badge = LEVEL_BADGE[r.level as keyof typeof LEVEL_BADGE] ?? LEVEL_BADGE.beginner;
                return (
                  <Link
                    key={r.id}
                    href={`./language-lab/readings/${r.id}`}
                    className="group block rounded-xl border border-stone-200 bg-white hover:border-red-300 hover:shadow-md transition-all p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${badge}`}>
                        {r.level}
                      </span>
                      {r.tag && <span className="text-xs text-stone-400 capitalize">{r.tag}</span>}
                    </div>
                    <h3 className="font-semibold text-stone-900 group-hover:text-red-700 transition-colors leading-snug mb-1 line-clamp-2">
                      {r.title}
                    </h3>
                    {r.titleVi && (
                      <p className="text-stone-400 text-sm mb-2">{r.titleVi}</p>
                    )}
                    {r.summary && (
                      <p className="text-stone-500 text-sm line-clamp-2 leading-relaxed">
                        {r.summary}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Live news articles section ── */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <h2 className="text-lg font-bold text-stone-900">Live News Articles</h2>
            <span className="text-xs text-stone-400">— daily feed from Vietnamese news sources</span>
          </div>

          <div className="flex flex-wrap gap-6 mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Level:</span>
              <div className="flex gap-1.5">
                {DIFFICULTIES.map((d) => (
                  <Link
                    key={d}
                    href={`?difficulty=${d}&tag=${tag}`}
                    className={`text-xs px-3 py-1 rounded-full capitalize transition-colors ${
                      difficulty === d ? "bg-red-700 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {d}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Topic:</span>
              <div className="flex gap-1.5 flex-wrap">
                {TOPICS.map(({ id, label }) => (
                  <Link
                    key={id}
                    href={`?difficulty=${difficulty}&tag=${id}`}
                    className={`text-xs px-3 py-1 rounded-full transition-colors ${
                      tag === id ? "bg-red-700 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {articles.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <p className="text-lg font-medium mb-2">No articles yet</p>
              <p className="text-sm">The automated feed hasn't run yet, or no articles match your filters.</p>
              <Link
                href="./language-lab/generate"
                className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-medium text-sm transition-colors"
              >
                <PenLine className="w-4 h-4" />
                Generate one manually
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {articles.map((article: any) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  href={`/pedagogy/language-lab/${article.id}`}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
