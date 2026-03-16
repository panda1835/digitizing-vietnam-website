import { NextResponse } from "next/server";
import { VIETNAMESE_SOURCES } from "@/lib/language-lab/vietnameseSources";
import { fetchRssFeed, fetchArticleText } from "@/lib/language-lab/parseRssFeed";
import { generateStudyMaterial } from "@/lib/language-lab/generateStudyMaterial";
import fs from "fs/promises";
import path from "path";

const STORE_PATH = path.join(process.cwd(), "data", "language-lab-feed.json");

async function readStore() {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return { articles: [] };
  }
}

async function writeStore(data: any) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const difficulty = searchParams.get("difficulty");
  const tag = searchParams.get("tag");
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);

  const store = await readStore();
  let articles = store.articles ?? [];

  if (difficulty) articles = articles.filter((a: any) => a.difficulty === difficulty);
  if (tag) articles = articles.filter((a: any) => a.tags?.includes(tag));

  articles = articles
    .sort((a: any, b: any) => new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime())
    .slice(0, limit);

  return NextResponse.json({ articles, total: articles.length });
}

export async function POST(request: Request) {
  const secret = request.headers.get("Authorization");
  if (process.env.CRON_SECRET && secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = await readStore();
  const existingUrls = new Set((store.articles ?? []).map((a: any) => a.sourceUrl));
  const results: any = { processed: 0, skipped: 0, errors: [] };
  const newArticles: any[] = [];

  for (const source of VIETNAMESE_SOURCES) {
    try {
      const feedItems = await fetchRssFeed(source.url);
      const fresh = feedItems.filter((item: any) => !existingUrls.has(item.url)).slice(0, 3);

      for (const item of fresh) {
        try {
          const text = await fetchArticleText(item.url);
          if (text.length < 200) { results.skipped++; continue; }

          const studyMaterial = await generateStudyMaterial({
            text: text.slice(0, 12000),
            sourceUrl: item.url,
          });

          newArticles.push({
            id: slugify(item.title + "-" + Date.now()),
            sourceId: source.id,
            sourceName: source.name,
            sourceUrl: item.url,
            title: studyMaterial.title ?? item.title,
            pubDate: item.pubDate,
            processedAt: new Date().toISOString(),
            difficulty: studyMaterial.difficulty ?? source.difficulty,
            tags: source.tags,
            summary: studyMaterial.summary,
            studyMaterial,
          });

          existingUrls.add(item.url);
          results.processed++;
        } catch (articleErr: any) {
          results.errors.push({ url: item.url, error: articleErr.message });
        }
      }
    } catch (feedErr: any) {
      results.errors.push({ source: source.id, error: feedErr.message });
    }
  }

  const updated = {
    articles: [...newArticles, ...(store.articles ?? [])].slice(0, 200),
    lastRun: new Date().toISOString(),
  };
  await writeStore(updated);

  return NextResponse.json({ ...results, newArticles: newArticles.length });
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").slice(0, 80);
}
