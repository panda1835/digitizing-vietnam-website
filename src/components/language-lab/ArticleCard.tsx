import Link from "next/link";
import { ExternalLink, Clock } from "lucide-react";

const DIFFICULTY_BADGE = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-yellow-100 text-yellow-700",
  advanced: "bg-red-100 text-red-700",
};

const TOPIC_COLORS = {
  "current-events": "bg-blue-50 text-blue-600",
  politics: "bg-slate-100 text-slate-600",
  society: "bg-violet-50 text-violet-600",
  education: "bg-teal-50 text-teal-600",
  culture: "bg-amber-50 text-amber-600",
  arts: "bg-pink-50 text-pink-600",
  entertainment: "bg-orange-50 text-orange-600",
  youth: "bg-lime-50 text-lime-600",
};

export default function ArticleCard({ article, href }) {
  const date = article.pubDate
    ? new Date(article.pubDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Link
      href={href}
      className="group block rounded-xl border border-stone-200 hover:border-red-300 hover:shadow-md transition-all overflow-hidden"
    >
      <div className="p-5">
        {/* Source + date */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-stone-500">{article.sourceName}</span>
          {date && (
            <span className="flex items-center gap-1 text-xs text-stone-400">
              <Clock className="w-3 h-3" />
              {date}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-stone-900 group-hover:text-red-700 transition-colors leading-snug mb-2 line-clamp-2">
          {article.title}
        </h3>

        {/* Summary */}
        {article.summary && (
          <p className="text-stone-500 text-sm line-clamp-2 leading-relaxed">{article.summary}</p>
        )}

        {/* Footer: tags + difficulty */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          {article.difficulty && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                DIFFICULTY_BADGE[article.difficulty] ?? DIFFICULTY_BADGE.intermediate
              }`}
            >
              {article.difficulty}
            </span>
          )}
          {article.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className={`text-xs px-2 py-0.5 rounded-full ${
                TOPIC_COLORS[tag] ?? "bg-stone-100 text-stone-500"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
