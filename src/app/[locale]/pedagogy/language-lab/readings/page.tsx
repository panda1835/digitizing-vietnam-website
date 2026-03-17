import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const LEVEL_META = {
  beginner: {
    label: "Beginner",
    badge: "bg-green-100 text-green-700",
    border: "border-green-200 hover:border-green-400",
    desc: "Simple vocabulary and short sentences on everyday contemporary topics.",
  },
  intermediate: {
    label: "Intermediate",
    badge: "bg-yellow-100 text-yellow-700",
    border: "border-yellow-200 hover:border-yellow-400",
    desc: "Journalistic Vietnamese on current social, cultural, and economic themes.",
  },
  advanced: {
    label: "Advanced",
    badge: "bg-red-100 text-red-700",
    border: "border-red-300 hover:border-red-500",
    desc: "Formal and academic Vietnamese on complex contemporary issues.",
  },
};

async function getReadings(level?: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const params = new URLSearchParams();
  if (level && level !== "all") params.set("level", level);
  const res = await fetch(`${base}/api/language-lab/readings?${params}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  return (await res.json()).readings ?? [];
}

export default async function ReadingsPage({ searchParams }: { searchParams: any }) {
  const level = searchParams?.level ?? "all";
  const readings = await getReadings(level);

  const byLevel = {
    beginner: readings.filter((r: any) => r.level === "beginner"),
    intermediate: readings.filter((r: any) => r.level === "intermediate"),
    advanced: readings.filter((r: any) => r.level === "advanced"),
  };

  const LEVELS = ["all", "beginner", "intermediate", "advanced"] as const;

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Link
          href="../language-lab"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 mb-8 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Language Lab
        </Link>

        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-widest text-red-700 mb-2">
            Pedagogy → Language Lab → Curated Readings
          </div>
          <h1 className="text-3xl font-bold text-stone-900">Curated Readings</h1>
          <p className="text-stone-500 mt-2 max-w-2xl">
            Original Vietnamese passages on contemporary topics — written specifically for language
            learners at each level, with full vocabulary, grammar, and comprehension material.
          </p>
        </div>

        {/* Level filter */}
        <div className="flex items-center gap-2 mb-8">
          <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Level:</span>
          <div className="flex gap-1.5">
            {LEVELS.map((l) => (
              <Link
                key={l}
                href={`?level=${l}`}
                className={`text-xs px-3 py-1 rounded-full capitalize transition-colors ${
                  level === l
                    ? "bg-red-700 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {l}
              </Link>
            ))}
          </div>
        </div>

        {readings.length === 0 ? (
          <p className="text-stone-400 text-center py-20">No readings found.</p>
        ) : level === "all" ? (
          // Show grouped sections
          <div className="space-y-12">
            {(["beginner", "intermediate", "advanced"] as const).map((lvl) =>
              byLevel[lvl].length > 0 ? (
                <section key={lvl}>
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="text-xl font-bold text-stone-800 capitalize">{lvl}</h2>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${LEVEL_META[lvl].badge}`}>
                      {byLevel[lvl].length} readings
                    </span>
                    <p className="text-sm text-stone-400 hidden sm:block">{LEVEL_META[lvl].desc}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {byLevel[lvl].map((r: any) => <ReadingCard key={r.id} reading={r} />)}
                  </div>
                </section>
              ) : null
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {readings.map((r: any) => <ReadingCard key={r.id} reading={r} />)}
          </div>
        )}
      </div>
    </main>
  );
}

function ReadingCard({ reading }: { reading: any }) {
  const meta = LEVEL_META[reading.level as keyof typeof LEVEL_META] ?? LEVEL_META.beginner;
  const vocabCount = reading.studyMaterial?.vocabulary?.length ?? 0;
  const grammarCount = reading.studyMaterial?.grammarPoints?.length ?? 0;

  return (
    <Link
      href={`./readings/${reading.id}`}
      className={`group block rounded-xl border bg-white ${meta.border} hover:shadow-md transition-all overflow-hidden`}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${meta.badge}`}>
            {meta.label}
          </span>
          {reading.tag && (
            <span className="text-xs text-stone-400 capitalize">{reading.tag}</span>
          )}
        </div>

        <h3 className="font-semibold text-stone-900 group-hover:text-red-700 transition-colors leading-snug mb-1">
          {reading.title}
        </h3>
        {reading.titleVi && (
          <p className="text-stone-400 text-sm mb-3">{reading.titleVi}</p>
        )}
        {reading.summary && (
          <p className="text-stone-500 text-sm line-clamp-2 leading-relaxed mb-4">
            {reading.summary}
          </p>
        )}

        <div className="flex gap-3 text-xs text-stone-400">
          {vocabCount > 0 && <span>{vocabCount} vocab</span>}
          {grammarCount > 0 && <span>{grammarCount} grammar points</span>}
        </div>
      </div>
    </Link>
  );
}

export const metadata = { title: "Curated Readings — Vietnamese Language Lab" };
