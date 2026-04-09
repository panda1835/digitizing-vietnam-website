import { NextRequest, NextResponse } from "next/server";
import { getIndex, setIndexEntry, setPage, getPage, computeRawText, rebuildSearchIndex } from "@/lib/ocr-store";
import { callKandianguji } from "@/lib/kandianguji-ocr";
import { getCanvasesFromManifest, resolveOcrImageUrl } from "@/lib/iiif-utils";

/**
 * POST /api/ocr/process-iiif
 *
 * Processes all (or a range of) pages of a IIIF manifest through Kandianguji OCR.
 * Streams NDJSON progress lines so the client can show live updates.
 * Checks for an AbortSignal between pages so the request can be cancelled
 * (already-processed pages are saved).
 *
 * Body: { slug: string, startPage?: number, endPage?: number }
 */
export async function POST(req: NextRequest) {
  const { slug, startPage, endPage } = await req.json();
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const index = await getIndex();
  const entry = index[slug];
  if (!entry || !entry.manifestUrl) {
    return NextResponse.json(
      { error: "No IIIF manifest URL found for this slug" },
      { status: 404 }
    );
  }

  await setIndexEntry(slug, { status: "processing" });

  // Fetch manifest up front (non-streaming part)
  let manifest: any;
  try {
    const manifestRes = await fetch(entry.manifestUrl);
    if (!manifestRes.ok) {
      await setIndexEntry(slug, { status: "error" });
      return NextResponse.json({ error: "Failed to fetch manifest" }, { status: 502 });
    }
    manifest = await manifestRes.json();
  } catch (e: any) {
    await setIndexEntry(slug, { status: "error" });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }

  const canvases = getCanvasesFromManifest(manifest);
  const start = startPage ?? 1;
  const end = Math.min(endPage ?? canvases.length, canvases.length);
  const totalPages = canvases.length;

  // Stream NDJSON progress
  const encoder = new TextEncoder();
  const abortSignal = req.signal;

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, any>) {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
        } catch {
          // stream closed
        }
      }

      let processedCount = 0;
      const errors: string[] = [];

      send({ type: "start", totalPages, startPage: start, endPage: end });

      for (let i = start - 1; i < end; i++) {
        // Check if the client disconnected
        if (abortSignal.aborted) {
          send({ type: "stopped", processedCount, totalPages, reason: "aborted" });
          break;
        }

        const pageNum = i + 1;
        const canvas = canvases[i];

        send({ type: "page_start", page: pageNum, totalPages });

        if (!canvas.imageUrl) {
          errors.push(`Page ${pageNum}: no image URL`);
          send({ type: "page_error", page: pageNum, error: "no image URL" });
          continue;
        }

        try {
          const resolvedUrl = await resolveOcrImageUrl(canvas.imageUrl!);
          const imageRes = await fetch(resolvedUrl);
          if (!imageRes.ok) {
            errors.push(`Page ${pageNum}: image fetch failed (${imageRes.status})`);
            send({ type: "page_error", page: pageNum, error: `image fetch failed (${imageRes.status})` });
            continue;
          }
          const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
          const imageBase64 = imageBuffer.toString("base64");

          const result = await callKandianguji(imageBase64);
          const rawText = computeRawText(result.spatialData);

          await setPage(slug, pageNum, {
            pageNumber: pageNum,
            rawText,
            spatialData: result.spatialData,
            candidateData: result.candidateData,
          });

          processedCount++;
          send({ type: "page_done", page: pageNum, totalPages, processedCount, chars: rawText.length });
        } catch (e: any) {
          errors.push(`Page ${pageNum}: ${e.message}`);
          send({ type: "page_error", page: pageNum, error: e.message });
        }
      }

      // Update index status
      const allProcessed = !abortSignal.aborted && processedCount === (end - start + 1);
      const finalStatus = abortSignal.aborted
        ? (processedCount > 0 ? "partial" : "error")
        : (allProcessed ? "complete" : (processedCount > 0 ? "partial" : "error"));

      await setIndexEntry(slug, { status: finalStatus, pageCount: totalPages });

      // Rebuild search index so full-text search is fast
      try { await rebuildSearchIndex(slug, totalPages); } catch { /* non-critical */ }

      send({
        type: "done",
        success: true,
        slug,
        totalCanvases: totalPages,
        processedCount,
        errors: errors.length > 0 ? errors : undefined,
      });

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  });
}
