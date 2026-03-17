import Link from "next/link";
import { ChevronLeft, BookOpen, Languages } from "lucide-react";

const LEVEL_STYLES = {
  beginner: { badge: "bg-green-100 text-green-700", ring: "hover:border-green-300" },
  intermediate: { badge: "bg-yellow-100 text-yellow-700", ring: "hover:border-yellow-300" },
  advanced: { badge: "bg-red-100 text-red-700", ring: "hover:border-red-300" },
};

async function getLessons() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/language-lab/lessons`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.lessons ?? [];
  } catch {
    return [];
  }
}

export default async function CoursePage() {
  const lessons = await getLessons();

  const beginnerLessons = lessons.filter((l: any) => l.level === "beginner");
  const intermediateLessons = lessons.filter((l: any) => l.level === "intermediate");
  const advancedLessons = lessons.filter((l: any) => l.level === "advanced");

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <Link
          href="../language-lab"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 mb-8 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Language Lab
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="text-xs font-semibold uppercase tracking-widest text-red-700 mb-2">
            Pedagogy → Language Lab → Course
          </div>
          <h1 className="text-3xl font-bold text-stone-900">Vietnamese Language Course</h1>
          <p className="text-stone-500 mt-2 max-w-2xl">
            Structured lessons to build your Vietnamese from the ground up — vocabulary, grammar,
            cultural context, and reading comprehension, all in one place.
          </p>
        </div>

        {/* Orthography reference — always shown */}
        <div className="mb-10">
          <Link
            href="./course/orthography"
            className="group flex items-center gap-5 rounded-xl border-2 border-dashed border-stone-300 hover:border-red-400 bg-white hover:bg-red-50 p-5 transition-all"
          >
            <div className="shrink-0 w-12 h-12 rounded-xl bg-stone-100 group-hover:bg-red-100 flex items-center justify-center transition-colors">
              <Languages className="w-6 h-6 text-stone-500 group-hover:text-red-700 transition-colors" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-stone-400 group-hover:text-red-600 mb-0.5 transition-colors">
                Reference
              </div>
              <div className="font-semibold text-stone-900 group-hover:text-red-800 transition-colors">
                Vietnamese Orthography Guide
              </div>
              <p className="text-sm text-stone-500 mt-0.5">
                The 6 tones, the 29-letter alphabet, and common digraphs — with interactive audio for both Hà Nội and Sài Gòn pronunciation.
              </p>
            </div>
          </Link>
        </div>

        {lessons.length === 0 ? (
          <div className="text-center py-20 text-stone-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-lg font-medium mb-1">Lessons coming soon</p>
            <p className="text-sm">Course content is being prepared.</p>
          </div>
        ) : (
          <div className="space-y-12">
            <LevelSection title="Beginner" level="beginner" lessons={beginnerLessons} />
            <LevelSection title="Intermediate" level="intermediate" lessons={intermediateLessons} />
            <LevelSection title="Advanced" level="advanced" lessons={advancedLessons} />
          </div>
        )}
      </div>
    </main>
  );
}

function LevelSection({ title, level, lessons }: { title: string; level: string; lessons: any[] }) {
  const styles = LEVEL_STYLES[level] ?? LEVEL_STYLES.beginner;

  if (lessons.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-xl font-bold text-stone-800">{title}</h2>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide ${styles.badge}`}>
          {lessons.length} lessons
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {lessons.map((lesson: any) => (
          <LessonCard key={lesson.id} lesson={lesson} styles={styles} />
        ))}
      </div>
    </section>
  );
}

function LessonCard({ lesson, styles }: { lesson: any; styles: { badge: string; ring: string } }) {
  const material = lesson.studyMaterial ?? {};
  const vocabCount = material.vocabulary?.length ?? 0;
  const grammarCount = material.grammarPoints?.length ?? 0;

  return (
    <Link
      href={`./course/${lesson.id}`}
      className={`group block rounded-xl border border-stone-200 bg-white ${styles.ring} hover:shadow-md transition-all overflow-hidden`}
    >
      <div className="p-5">
        {/* Lesson number + level */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
            Lesson {lesson.lessonNumber}
          </span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${styles.badge}`}>
            {lesson.level}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-stone-900 group-hover:text-red-700 transition-colors leading-snug mb-1">
          {material.title ?? lesson.id}
        </h3>
        {material.titleVi && (
          <p className="text-stone-400 text-sm mb-3">{material.titleVi}</p>
        )}

        {/* Summary */}
        {material.summary && (
          <p className="text-stone-500 text-sm line-clamp-2 leading-relaxed mb-4">
            {material.summary}
          </p>
        )}

        {/* Stats */}
        <div className="flex gap-3 text-xs text-stone-400">
          {vocabCount > 0 && (
            <span>{vocabCount} vocab</span>
          )}
          {grammarCount > 0 && (
            <span>{grammarCount} grammar points</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export const metadata = {
  title: "Vietnamese Language Course",
};
