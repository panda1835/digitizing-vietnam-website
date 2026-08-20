"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Merriweather } from "next/font/google";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Quote,
  ZoomIn,
} from "lucide-react";

import { Link, useRouter } from "@/i18n/routing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

interface PageResponse {
  source: {
    slug: string;
    title: string;
    author: string | null;
    year: number | null;
    pageCount: number;
    provenance: string;
    meanConfidence: number | null;
    isSpread: boolean;
  };
  page: {
    pageNumber: number;
    pageLabel: string | null;
    text: string;
    confidence: number | null;
    method: string | null;
  };
  highlight: { start: number; end: number; match: string; similarity: number } | null;
  highlightFailed: boolean;
}

function confidenceTone(confidence: number | null) {
  if (confidence === null) return { label: "—", className: "bg-branding-black/5 text-branding-black/50" };
  const pct = `${Math.round(confidence * 100)}%`;
  if (confidence >= 0.95) return { label: pct, className: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (confidence >= 0.85) return { label: pct, className: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: pct, className: "bg-red-50 text-red-700 border-red-200" };
}

export default function CorpusReader({ slug, locale }: { slug: string; locale: string }) {
  const vi = locale === "vi";
  const router = useRouter();
  const searchParams = useSearchParams();

  const pageParam = Number(searchParams.get("page") ?? 1) || 1;
  const [data, setData] = useState<PageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState(String(pageParam));

  const markRef = useRef<HTMLElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ slug, page: String(pageParam) });
    for (const key of ["s", "e", "q"]) {
      const value = searchParams.get(key);
      if (value !== null) params.set(key, value);
    }
    try {
      const response = await fetch(`/api/corpus/page?${params.toString()}`);
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Could not load this page");
      setData(json);
    } catch (caught: any) {
      setError(caught?.message ?? "Could not load this page");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [slug, pageParam, searchParams]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPageInput(String(pageParam));
  }, [pageParam]);

  useEffect(() => {
    if (markRef.current) {
      markRef.current.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [data]);

  const goto = (page: number) => {
    const total = data?.source.pageCount ?? 1;
    const clamped = Math.min(Math.max(1, page), total);
    // Dropping s/e/q: they belong to the citation that opened this page, and
    // carrying them onto a different page would highlight the wrong thing.
    router.replace(`/research/han-nom/corpus/${slug}?page=${clamped}`);
  };

  const renderText = () => {
    if (!data) return null;
    const { text } = data.page;
    const highlight = data.highlight;

    if (!highlight) {
      return <span>{text}</span>;
    }

    return (
      <>
        <span>{text.slice(0, highlight.start)}</span>
        <mark
          ref={markRef as any}
          className="bg-yellow-200 dark:bg-yellow-700/50 rounded-sm px-0.5"
        >
          {text.slice(highlight.start, highlight.end)}
        </mark>
        <span>{text.slice(highlight.end)}</span>
      </>
    );
  };

  const tone = confidenceTone(data?.page.confidence ?? null);
  const imageUrl = `/api/corpus/page-image/${slug}/${pageParam}`;

  return (
    <div className="space-y-5">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => goto(pageParam - 1)} disabled={pageParam <= 1}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            const parsed = Number(pageInput);
            if (Number.isFinite(parsed)) goto(parsed);
          }}
          className="flex items-center gap-2"
        >
          <Input
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value)}
            className="w-20 h-9 text-center"
            aria-label={vi ? "Số trang quét" : "Scanned page number"}
          />
          <span className="text-sm text-muted-foreground">
            / {data?.source.pageCount ?? "…"}
          </span>
        </form>

        <Button
          variant="outline"
          size="sm"
          onClick={() => goto(pageParam + 1)}
          disabled={!!data && pageParam >= data.source.pageCount}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {data?.page.pageLabel && (
          <Badge variant="outline" className="font-normal">
            {vi ? "trang in" : "printed"} {data.page.pageLabel}
          </Badge>
        )}

        <Badge variant="outline" className={cn("font-normal", tone.className)}>
          OCR {tone.label}
        </Badge>

        {data && (
          <Badge variant="outline" className="font-normal text-[11px]">
            {data.page.method ?? data.source.provenance}
          </Badge>
        )}

        <div className="ml-auto">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Quote className="h-3.5 w-3.5 mr-1.5" />
                {vi ? "Trích dẫn" : "Cite"}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{vi ? "Trích dẫn trang này" : "Cite this page"}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-branding-black/80 leading-relaxed">
                {data?.source.author ? `${data.source.author}. ` : ""}
                <em>{data?.source.title}</em>
                {data?.source.year ? `, ${data.source.year}` : ""}.{" "}
                {vi ? "tr." : "p."} {data?.page.pageLabel ?? data?.page.pageNumber}. Digitizing Vietnam.
              </p>
              <p className="text-xs text-muted-foreground break-all">
                {typeof window !== "undefined" ? window.location.href : ""}
              </p>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* the honest failure state — see locate-span.ts */}
      {data?.highlightFailed && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
          <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            {vi
              ? "Không tìm thấy đoạn được trích trên trang này. Bản chuyển tự có thể đã được sửa kể từ khi trích dẫn được tạo."
              : "The quoted passage could not be located on this page. The transcription may have been corrected since this citation was created."}
          </div>
        </div>
      )}

      {data?.highlight && data.highlight.match !== "exact" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm text-amber-900 flex gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          {vi
            ? `Đoạn được định vị gần đúng (${data.highlight.similarity}) do khác biệt OCR — hãy đối chiếu với ảnh quét.`
            : `Span located approximately (${data.highlight.similarity}) because of OCR variance — check it against the scan.`}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* image beside transcription */}
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <div className="lg:sticky lg:top-24">
          <Dialog>
            <DialogTrigger asChild>
              <button className="group relative w-full rounded-xl overflow-hidden border border-branding-brown/15 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={
                    vi
                      ? `Ảnh quét trang ${pageParam}`
                      : `Scanned page ${pageParam}`
                  }
                  className="w-full h-auto"
                  loading="eager"
                />
                <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/60 text-white text-[11px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="h-3 w-3" />
                  {vi ? "Phóng to" : "Enlarge"}
                </span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-[92vw] p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="w-full h-auto" />
            </DialogContent>
          </Dialog>
          <p className="text-[11px] text-muted-foreground mt-2">
            {data?.source.isSpread
              ? vi
                ? "Ảnh quét là trang đôi — một ảnh gồm hai trang in."
                : "This scan is a double-page spread — one image, two printed pages."
              : null}
          </p>
        </div>

        <div>
          <h2 className={`${merriweather.className} text-lg text-branding-black mb-3`}>
            {vi ? "Bản chuyển tự" : "Transcription"}
          </h2>
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              {vi ? "Đang tải…" : "Loading…"}
            </div>
          ) : (
            <div className="rounded-xl border border-branding-brown/15 bg-white p-5 text-[15px] leading-[1.9] text-branding-black/85 whitespace-pre-wrap">
              {renderText()}
            </div>
          )}
          <p className="text-[11px] text-muted-foreground mt-3">
            {vi
              ? "Văn bản do máy nhận dạng, có thể sai. Hãy đối chiếu với ảnh quét bên cạnh trước khi trích dẫn."
              : "This text is machine-transcribed and contains errors. Check it against the scan before quoting."}
          </p>
        </div>
      </div>

      <div>
        <Link
          href="/research/han-nom/corpus"
          className="text-sm text-branding-brown hover:underline"
        >
          ← {vi ? "Quay lại tìm kiếm" : "Back to search"}
        </Link>
      </div>
    </div>
  );
}
