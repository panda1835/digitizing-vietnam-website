import { notFound } from "next/navigation";
import StudyPage from "@/components/language-lab/StudyPage";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

async function getArticle(slug: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/api/language-lab/feed`, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const data = await res.json();
  return (data.articles ?? []).find((a: any) => a.id === slug) ?? null;
}

export default async function ArticleStudyPage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <Link
          href="../language-lab"
          className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Language Lab
        </Link>
        <StudyPage material={article.studyMaterial} onReset={undefined} />
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);
  return { title: article?.title ?? "Language Lab" };
}
