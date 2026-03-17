import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const LESSONS_PATH = join(process.cwd(), "data/language-lab-lessons.json");

function loadLessons() {
  if (!existsSync(LESSONS_PATH)) return [];
  try {
    const raw = readFileSync(LESSONS_PATH, "utf-8");
    return JSON.parse(raw).lessons ?? [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level");

  let lessons = loadLessons();

  if (level && level !== "all") {
    lessons = lessons.filter((l: any) => l.level === level);
  }

  return NextResponse.json({ lessons }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
