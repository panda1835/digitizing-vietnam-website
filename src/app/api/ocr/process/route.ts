import { NextRequest, NextResponse } from "next/server";
import { setIndexEntry, setPage, getPage, computeRawText, rebuildSearchIndex } from "@/lib/ocr-store";
import { callKandianguji } from "@/lib/kandianguji-ocr";
import { pdf } from "pdf-to-img";
import fs from "fs/promises";
import path from "path";

/**
 * POST /api/ocr/process
 * Body: { slug: string, startPage?: number, endPage?: number, skipExisting?: boolean }
 *
 * Reads data/ocr/{slug}/source.pdf, converts each page to an image,
 * sends it to Kandianguji OCR, and writes data/ocr/{slug}/page_NNN.json.
 * Streams NDJSON progress so the client can show live updates.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const slug: string = body?.slug;
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const pdfPath = path.join(process.cwd(), "data", "ocr", slug, "source.pdf");
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await fs.readFile(pdfPath);
  } catch {
    return NextResponse.json(
      { error: `PDF not found for slug "${slug}". Upload it first.` },
      { status: 404 }
    );
  }

  let doc: Awaited<ReturnType<typeof pdf>>;
  try {
    doc = await pdf(pdfBuffer, { scale: 2 });
  } catch (e: any) {
    return NextResponse.json({ error: `Failed to parse PDF: ${e.message}` }, { status: 500 });
  }

  const totalPages = doc.length;
  const startPage = body.startPage ?? 1;
  const endPage = Math.min(body.endPage ?? totalPages, totalPages);
  const skipExisting = body.skipExisting ?? false;

  await setIndexEntry(slug, { status: "processing", pageCount: totalPages });

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
      let skippedCount = 0;
      const errors: string[] = [];

      send({ type: "start", totalPages, startPage, endPage });

      for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
        if (abortSignal.aborted) {
          send({ type: "stopped", processedCount, skippedCount, totalPages, reason: "aborted" });
          break;
        }

        // Skip existing pages if requested
        if (skipExisting) {
          try {
            const existing = await getPage(slug, pageNum);
            if (existing && existing.spatialData && existing.spatialData.length > 0) {
              skippedCount++;
              send({ type: "page_skipped", page: pageNum, totalPages });
              continue;
            }
          } catch {
            // page doesn't exist, process it
          }
        }

        send({ type: "page_start", page: pageNum, totalPages });

        try {
          const pageImage = await doc.getPage(pageNum);
          const imageBase64 = pageImage.toString("base64");

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

          // Write empty page on error
          try {
            await setPage(slug, pageNum, {
              pageNumber: pageNum,
              rawText: "",
              spatialData: [],
            });
          } catch {
            // ignore write error
          }
        }
      }

      // Determine final status
      const allProcessed = !abortSignal.aborted && (processedCount + skippedCount) === (endPage - startPage + 1);
      const finalStatus = abortSignal.aborted
        ? (processedCount > 0 || skippedCount > 0 ? "partial" : "error")
        : (allProcessed ? "complete" : (processedCount > 0 || skippedCount > 0 ? "partial" : "error"));

      await setIndexEntry(slug, { status: finalStatus, pageCount: totalPages });

      try { await rebuildSearchIndex(slug, totalPages); } catch { /* non-critical */ }

      send({
        type: "done",
        success: finalStatus === "complete",
        slug,
        totalPages,
        processedCount,
        skippedCount,
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
