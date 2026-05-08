import { NextRequest, NextResponse } from "next/server";
import { startPipeline, stopPipeline, stopAfterDocument, getPipelineStatus, resumeIfNeeded } from "@/lib/ocr-pipeline";
import { getUsageStats, setLimits, getAvgSecondsPerPage } from "@/lib/ocr-usage";
import { getIndex } from "@/lib/ocr-store";

/**
 * GET /api/ocr/pipeline
 *
 * Returns current pipeline state, per-document progress, and usage stats.
 * Also resumes the pipeline if it was interrupted by a server restart.
 */
export async function GET() {
  // Auto-resume if the pipeline was left running from a previous session
  await resumeIfNeeded();

  const status = await getPipelineStatus();
  const usage = await getUsageStats();
  const index = await getIndex();

  // Enrich documents list with any queued/pending/processing docs not yet in
  // the pipeline status. Includes both IIIF (manifestUrl) and PDF (source:"pdf")
  // entries so the admin UI shows them all as "waiting".
  const pipelineSlugs = new Set(status.documents.map((d) => d.slug));
  const queuedSlugs = Object.entries(index)
    .filter(
      ([slug, e]) =>
        !pipelineSlugs.has(slug) &&
        (e.status === "queued" || e.status === "pending" || e.status === "processing") &&
        (Boolean(e.manifestUrl) || e.source === "pdf")
    )
    .map(([slug, e]) => ({
      slug,
      title: e.title ?? slug,
      totalPages: e.pageCount || 0,
      completedPages: 0,
      status: (e.status === "processing" ? "processing" : "waiting") as "waiting" | "processing",
      source: e.source,
    }));

  const avgSecondsPerPage = await getAvgSecondsPerPage();

  return NextResponse.json({ ...status, usage, queued: queuedSlugs, avgSecondsPerPage });
}

/**
 * POST /api/ocr/pipeline
 *
 * Body: { action: "start" | "stop" | "set-limits", dailyLimit?, monthlyLimit? }
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const action: string = body.action;

  if (action === "start") {
    const result = await startPipeline();
    return NextResponse.json(result);
  }

  if (action === "stop") {
    await stopPipeline();
    return NextResponse.json({ stopped: true });
  }

  if (action === "stop-after-doc") {
    await stopAfterDocument();
    return NextResponse.json({ stoppingAfterDoc: true });
  }

  if (action === "set-limits") {
    const daily = typeof body.dailyLimit === "number" ? body.dailyLimit : 0;
    const monthly = typeof body.monthlyLimit === "number" ? body.monthlyLimit : 0;
    await setLimits(daily, monthly);
    const usage = await getUsageStats();
    return NextResponse.json({ success: true, usage });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
