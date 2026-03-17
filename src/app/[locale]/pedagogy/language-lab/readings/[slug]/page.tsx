import { notFound } from "next/navigation";
import StudyPage from "@/components/language-lab/StudyPage";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

async function getReadings() {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/language-lab/readings`, { next: { revalidate: 3600 } });
  if (!res.ok) return [];
  return (await res.json()).readings ?? [];
}

export default async function ReadingPage({ params }: { params: { slug: string } }) {
  const readings = await getReadings();
  const idx = readings.findIndex((r: any) => r.id === params.slug);
  if (idx === -1) notFound();

  const reading = readings[idx];

  // Prev/next within the same level
  const levelReadings = readings.filter((r: any) => r.level === reading.level);
  const levelIdx = levelReadings.findIndex((r: any) => r.id === params.slug);
  const prev = levelIdx > 0 ? levelReadings[levelIdx - 1] : null;
  const next = levelIdx < levelReadings.length - 1 ? levelReadings[levelIdx + 1] : null;

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link
          href="../readings"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Readings
        </Link>

        <StudyPage material={reading.studyMaterial} onReset={undefined} />

        {/* Prev / next within level */}
        {(prev || next) && (
          <div className="flex items-center justify-between mt-12 pt-8 border-t border-stone-200">
            {prev ? (
              <Link
                href={`../readings/${prev.id}`}
                className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <div>
                  <div className="text-xs text-stone-400 capitalize">{prev.level}</div>
                  <div className="font-medium line-clamp-1">{prev.title}</div>
                </div>
              </Link>
            ) : <div />}
            {next ? (
              <Link
                href={`../readings/${next.id}`}
                className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 transition-colors text-right"
              >
                <div>
                  <div className="text-xs text-stone-400 capitalize">{next.level}</div>
                  <div className="font-medium line-clamp-1">{next.title}</div>
                </div>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : <div />}
          </div>
        )}
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const readings = await getReadings();
  const reading = readings.find((r: any) => r.id === params.slug);
  return { title: reading?.title ?? "Vietnamese Reading" };
}
