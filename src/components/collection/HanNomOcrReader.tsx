"use client";

import {
  KeyboardEvent,
  PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Loader2,
  ScanSearch,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import MiradorViewer from "@/components/mirador/MiradorViewer";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const DEFAULT_OCR_FONT_SIZE = 20;
const MIN_OCR_FONT_SIZE = 16;
const MAX_OCR_FONT_SIZE = 36;
const OCR_FONT_SIZE_STEP = 2;
const EXPORT_BATCH_SIZE = 5;

type ExportScope = "current" | "all" | "range";

export type HanNomOcrCanvas = {
  id: string;
  label: string;
  pageNumber: number;
  imageUrl: string;
  imageServiceId: string;
};

type OcrResponse = {
  available: boolean;
  canvasId?: string;
  reason?: string | null;
  text?: string;
  page?: {
    image_url?: string | null;
    page_number: number;
    ocr_status: string;
  };
  ocrRun?: {
    modelName: string | null;
    modelVersion: string | null;
    status: string;
  };
  units?: Array<{
    bbox: {
      x1: number | null;
      x2: number | null;
      x3: number | null;
      x4: number | null;
      y1: number | null;
      y2: number | null;
      y3: number | null;
      y4: number | null;
    };
    id: string;
    offset: number;
    text: string;
    source: string | null;
    confidence: number | null;
  }>;
};

function getBoxStyle(unit: NonNullable<OcrResponse["units"]>[number]) {
  const xs = [unit.bbox.x1, unit.bbox.x2, unit.bbox.x3, unit.bbox.x4].filter(
    (value): value is number => typeof value === "number"
  );
  const ys = [unit.bbox.y1, unit.bbox.y2, unit.bbox.y3, unit.bbox.y4].filter(
    (value): value is number => typeof value === "number"
  );

  if (xs.length === 0 || ys.length === 0) {
    return null;
  }

  const left = Math.min(...xs) * 100;
  const top = Math.min(...ys) * 100;
  const width = (Math.max(...xs) - Math.min(...xs)) * 100;
  const height = (Math.max(...ys) - Math.min(...ys)) * 100;

  if (width <= 0 || height <= 0) {
    return null;
  }

  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`,
  };
}

function readCanvasIdFromUrl(fallback: string) {
  if (typeof window === "undefined") {
    return fallback;
  }

  return (
    new URLSearchParams(window.location.search).get("canvasId") || fallback
  );
}

function createOcrRequestParams({
  canvas,
  manifestUrl,
  title,
}: {
  canvas: HanNomOcrCanvas;
  manifestUrl: string;
  title: string;
}) {
  const params = new URLSearchParams({
    manifestUrl,
    canvasId: canvas.id,
    pageNumber: String(canvas.pageNumber),
    title,
  });

  if (canvas.imageUrl) {
    params.set("imageUrl", canvas.imageUrl);
  }

  if (canvas.imageServiceId) {
    params.set("imageServiceId", canvas.imageServiceId);
  }

  return params;
}

function createExportFilename(title: string) {
  const sanitizedTitle = title
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 100);

  return `${sanitizedTitle || "han-nom-ocr"}.txt`;
}

function useLiveCanvasId(initialCanvasId: string, fallbackCanvasId: string) {
  const searchParams = useSearchParams();
  const fallback = initialCanvasId || fallbackCanvasId;
  const [canvasId, setCanvasId] = useState(fallback);
  const urlCanvasId = searchParams.get("canvasId") || fallback;

  useEffect(() => {
    setCanvasId(urlCanvasId);
  }, [urlCanvasId]);

  useEffect(() => {
    const handlePopState = () => {
      setCanvasId(readCanvasIdFromUrl(fallback));
    };

    handlePopState();
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [fallback]);

  const selectCanvas = (nextCanvasId: string) => {
    setCanvasId(nextCanvasId);

    const url = new URL(window.location.href);
    url.searchParams.set("canvasId", nextCanvasId);
    window.history.replaceState(window.history.state, "", url);
  };

  return [canvasId, selectCanvas] as const;
}

export default function HanNomOcrReader({
  manifestUrl,
  title,
  initialCanvasId,
  canvases,
  locale,
}: {
  manifestUrl: string;
  title: string;
  initialCanvasId: string;
  canvases: HanNomOcrCanvas[];
  locale: string;
}) {
  const firstCanvasId = canvases[0]?.id || "";
  const [liveCanvasId, selectCanvas] = useLiveCanvasId(
    initialCanvasId,
    firstCanvasId
  );
  const selectedCanvas = useMemo(
    () =>
      canvases.find((canvas) => canvas.id === liveCanvasId) ||
      canvases[0] ||
      null,
    [canvases, liveCanvasId]
  );
  const selectedCanvasIndex = selectedCanvas
    ? canvases.findIndex((canvas) => canvas.id === selectedCanvas.id)
    : -1;
  const hasPreviousPage = selectedCanvasIndex > 0;
  const hasNextPage =
    selectedCanvasIndex >= 0 && selectedCanvasIndex < canvases.length - 1;
  const [ocrData, setOcrData] = useState<OcrResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showBoxes, setShowBoxes] = useState(false);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true);
  const [hoveredUnitId, setHoveredUnitId] = useState<string | null>(null);
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [ocrFontSize, setOcrFontSize] = useState(DEFAULT_OCR_FONT_SIZE);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportScope, setExportScope] = useState<ExportScope>("current");
  const [rangeStart, setRangeStart] = useState("1");
  const [rangeEnd, setRangeEnd] = useState("1");
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const ocrPanelRef = useRef<HTMLDivElement | null>(null);
  const imageScrollerRef = useRef<HTMLDivElement | null>(null);
  const imageDragRef = useRef({
    pointerId: -1,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    moved: false,
  });
  const suppressBoxClickRef = useRef(false);
  const textUnitRefs = useRef(new Map<string, HTMLSpanElement>());

  useEffect(() => {
    if (!selectedCanvas) {
      setOcrData(null);
      return;
    }

    const controller = new AbortController();
    const params = createOcrRequestParams({
      canvas: selectedCanvas,
      manifestUrl,
      title,
    });

    setIsLoading(true);
    setOcrData(null);
    fetch(`/api/han-nom-ocr?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((data: OcrResponse) => {
        setOcrData(data);
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setOcrData({
            available: false,
            reason:
              locale === "vi"
                ? "Không tải được dữ liệu OCR."
                : "Unable to load OCR data.",
          });
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [selectedCanvas, manifestUrl, title, locale]);

  useEffect(() => {
    setActiveUnitId(null);
    setHoveredUnitId(null);
    setImageZoom(1);
    setIsDraggingImage(false);
    imageScrollerRef.current?.scrollTo({ left: 0, top: 0 });
    ocrPanelRef.current?.scrollTo({ top: 0 });
  }, [selectedCanvas?.id]);

  const ocrText = ocrData?.text?.trim() || "";
  const debugImageUrl =
    ocrData?.page?.image_url || selectedCanvas?.imageUrl || "";
  const hasOcr = Boolean(ocrText && ocrData?.units?.length);
  const readOcrDisabled = isLoading || !hasOcr;
  const readOcrTitle = readOcrDisabled
    ? locale === "vi"
      ? "OCR không khả dụng"
      : "OCR not available"
    : showBoxes
    ? locale === "vi"
      ? "Đọc văn bản"
      : "Read document"
    : locale === "vi"
    ? "Đọc OCR"
    : "Read OCR";

  useEffect(() => {
    if (!isLoading && ocrData && !hasOcr) {
      setShowBoxes(false);
      setHoveredUnitId(null);
      setActiveUnitId(null);
    }
  }, [hasOcr, isLoading, ocrData]);

  const navigateToPage = (index: number) => {
    const canvas = canvases[index];

    if (!canvas) {
      return;
    }

    selectCanvas(canvas.id);
  };

  const scrollToUnit = (unitId: string) => {
    setActiveUnitId(unitId);
    setHoveredUnitId(unitId);

    const panel = ocrPanelRef.current;
    const textUnit = textUnitRefs.current.get(unitId);

    if (!panel || !textUnit) {
      return;
    }

    const panelRect = panel.getBoundingClientRect();
    const unitRect = textUnit.getBoundingClientRect();
    const unitOffsetInPanel =
      unitRect.top - panelRect.top + panel.scrollTop - panel.clientHeight / 2;

    panel.scrollTo({
      top: unitOffsetInPanel + unitRect.height / 2,
      behavior: "smooth",
    });
  };

  const handleBoxKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    unitId: string
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      scrollToUnit(unitId);
    }
  };

  const handleImagePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const scroller = imageScrollerRef.current;

    if (!scroller || imageZoom <= 1) {
      return;
    }

    imageDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: scroller.scrollLeft,
      scrollTop: scroller.scrollTop,
      moved: false,
    };
    setIsDraggingImage(true);
    scroller.setPointerCapture(event.pointerId);
  };

  const handleImagePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const scroller = imageScrollerRef.current;
    const drag = imageDragRef.current;

    if (!scroller || !isDraggingImage || drag.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      drag.moved = true;
      suppressBoxClickRef.current = true;
    }

    scroller.scrollLeft = drag.scrollLeft - deltaX;
    scroller.scrollTop = drag.scrollTop - deltaY;
  };

  const stopImageDrag = (event: PointerEvent<HTMLDivElement>) => {
    const scroller = imageScrollerRef.current;
    const drag = imageDragRef.current;

    if (scroller?.hasPointerCapture(event.pointerId)) {
      scroller.releasePointerCapture(event.pointerId);
    }

    if (drag.moved) {
      window.setTimeout(() => {
        suppressBoxClickRef.current = false;
      }, 0);
    }

    setIsDraggingImage(false);
  };

  const handleExportOpenChange = (open: boolean) => {
    if (isExporting) {
      return;
    }

    setIsExportOpen(open);

    if (open) {
      const currentPage = Math.max(1, selectedCanvasIndex + 1);
      setExportScope("current");
      setRangeStart(String(currentPage));
      setRangeEnd(String(currentPage));
      setExportError("");
    }
  };

  const fetchOcrTextForCanvas = async (canvas: HanNomOcrCanvas) => {
    if (
      canvas.id === selectedCanvas?.id &&
      ocrData?.canvasId === canvas.id &&
      ocrData.text !== undefined
    ) {
      return ocrData.text.trim();
    }

    const params = createOcrRequestParams({ canvas, manifestUrl, title });
    const response = await fetch(`/api/han-nom-ocr?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`OCR request failed with status ${response.status}.`);
    }

    const data = (await response.json()) as OcrResponse;
    return data.text?.trim() || "";
  };

  const exportOcrText = async () => {
    let startIndex = selectedCanvasIndex;
    let endIndex = selectedCanvasIndex;

    if (exportScope === "all") {
      startIndex = 0;
      endIndex = canvases.length - 1;
    } else if (exportScope === "range") {
      const parsedStart = Number(rangeStart);
      const parsedEnd = Number(rangeEnd);
      const rangeIsValid =
        Number.isInteger(parsedStart) &&
        Number.isInteger(parsedEnd) &&
        parsedStart >= 1 &&
        parsedEnd <= canvases.length &&
        parsedStart <= parsedEnd;

      if (!rangeIsValid) {
        setExportError(
          locale === "vi"
            ? `Nhập phạm vi hợp lệ từ 1 đến ${canvases.length}.`
            : `Enter a valid range from 1 to ${canvases.length}.`
        );
        return;
      }

      startIndex = parsedStart - 1;
      endIndex = parsedEnd - 1;
    }

    if (startIndex < 0 || endIndex < startIndex) {
      setExportError(
        locale === "vi"
          ? "Không có trang nào để xuất."
          : "There are no pages to export."
      );
      return;
    }

    setIsExporting(true);
    setExportError("");

    try {
      const selectedPages = canvases
        .slice(startIndex, endIndex + 1)
        .map((canvas, index) => ({
          canvas,
          pageNumber: startIndex + index + 1,
        }));
      const exportedPages: Array<{ pageNumber: number; text: string }> = [];

      for (
        let index = 0;
        index < selectedPages.length;
        index += EXPORT_BATCH_SIZE
      ) {
        const batch = selectedPages.slice(index, index + EXPORT_BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async ({ canvas, pageNumber }) => ({
            pageNumber,
            text: await fetchOcrTextForCanvas(canvas),
          }))
        );
        exportedPages.push(...batchResults);
      }

      const unavailableText =
        locale === "vi" ? "[OCR không khả dụng]" : "[OCR unavailable]";
      const content = exportedPages
        .map(
          ({ pageNumber, text }) =>
            `Page ${pageNumber}\n${text || unavailableText}`
        )
        .join("\n\n-----\n\n");
      const blob = new Blob([`\uFEFF${content}\n`], {
        type: "text/plain;charset=utf-8",
      });
      const downloadUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");

      downloadLink.href = downloadUrl;
      downloadLink.download = createExportFilename(title);
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
      setIsExportOpen(false);
    } catch {
      setExportError(
        locale === "vi"
          ? "Không thể tải đầy đủ dữ liệu OCR để xuất."
          : "Unable to load all OCR data for export."
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center justify-end">
        <span title={readOcrTitle}>
          <button
            type="button"
            className={`inline-flex h-10 items-center gap-2 rounded-md border px-4 text-sm font-medium transition-colors ${
              showBoxes
                ? "border-branding-brown bg-branding-brown text-white"
                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            } disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400`}
            onClick={() => setShowBoxes((value) => !value)}
            disabled={readOcrDisabled}
            aria-pressed={showBoxes}
          >
            <ScanSearch className="h-4 w-4" aria-hidden="true" />
            {showBoxes
              ? locale === "vi"
                ? "Đọc văn bản"
                : "Read document"
              : locale === "vi"
              ? "Đọc OCR"
              : "Read OCR"}
          </button>
        </span>
      </div>

      <div className={`flex flex-col gap-6 ${showBoxes ? "lg:flex-row" : ""}`}>
        <div className="min-w-0 flex-1 overflow-hidden">
          {showBoxes ? (
            <div className="flex h-[700px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
              <div
                role="toolbar"
                aria-label={
                  locale === "vi"
                    ? "Công cụ hình ảnh và văn bản OCR"
                    : "Image and OCR text tools"
                }
                className="flex min-h-11 flex-none flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-white px-2 py-1"
              >
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                    onClick={() => navigateToPage(selectedCanvasIndex - 1)}
                    disabled={!hasPreviousPage || isLoading}
                    aria-label={
                      locale === "vi" ? "Trang trước" : "Previous page"
                    }
                    title={locale === "vi" ? "Trang trước" : "Previous page"}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span className="min-w-20 px-1 text-center text-sm text-gray-600">
                    {selectedCanvasIndex + 1} / {canvases.length}
                  </span>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                    onClick={() => navigateToPage(selectedCanvasIndex + 1)}
                    disabled={!hasNextPage || isLoading}
                    aria-label={locale === "vi" ? "Trang sau" : "Next page"}
                    title={locale === "vi" ? "Trang sau" : "Next page"}
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <Dialog
                    open={isExportOpen}
                    onOpenChange={handleExportOpenChange}
                  >
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded text-gray-700 hover:bg-gray-100"
                        aria-label={
                          locale === "vi"
                            ? "Xuất văn bản OCR"
                            : "Export OCR text"
                        }
                        title={
                          locale === "vi"
                            ? "Xuất văn bản OCR"
                            : "Export OCR text"
                        }
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {locale === "vi"
                            ? "Xuất văn bản OCR"
                            : "Export OCR text"}
                        </DialogTitle>
                      </DialogHeader>

                      <fieldset
                        className="flex flex-col gap-3"
                        disabled={isExporting}
                      >
                        <legend className="sr-only">
                          {locale === "vi" ? "Phạm vi xuất" : "Export scope"}
                        </legend>
                        {(
                          [
                            [
                              "current",
                              locale === "vi"
                                ? `Chỉ trang này (Trang ${
                                    selectedCanvasIndex + 1
                                  })`
                                : `This page only (Page ${
                                    selectedCanvasIndex + 1
                                  })`,
                            ],
                            [
                              "all",
                              locale === "vi"
                                ? `Toàn bộ văn bản (${canvases.length} trang)`
                                : `Whole text (${canvases.length} pages)`,
                            ],
                            [
                              "range",
                              locale === "vi" ? "Nhiều trang" : "A page range",
                            ],
                          ] as Array<[ExportScope, string]>
                        ).map(([value, label]) => (
                          <label
                            key={value}
                            className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
                          >
                            <input
                              type="radio"
                              name="ocr-export-scope"
                              value={value}
                              checked={exportScope === value}
                              onChange={() => {
                                setExportScope(value);
                                setExportError("");
                              }}
                              className="h-4 w-4 accent-branding-brown"
                            />
                            <span>{label}</span>
                          </label>
                        ))}
                      </fieldset>

                      {exportScope === "range" ? (
                        <div className="grid grid-cols-2 gap-3">
                          <label className="flex flex-col gap-1.5 text-sm">
                            <span>
                              {locale === "vi" ? "Từ trang" : "From page"}
                            </span>
                            <Input
                              type="number"
                              min={1}
                              max={canvases.length}
                              value={rangeStart}
                              onChange={(event) => {
                                setRangeStart(event.target.value);
                                setExportError("");
                              }}
                              disabled={isExporting}
                            />
                          </label>
                          <label className="flex flex-col gap-1.5 text-sm">
                            <span>
                              {locale === "vi" ? "Đến trang" : "To page"}
                            </span>
                            <Input
                              type="number"
                              min={1}
                              max={canvases.length}
                              value={rangeEnd}
                              onChange={(event) => {
                                setRangeEnd(event.target.value);
                                setExportError("");
                              }}
                              disabled={isExporting}
                            />
                          </label>
                        </div>
                      ) : null}

                      {exportError ? (
                        <p className="text-sm text-destructive" role="alert">
                          {exportError}
                        </p>
                      ) : null}

                      <DialogFooter className="gap-2">
                        <DialogClose asChild>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isExporting}
                          >
                            {locale === "vi" ? "Hủy" : "Cancel"}
                          </Button>
                        </DialogClose>
                        <Button
                          type="button"
                          onClick={exportOcrText}
                          disabled={isExporting}
                        >
                          {isExporting ? (
                            <Loader2
                              className="animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <Download aria-hidden="true" />
                          )}
                          {isExporting
                            ? locale === "vi"
                              ? "Đang xuất..."
                              : "Exporting..."
                            : locale === "vi"
                            ? "Xuất OCR"
                            : "Export OCR"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <div
                    className="mx-1 h-5 w-px bg-gray-200"
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                    onClick={() =>
                      setOcrFontSize((value) =>
                        Math.max(MIN_OCR_FONT_SIZE, value - OCR_FONT_SIZE_STEP)
                      )
                    }
                    disabled={ocrFontSize <= MIN_OCR_FONT_SIZE}
                    aria-label={
                      locale === "vi"
                        ? "Giảm cỡ chữ OCR"
                        : "Decrease OCR font size"
                    }
                    title={
                      locale === "vi"
                        ? "Giảm cỡ chữ OCR"
                        : "Decrease OCR font size"
                    }
                  >
                    <span className="text-xs" aria-hidden="true">
                      A-
                    </span>
                  </button>
                  <span className="min-w-12 text-center text-sm text-gray-600">
                    {ocrFontSize}px
                  </span>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                    onClick={() =>
                      setOcrFontSize((value) =>
                        Math.min(MAX_OCR_FONT_SIZE, value + OCR_FONT_SIZE_STEP)
                      )
                    }
                    disabled={ocrFontSize >= MAX_OCR_FONT_SIZE}
                    aria-label={
                      locale === "vi"
                        ? "Tăng cỡ chữ OCR"
                        : "Increase OCR font size"
                    }
                    title={
                      locale === "vi"
                        ? "Tăng cỡ chữ OCR"
                        : "Increase OCR font size"
                    }
                  >
                    <span className="text-sm" aria-hidden="true">
                      A+
                    </span>
                  </button>
                  <div
                    className="mx-1 h-5 w-px bg-gray-200"
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      setShowBoundingBoxes((value) => !value);
                      setHoveredUnitId(null);
                    }}
                    aria-label={
                      showBoundingBoxes
                        ? locale === "vi"
                          ? "Ẩn khung văn bản"
                          : "Hide bounding boxes"
                        : locale === "vi"
                        ? "Hiện khung văn bản"
                        : "Show bounding boxes"
                    }
                    title={
                      showBoundingBoxes
                        ? locale === "vi"
                          ? "Ẩn khung văn bản"
                          : "Hide bounding boxes"
                        : locale === "vi"
                        ? "Hiện khung văn bản"
                        : "Show bounding boxes"
                    }
                    aria-pressed={showBoundingBoxes}
                  >
                    {showBoundingBoxes ? (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                  <div
                    className="mx-1 h-5 w-px bg-gray-200"
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                    onClick={() =>
                      setImageZoom((value) => Math.max(1, value - 0.25))
                    }
                    disabled={imageZoom <= 1}
                    aria-label={locale === "vi" ? "Thu nhỏ" : "Zoom out"}
                    title={locale === "vi" ? "Thu nhỏ" : "Zoom out"}
                  >
                    <ZoomOut className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span className="min-w-12 text-center text-sm text-gray-600">
                    {Math.round(imageZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
                    onClick={() =>
                      setImageZoom((value) => Math.min(3, value + 0.25))
                    }
                    disabled={imageZoom >= 3}
                    aria-label={locale === "vi" ? "Phóng to" : "Zoom in"}
                    title={locale === "vi" ? "Phóng to" : "Zoom in"}
                  >
                    <ZoomIn className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {debugImageUrl ? (
                <div
                  ref={imageScrollerRef}
                  className={`min-h-0 flex-1 overflow-auto ${
                    imageZoom > 1
                      ? isDraggingImage
                        ? "cursor-grabbing"
                        : "cursor-grab"
                      : ""
                  }`}
                  onPointerDown={handleImagePointerDown}
                  onPointerMove={handleImagePointerMove}
                  onPointerUp={stopImageDrag}
                  onPointerCancel={stopImageDrag}
                  onPointerLeave={(event) => {
                    if (isDraggingImage) {
                      stopImageDrag(event);
                    }
                  }}
                >
                  <div
                    className="relative mx-auto"
                    style={{ width: `${imageZoom * 100}%` }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={debugImageUrl}
                      alt={
                        selectedCanvas?.label ||
                        (locale === "vi" ? "Trang OCR" : "OCR page")
                      }
                      className="block h-auto w-full"
                    />
                    {showBoundingBoxes ? (
                      <div className="absolute inset-0">
                        {ocrData?.units?.map((unit) => {
                          const boxStyle = getBoxStyle(unit);

                          if (!boxStyle) {
                            return null;
                          }

                          const isHighlighted =
                            hoveredUnitId === unit.id ||
                            activeUnitId === unit.id;

                          return (
                            <div
                              key={unit.id}
                              role="button"
                              tabIndex={0}
                              className={`absolute border transition-colors ${
                                isHighlighted
                                  ? "border-blue-600 bg-blue-500/25"
                                  : "border-red-500/70 bg-red-500/10 hover:bg-red-500/20"
                              }`}
                              style={boxStyle}
                              title={unit.text}
                              onMouseEnter={() => setHoveredUnitId(unit.id)}
                              onMouseLeave={() => setHoveredUnitId(null)}
                              onClick={() => {
                                if (suppressBoxClickRef.current) {
                                  return;
                                }

                                scrollToUnit(unit.id);
                              }}
                              onKeyDown={(event) =>
                                handleBoxKeyDown(event, unit.id)
                              }
                            />
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-gray-500">
                  {locale === "vi"
                    ? "Đang tải trang OCR..."
                    : "Loading OCR page..."}
                </div>
              )}
            </div>
          ) : (
            <MiradorViewer manifestUrl={manifestUrl} canvasId={liveCanvasId} />
          )}
        </div>

        {showBoxes && (
          <aside className="relative z-10 min-w-0 rounded-lg border border-gray-200 bg-white lg:w-[420px] lg:flex-none">
            <div
              ref={ocrPanelRef}
              className="h-[700px] overflow-y-auto px-5 py-5"
            >
              {isLoading ? (
                <div className="text-sm text-gray-500">
                  {locale === "vi" ? "Đang tải OCR..." : "Loading OCR..."}
                </div>
              ) : (
                <div
                  className="whitespace-pre-wrap break-words text-branding-black"
                  style={{ fontSize: `${ocrFontSize}px`, lineHeight: 1.625 }}
                >
                  {ocrData?.units?.map((unit) => (
                    <span
                      key={unit.id}
                      ref={(node) => {
                        if (node) {
                          textUnitRefs.current.set(unit.id, node);
                        } else {
                          textUnitRefs.current.delete(unit.id);
                        }
                      }}
                      onMouseEnter={() => setHoveredUnitId(unit.id)}
                      onMouseLeave={() => setHoveredUnitId(null)}
                      className={
                        hoveredUnitId === unit.id || activeUnitId === unit.id
                          ? "rounded-sm bg-blue-100 text-blue-900 ring-1 ring-blue-400"
                          : ""
                      }
                    >
                      <LookupableHanNomText
                        text={unit.text}
                        inline
                        className="inline"
                        style={{
                          fontSize: `${ocrFontSize}px`,
                          lineHeight: 1.625,
                        }}
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </section>
  );
}
