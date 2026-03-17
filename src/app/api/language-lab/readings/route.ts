import { NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const READINGS_PATH = join(process.cwd(), "data/language-lab-readings.json");

function loadReadings() {
  if (!existsSync(READINGS_PATH)) return [];
  try {
    return JSON.parse(readFileSync(READINGS_PATH, "utf-8")).readings ?? [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level");
  const tag = searchParams.get("tag");
  const limit = parseInt(searchParams.get("limit") ?? "100", 10);

  let readings = loadReadings();
  if (level && level !== "all") readings = readings.filter((r: any) => r.level === level);
  if (tag && tag !== "all") readings = readings.filter((r: any) => r.tag === tag);
  readings = readings.slice(0, limit);

  return NextResponse.json(
    { readings, total: readings.length },
    { headers: { "Cache-Control": "public, max-age=3600" } }
  );
}
