import { notFound } from "next/navigation";
import StudyPage from "@/components/language-lab/StudyPage";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

async function getLessons() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/language-lab/lessons`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.lessons ?? [];
}

export default async function LessonPage({ params }: { params: { slug: string } }) {
  const lessons = await getLessons();
  const idx = lessons.findIndex((l: any) => l.id === params.slug);
  if (idx === -1) notFound();

  const lesson = lessons[idx];
  const prev = idx > 0 ? lessons[idx - 1] : null;
  const next = idx < lessons.length - 1 ? lessons[idx + 1] : null;

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Back link */}
        <Link
          href="../course"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Course
        </Link>

        <StudyPage material={lesson.studyMaterial} onReset={undefined} />

        {/* Lesson navigation */}
        <div className="flex items-center justify-between mt-12 pt-8 border-t border-stone-200">
          {prev ? (
            <Link
              href={`../course/${prev.id}`}
              className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <div>
                <div className="text-xs text-stone-400">Previous</div>
                <div className="font-medium">
                  Lesson {prev.lessonNumber}: {prev.studyMaterial?.titleVi ?? ""}
                </div>
              </div>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={`../course/${next.id}`}
              className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors text-right"
            >
              <div>
                <div className="text-xs text-stone-400">Next</div>
                <div className="font-medium">
                  Lesson {next.lessonNumber}: {next.studyMaterial?.titleVi ?? ""}
                </div>
              </div>
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <div />
          )}
        </div>
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const lessons = await getLessons();
  const lesson = lessons.find((l: any) => l.id === params.slug);
  return {
    title: lesson?.studyMaterial?.title ?? "Vietnamese Lesson",
  };
}
