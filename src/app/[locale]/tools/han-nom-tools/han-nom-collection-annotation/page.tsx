"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Image from "next/image";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";
import { Pencil } from "lucide-react";
import localFont from "next/font/local";
import InputMethodSelector from "@/app/[locale]/tools/han-nom-tools/han-nom-input-method-editor/InputMethodSelector";
import HandwritingPad from "@/app/[locale]/tools/han-nom-dictionaries/HandwritingPad";
import CompactRadicals from "@/app/[locale]/tools/han-nom-tools/han-nom-input-method-editor/CompactRadicals";
import QuocNguSingleChar from "@/app/[locale]/tools/han-nom-tools/han-nom-input-method-editor/QuocNguSingleChar";
import {
  getRadicals,
  type Radical,
} from "@/app/[locale]/tools/han-nom-tools/han-nom-input-method-editor/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

interface Annotation {
  id: string;
  type: string;
  body?: {
    type: string;
    value: string;
  }[];
  target: {
    source: string;
    selector?: {
      type: string;
      value: string;
    };
  };
}

interface BoundingBox {
  id: string;
  order: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}

type InputMethod = "quoc-ngu" | "handwriting" | "radical";

export default function HanNomCollectionAnnotationPage() {
  const t = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const [identifier, setIdentifier] = useState("cfxpnvx332");
  const [imageUrl, setImageUrl] = useState("");
  const [annotations, setAnnotations] = useState<BoundingBox[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageSize, setImageSize] = useState({ width: 1280, height: 1 });
  const [imageScale, setImageScale] = useState({ x: 1, y: 1 });
  const [imageRenderSize, setImageRenderSize] = useState({
    width: 0,
    height: 0,
  });
  const [annotationScale, setAnnotationScale] = useState({ x: 1, y: 1 });
  const [annotationCanvasHeight, setAnnotationCanvasHeight] = useState(0);
  const annotationContainerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const editorDragStartRef = useRef<{
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingCursorPosition, setEditingCursorPosition] = useState(0);
  const editingTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [inputMethod, setInputMethod] = useState<InputMethod>("quoc-ngu");
  const [radicals, setRadicals] = useState<Radical[]>([]);
  const [editorPosition, setEditorPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [isDraggingEditor, setIsDraggingEditor] = useState(false);
  const [scrollTick, setScrollTick] = useState(0);
  const [draggingRowIndex, setDraggingRowIndex] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [drawMode, setDrawMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingRect, setDrawingRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);
  const drawingRectRef = useRef<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const drawOverlayRef = useRef<HTMLDivElement>(null);

  const baseAnnotationFontSize = useMemo(() => {
    if (annotations.length === 0) return 12;
    let minSize = Infinity;
    annotations.forEach((box) => {
      const textLength = Math.max(1, Array.from(box.text || "").length);
      const maxByWidth = box.width;
      const maxByHeight = box.height / textLength;
      const candidate = Math.min(maxByWidth, maxByHeight) * 0.8;
      if (candidate > 0 && candidate < minSize) {
        minSize = candidate;
      }
    });
    if (!Number.isFinite(minSize)) return 12;
    return Math.max(6, minSize);
  }, [annotations]);

  useEffect(() => {
    getRadicals().then(setRadicals);
  }, []);

  const loadAnnotations = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Construct image URL
      const imgUrl = `https://triclops.library.columbia.edu/iiif/2/standard/cul:${identifier}/full/1280,/0/default.jpg`;
      setImageUrl(imgUrl);

      // Try to fetch annotation from local file first, then from remote
      let data = null;
      try {
        const localUrl = `/api/han-nom-collection-annotation/${identifier}.json`;
        const localResponse = await fetch(localUrl);
        if (localResponse.ok) {
          data = await localResponse.json();
        }
      } catch (localErr) {
        console.log("Local annotation not found, trying remote...");
      }

      // If local fetch failed, try remote
      if (!data) {
        const annotationUrl = `https://triclops.library.columbia.edu/iiif/2/standard/cul:${identifier}.json`;
        const response = await fetch(annotationUrl);
        if (!response.ok) {
          throw new Error("Failed to fetch annotations from remote");
        }
        data = await response.json();
      }

      // Parse annotations and extract bounding boxes
      const boxes = parseAnnotations(data);
      setAnnotations(boxes);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load annotations"
      );
      console.error("Error loading annotations:", err);
    } finally {
      setLoading(false);
    }
  }, [identifier]);

  useEffect(() => {
    if (identifier) {
      loadAnnotations();
    }
  }, [identifier, loadAnnotations]);

  const updateImageScale = useCallback(() => {
    const img = imageElementRef.current;
    if (!img || !imageSize.width || !imageSize.height) return;
    const nextWidth = img.clientWidth;
    const nextHeight = img.clientHeight;
    setImageRenderSize({ width: nextWidth, height: nextHeight });
    setImageScale({
      x: nextWidth / imageSize.width,
      y: nextHeight / imageSize.height,
    });
  }, [imageSize.height, imageSize.width]);

  useEffect(() => {
    updateImageScale();
    const img = imageElementRef.current;
    if (!img) return;
    const observer = new ResizeObserver(updateImageScale);
    observer.observe(img);
    return () => observer.disconnect();
  }, [updateImageScale]);

  useEffect(() => {
    const container = annotationContainerRef.current;
    if (!container || !imageSize.width || !imageSize.height) return;

    const updateScale = () => {
      const nextScale = container.clientWidth / imageSize.width;
      setAnnotationScale({ x: nextScale || 1, y: nextScale || 1 });
      setAnnotationCanvasHeight(imageSize.height * (nextScale || 1));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [imageSize.width, imageSize.height]);

  const openEditor = (index: number) => {
    setEditingIndex(index);
    setEditingText(annotations[index]?.text || "");
    setEditingCursorPosition(annotations[index]?.text?.length || 0);
    setEditorOpen(true);
    setEditorPosition(null);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null) return;
    setAnnotations((prev) =>
      prev.map((box, index) =>
        index === editingIndex ? { ...box, text: editingText } : box
      )
    );
    setEditorOpen(false);
  };

  const handleRemoveAnnotation = () => {
    if (editingIndex === null) return;
    setAnnotations((prev) => prev.filter((_, index) => index !== editingIndex));
    setEditorOpen(false);
  };

  useEffect(() => {
    if (!editorOpen || !editingTextareaRef.current) return;
    editingTextareaRef.current.focus();
    editingTextareaRef.current.setSelectionRange(
      editingCursorPosition,
      editingCursorPosition
    );
  }, [editingCursorPosition, editorOpen]);

  const handleEditingChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditingText(e.target.value);
    setEditingCursorPosition(e.target.selectionStart || 0);
  };

  const handleEditingClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    setEditingCursorPosition(e.currentTarget.selectionStart || 0);
  };

  const handleEditingKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    setEditingCursorPosition(e.currentTarget.selectionStart || 0);
  };

  const handleCharacterSelect = (char: string) => {
    const before = editingText.substring(0, editingCursorPosition);
    const after = editingText.substring(editingCursorPosition);
    const nextText = before + char + after;
    setEditingText(nextText);
    setEditingCursorPosition(editingCursorPosition + char.length);
  };

  const handleRowDragStart = (index: number) => {
    setDraggingRowIndex(index);
  };

  const handleRowDrop = (targetIndex: number) => {
    if (draggingRowIndex === null || draggingRowIndex === targetIndex) {
      setDraggingRowIndex(null);
      return;
    }
    setAnnotations((prev) => {
      const activeId = editingIndex !== null ? prev[editingIndex]?.id : null;
      const next = [...prev];
      const [moved] = next.splice(draggingRowIndex, 1);
      next.splice(targetIndex, 0, moved);
      const normalized = next.map((item, idx) => ({
        ...item,
        order: idx + 1,
      }));
      if (activeId) {
        const nextIndex = normalized.findIndex((item) => item.id === activeId);
        if (nextIndex !== -1) {
          setEditingIndex(nextIndex);
        }
      }
      return normalized;
    });
    setDraggingRowIndex(null);
  };

  const editorBox = useMemo(() => {
    if (editingIndex === null) return null;
    const box = annotations[editingIndex];
    if (!box) return null;
    if (editorPosition) {
      return { ...editorPosition, editorWidth: 360 };
    }
    const imageRect = imageElementRef.current?.getBoundingClientRect();
    if (!imageRect) return null;
    const editorWidth = 360;
    const offset = 12;
    const boxLeft =
      imageRect.left + window.scrollX + box.x * imageScale.x;
    const boxTop =
      imageRect.top + window.scrollY + box.y * imageScale.y;
    const boxWidth = box.width * imageScale.x;
    const left = boxLeft + boxWidth + offset;
    const top = boxTop - 8;
    return { left, top, editorWidth };
  }, [
    annotations,
    editingIndex,
    editorPosition,
    imageScale.x,
    imageScale.y,
    scrollTick,
  ]);

  const startEditorDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!editorBox) return;
    const offsetX = e.clientX - editorBox.left;
    const offsetY = e.clientY - editorBox.top;
    editorDragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX,
      offsetY,
    };
    setIsDraggingEditor(true);
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDraggingEditor) return;
    const handleMove = (e: MouseEvent) => {
      if (!editorDragStartRef.current) return;
      const nextLeft = e.clientX - editorDragStartRef.current.offsetX;
      const nextTop = e.clientY - editorDragStartRef.current.offsetY;
      setEditorPosition({ left: nextLeft, top: nextTop });
    };
    const handleUp = () => {
      editorDragStartRef.current = null;
      setIsDraggingEditor(false);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isDraggingEditor]);

  useEffect(() => {
    const handleScroll = () => setScrollTick((prev) => prev + 1);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toImageCoords = (x: number, y: number) => ({
    x: x / imageScale.x,
    y: y / imageScale.y,
  });

  const getOverlayPoint = (clientX: number, clientY: number) => {
    const rect = drawOverlayRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleDrawStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!drawMode || !imageRenderSize.width || !imageRenderSize.height) return;
    const point = getOverlayPoint(e.clientX, e.clientY);
    if (!point) return;
    drawStartRef.current = { x: point.x, y: point.y };
    const nextRect = { left: point.x, top: point.y, width: 0, height: 0 };
    drawingRectRef.current = nextRect;
    setDrawingRect(nextRect);
    setIsDrawing(true);
    e.preventDefault();
  };

  const handleDrawMove = (clientX: number, clientY: number) => {
    if (!drawMode || !drawStartRef.current) return;
    const point = getOverlayPoint(clientX, clientY);
    if (!point) return;
    const left = Math.min(drawStartRef.current.x, point.x);
    const top = Math.min(drawStartRef.current.y, point.y);
    const width = Math.abs(drawStartRef.current.x - point.x);
    const height = Math.abs(drawStartRef.current.y - point.y);
    const nextRect = { left, top, width, height };
    drawingRectRef.current = nextRect;
    setDrawingRect(nextRect);
  };

  const handleDrawEnd = () => {
    const finalRect = drawingRectRef.current;
    if (!drawMode || !drawStartRef.current || !finalRect) {
      drawStartRef.current = null;
      setDrawingRect(null);
      drawingRectRef.current = null;
      setIsDrawing(false);
      return;
    }
    if (finalRect.width < 4 || finalRect.height < 4) {
      drawStartRef.current = null;
      setDrawingRect(null);
      drawingRectRef.current = null;
      setIsDrawing(false);
      return;
    }
    const topLeft = toImageCoords(finalRect.left, finalRect.top);
    const bottomRight = toImageCoords(
      finalRect.left + finalRect.width,
      finalRect.top + finalRect.height
    );
    setAnnotations((prev) => {
      const nextOrder =
        prev.length === 0
          ? 1
          : Math.max(...prev.map((item) => item.order)) + 1;
      const next = [
        ...prev,
        {
          id: crypto.randomUUID(),
          order: nextOrder,
          x: topLeft.x,
          y: topLeft.y,
          width: bottomRight.x - topLeft.x,
          height: bottomRight.y - topLeft.y,
          text: "",
        },
      ];
      setEditingIndex(next.length - 1);
      setEditingText("");
      setEditorOpen(true);
      return next;
    });
    drawStartRef.current = null;
    setDrawingRect(null);
    drawingRectRef.current = null;
    setIsDrawing(false);
  };

  useEffect(() => {
    if (!isDrawing) return;

    const handleWindowMove = (e: MouseEvent) => {
      handleDrawMove(e.clientX, e.clientY);
    };
    const handleWindowUp = () => {
      handleDrawEnd();
    };
    window.addEventListener("mousemove", handleWindowMove);
    window.addEventListener("mouseup", handleWindowUp);
    return () => {
      window.removeEventListener("mousemove", handleWindowMove);
      window.removeEventListener("mouseup", handleWindowUp);
    };
  }, [isDrawing, drawMode]);

  const parseAnnotations = (data: any): BoundingBox[] => {
    const boxes: BoundingBox[] = [];
    let orderCounter = 1;

    // Handle the OCR result format from the JSON file
    if (data.data?.details?.details) {
      const details = data.data.details.details;

      details.forEach((item: any) => {
        const points = item.points; // [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
        const transcription = item.transcription || "";

        if (points && points.length === 4) {
          // Calculate bounding box from points
          const x = Math.min(
            points[0][0],
            points[1][0],
            points[2][0],
            points[3][0]
          );
          const y = Math.min(
            points[0][1],
            points[1][1],
            points[2][1],
            points[3][1]
          );
          const maxX = Math.max(
            points[0][0],
            points[1][0],
            points[2][0],
            points[3][0]
          );
          const maxY = Math.max(
            points[0][1],
            points[1][1],
            points[2][1],
            points[3][1]
          );
          const width = maxX - x;
          const height = maxY - y;

          boxes.push({
            id: crypto.randomUUID(),
            order: orderCounter++,
            x,
            y,
            width,
            height,
            text: transcription,
          });
        }
      });
    }

    return boxes;
  };

  const handleIdentifierChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newIdentifier = formData.get("identifier") as string;
    if (newIdentifier) {
      setIdentifier(newIdentifier);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Han-Nom Collection Annotation Editor"
        subtitle="View and edit annotations for Han-Nom collection images"
        breadcrumbItems={[
          { label: "Home", href: `/${locale}` },
          { label: "Tools", href: `/${locale}/tools` },
          { label: "Han-Nom Tools", href: `/${locale}/tools/han-nom-tools` },
          { label: "Annotation Editor" },
        ]}
        locale={locale}
      />

      <div className="mb-6 mt-8">
        <form onSubmit={handleIdentifierChange} className="flex gap-2">
          <input
            type="text"
            name="identifier"
            defaultValue={identifier}
            placeholder="Enter identifier (e.g., cul:cfxpnvx332)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Load
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!loading && imageUrl && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left side - Image */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Original Image</h2>
            <div className="mb-3 flex items-center gap-2">
              <Button
                type="button"
                variant={drawMode ? "default" : "outline"}
                onClick={() => setDrawMode((prev) => !prev)}
              >
                {drawMode ? "Drawing: On" : "Add Bounding Box"}
              </Button>
              {drawMode && (
                <span className="text-sm text-gray-500">
                  Drag on the image to draw a bounding box
                </span>
              )}
            </div>
            <div
              ref={imageContainerRef}
              className="relative overflow-auto max-h-[800px] border border-gray-200 rounded"
            >
              <div className="relative">
                <Image
                  src={imageUrl}
                  alt="Han-Nom document"
                  width={imageSize.width}
                  height={imageSize.height}
                  className="w-full h-auto"
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    imageElementRef.current = img;
                    setImageSize({
                      width: img.naturalWidth,
                      height: img.naturalHeight,
                    });
                  }}
                  unoptimized
                />
                <div
                  className="absolute left-0 top-0"
                  style={{
                    width: imageRenderSize.width,
                    height: imageRenderSize.height,
                  }}
                >
                  <div
                    ref={drawOverlayRef}
                    className={`absolute inset-0 ${
                      drawMode
                        ? "cursor-crosshair z-20"
                        : "pointer-events-none cursor-default"
                    }`}
                    onMouseDown={handleDrawStart}
                  />
                  {drawingRect && (
                    <div
                      className="absolute border-2 border-blue-500 bg-blue-500/10"
                      style={{
                        left: drawingRect.left,
                        top: drawingRect.top,
                        width: drawingRect.width,
                        height: drawingRect.height,
                      }}
                    />
                  )}
                  {annotations.map((box, index) => (
                    <div
                      key={box.id}
                      className={`group absolute border-2 transition overflow-visible ${
                        (editorOpen && editingIndex === index) ||
                        (!editorOpen && hoveredIndex === index)
                          ? "border-blue-500 bg-blue-500/15"
                          : "border-red-500 bg-red-500/10"
                      } ${drawMode ? "pointer-events-none" : ""}`}
                      style={{
                        left: box.x * imageScale.x,
                        top: box.y * imageScale.y,
                        width: box.width * imageScale.x,
                        height: box.height * imageScale.y,
                      }}
                      onMouseEnter={() => {
                        if (!editorOpen) setHoveredIndex(index);
                      }}
                      onMouseLeave={() => {
                        if (!editorOpen) setHoveredIndex(null);
                      }}
                    >
                      <div className="absolute inset-0 overflow-hidden" />
                      <button
                        type="button"
                        onClick={() => openEditor(index)}
                        className="absolute -right-2 -top-2 z-10 rounded bg-white/95 p-1 text-red-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                        aria-label="Edit annotation"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Annotations */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <h2 className="text-xl font-semibold mb-4">
              Annotations ({annotations.length})
            </h2>
            <div
              ref={annotationContainerRef}
              className="relative overflow-auto max-h-[800px] border border-gray-200 rounded bg-gray-50"
            >
              {imageUrl && (
                <div
                  className="relative"
                  style={{ height: annotationCanvasHeight }}
                >
                  <div
                    className="relative"
                    style={{
                      width: "100%",
                      height: "100%",
                    }}
                  >
                    {annotations.map((box, index) => (
                      <div
                        key={box.id}
                        className={`group absolute border-2 flex items-center justify-center overflow-visible transition ${
                          !editorOpen && hoveredIndex === index
                            ? "border-blue-500 bg-blue-500/15"
                            : "border-red-500 bg-red-500/10"
                        }`}
                        style={
                          {
                            left: box.x * annotationScale.x,
                            top: box.y * annotationScale.y,
                            width: box.width * annotationScale.x,
                            height: box.height * annotationScale.y,
                            "--annotation-font-size": `${
                              baseAnnotationFontSize *
                              Math.min(annotationScale.x, annotationScale.y)
                            }px`,
                          } as React.CSSProperties
                        }
                        onMouseEnter={() => {
                          if (!editorOpen) setHoveredIndex(index);
                        }}
                        onMouseLeave={() => {
                          if (!editorOpen) setHoveredIndex(null);
                        }}
                      >
                        <div className="absolute inset-0 overflow-hidden" />
                        {box.text && (
                          <div
                            className="h-full w-full flex items-center justify-center"
                            style={{
                              writingMode: "vertical-rl",
                              textOrientation: "upright",
                            }}
                          >
                            <LookupableHanNomText
                              text={box.text}
                              className="text-[18px] leading-none "
                            />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditor(index)}
                          className="absolute -right-2 -top-2 z-10 rounded bg-white/95 p-1 text-red-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                          aria-label="Edit annotation"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {annotations.length === 0 && !loading && (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  No annotations found
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Annotation List */}
      {annotations.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Annotation Details</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Text
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {annotations.map((box, index) => (
                  <tr
                    key={box.id}
                    className={`hover:bg-gray-50 ${
                      draggingRowIndex === index ? "opacity-50" : ""
                    }`}
                    draggable
                    onDragStart={() => handleRowDragStart(index)}
                    onDragEnd={() => setDraggingRowIndex(null)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleRowDrop(index)}
                    onMouseEnter={() => {
                      if (!editorOpen) setHoveredIndex(index);
                    }}
                    onMouseLeave={() => {
                      if (!editorOpen) setHoveredIndex(null);
                    }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {box.text ? (
                          <LookupableHanNomText
                            text={box.text}
                            className="text-lg"
                          />
                        ) : (
                          <span className="text-gray-400">(empty)</span>
                        )}
                        <button
                          type="button"
                          onClick={() => openEditor(index)}
                          className="rounded border border-gray-200 bg-white p-1 text-gray-600 hover:text-gray-900"
                          aria-label="Edit annotation"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editorOpen && editingIndex !== null && editorBox && (
        <div
          className="absolute z-50"
          style={{
            left: editorBox.left,
            top: editorBox.top,
            width: editorBox.editorWidth,
          }}
        >
          <div className="rounded-lg border border-gray-200 bg-white shadow-lg p-4">
            <div
              className="flex items-start justify-between gap-2 mb-3 cursor-move"
              onMouseDown={startEditorDrag}
            >
              <div className="text-sm font-semibold text-gray-700">
                Edit Annotation
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditorOpen(false)}
              >
                Close
              </Button>
            </div>
            <Textarea
              ref={editingTextareaRef}
              value={editingText}
              onChange={handleEditingChange}
              onClick={handleEditingClick}
              onKeyUp={handleEditingKeyUp}
              placeholder="Enter annotation text"
              className={`${NomNaTong.className} min-h-[120px] text-lg`}
            />
            <div className="mt-4 space-y-3">
              <InputMethodSelector
                value={inputMethod}
                onChange={setInputMethod}
              />
              <div className="border rounded-lg p-3 bg-gray-50">
                {inputMethod === "quoc-ngu" && (
                  <QuocNguSingleChar
                    onCharacterSelect={handleCharacterSelect}
                  />
                )}
                {inputMethod === "handwriting" && (
                  <HandwritingPad onSelect={handleCharacterSelect} />
                )}
                {inputMethod === "radical" && (
                  <CompactRadicals
                    radicals={radicals}
                    onCharacterSelect={handleCharacterSelect}
                  />
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 justify-end">
              <Button variant="destructive" onClick={handleRemoveAnnotation}>
                Remove
              </Button>
              <Button onClick={handleSaveEdit}>Save</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
