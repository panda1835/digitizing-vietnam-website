"use client";

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import {
    ChevronLeft, ChevronRight, ImageIcon, FileText,
    Info, ExternalLink, Settings2, Type, Quote, Copy, Search, BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { isDvskttSlug, flattenItems } from "@/app/[locale]/research/han-nom/search-database/_data/dvsktt-utils";

interface CorpusPage {
    n: string;
    image?: string;
    imagePath?: string;
    hanNom: { n: string; text: string }[];
    transliteration: { n: string; text: string }[];
    notes: { id: string; target: string; content: string }[];
}

export default function CorpusViewer() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const slug = params.slug as string;
    const initialPage = parseInt(searchParams.get("page") || "1");
    const initialBook = searchParams.get("book") || "1";
    const initialTopic = searchParams.get("topic") || "1";

    const [pageNumber, setPageNumber] = React.useState(initialPage);
    const [book, setBook] = React.useState(initialBook);
    const [topic, setTopic] = React.useState(initialTopic);
    const [pageData, setPageData] = React.useState<CorpusPage | null>(null);
    const [workMeta, setWorkMeta] = React.useState<any>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [viewMode, setViewMode] = React.useState<"parallel" | "han-nom" | "trans">("parallel");
    const [fontSize, setFontSize] = React.useState(18);
    const [lineHeight, setLineHeight] = React.useState(1.1);
    const [isCitationOpen, setIsCitationOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [expandedBook, setExpandedBook] = React.useState<number>(0);

    React.useEffect(() => {
        const fetchWorkMeta = async () => {
            try {
                const res = await fetch(`/api/research/han-nom/search-database/${slug}`);
                const data = await res.json();
                setWorkMeta(data);
            } catch (e) {
                console.error("Error fetching work metadata", e);
            }
        };
        fetchWorkMeta();
    }, [slug]);

    React.useEffect(() => {
        const fetchPage = async () => {
            setIsLoading(true);
            try {
                const url = new URL(`/api/research/han-nom/search-database/${slug}`, window.location.origin);
                url.searchParams.set("page", pageNumber.toString());
                if (isDvskttSlug(slug)) {
                    url.searchParams.set("book", book);
                    url.searchParams.set("topic", topic);
                }
                const response = await fetch(url.toString());
                const data = await response.json();
                setPageData(data);
            } catch (error) {
                console.error("Error fetching page data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPage();

        const url = new URL(window.location.href);
        url.searchParams.set("page", pageNumber.toString());
        if (isDvskttSlug(slug)) {
            url.searchParams.set("book", book);
            url.searchParams.set("topic", topic);
        }
        window.history.replaceState(null, "", url.toString());
    }, [slug, pageNumber, book, topic]);

    const handleNext = () => setPageNumber(prev => prev + 1);
    const handlePrev = () => setPageNumber(prev => Math.max(1, prev - 1));

    const highlightText = (text: string, query: string) => {
        if (!query) return <>{text}</>;
        const parts = text.split(new RegExp(`(${query})`, "gi"));
        return (
            <>
                {parts.map((part, i) =>
                    part.toLowerCase() === query.toLowerCase() ? (
                        <mark key={i} className="bg-yellow-200 dark:bg-yellow-700/50 rounded-sm px-0.5">{part}</mark>
                    ) : part
                )}
            </>
        );
    };

    const getImageUrl = () => {
        if (!pageData?.image) return null;
        if (isDvskttSlug(slug)) {
            return `https://iiif.digitizingvietnam.com/iiif/2/${pageData.imagePath}${pageData.image}.jpg/full/full/0/default.jpg`;
        }
        if (pageData.image.startsWith("http") || pageData.image.startsWith("data:")) {
            return pageData.image;
        }
        return `https://manuscripts.digitizingvietnam.com/images/${pageData.image}`;
    };

    if (isLoading && !pageData) {
        return (
            <div className="flex items-center justify-center h-[600px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-branding-brown"></div>
            </div>
        );
    }

    const imageUrl = getImageUrl();

    return (
        <div className="max-w-[1700px] mx-auto px-4 md:px-8 py-8">

            {/* ── Top navigation bar ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-700 mb-8">

                {/* Left: back + title */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/research/han-nom/search-database")}
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-branding-brown dark:hover:text-branding-brown transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Library
                    </button>
                    <span className="text-zinc-300 dark:text-zinc-600">/</span>
                    <h1 className="text-base font-semibold text-branding-black dark:text-zinc-100 hidden sm:block">
                        {workMeta?.title || "Loading…"}
                    </h1>
                </div>

                {/* Right: controls */}
                <div className="flex flex-wrap items-center gap-3">

                    {/* Book / topic selects for ĐVSKTT */}
                    {isDvskttSlug(slug) && workMeta?.titles && (
                        <div className="flex gap-2 items-center text-sm">
                            <select
                                className="border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 bg-white dark:bg-zinc-900 dark:text-zinc-200 text-sm outline-none"
                                value={book}
                                onChange={(e) => { setBook(e.target.value); setTopic("1"); setPageNumber(1); }}
                            >
                                {workMeta.titles.map((b: any, idx: number) => (
                                    <option key={idx} value={idx}>{b.title}</option>
                                ))}
                            </select>
                            <select
                                className="border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 bg-white dark:bg-zinc-900 dark:text-zinc-200 text-sm outline-none"
                                value={topic}
                                onChange={(e) => { setTopic(e.target.value); setPageNumber(1); }}
                            >
                                {flattenItems(workMeta.titles[Number(book)]?.children || []).map((t, idx) => (
                                    <option key={idx} value={idx + 1}>{t.title}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Page navigation */}
                    <div className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 rounded px-1">
                        <button
                            onClick={handlePrev}
                            disabled={pageNumber === 1}
                            className="p-1 hover:text-branding-brown disabled:opacity-30 transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm px-2 text-branding-black dark:text-zinc-100 min-w-[5rem] text-center">
                            Page {pageNumber}
                        </span>
                        <button
                            onClick={handleNext}
                            className="p-1 hover:text-branding-brown transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="hidden md:flex items-center gap-1 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 w-48">
                        <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <Input
                            placeholder="Find in page…"
                            className="h-6 border-none bg-transparent shadow-none text-xs focus-visible:ring-0 px-1 dark:text-zinc-200 dark:placeholder:text-zinc-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Display settings */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="p-1.5 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                <Settings2 className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-4 dark:bg-zinc-900 dark:border-zinc-700">
                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold dark:text-zinc-100 flex items-center gap-2">
                                    <Type className="h-4 w-4" /> Display Settings
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">Font Size</p>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {[14, 16, 18, 22, 26].map((size) => (
                                                <button
                                                    key={size}
                                                    onClick={() => setFontSize(size)}
                                                    className={`text-xs px-2 py-1 rounded border transition-colors ${fontSize === size ? "bg-branding-brown text-white border-branding-brown" : "border-zinc-200 dark:border-zinc-700 hover:border-branding-brown dark:text-zinc-300"}`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider">Line Height</p>
                                        <div className="flex gap-1.5 flex-wrap">
                                            {[1.4, 1.6, 1.8, 2.2].map((lh) => (
                                                <button
                                                    key={lh}
                                                    onClick={() => setLineHeight(lh)}
                                                    className={`text-xs px-2 py-1 rounded border transition-colors ${lineHeight === lh ? "bg-branding-brown text-white border-branding-brown" : "border-zinc-200 dark:border-zinc-700 hover:border-branding-brown dark:text-zinc-300"}`}
                                                >
                                                    {lh}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Cite */}
                    <Dialog open={isCitationOpen} onOpenChange={setIsCitationOpen}>
                        <DialogTrigger asChild>
                            <button className="p-1.5 border border-zinc-200 dark:border-zinc-700 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
                                <Quote className="h-4 w-4 text-muted-foreground" />
                            </button>
                        </DialogTrigger>
                        <DialogContent className="dark:bg-zinc-900 dark:border-zinc-700 max-w-lg">
                            <DialogHeader>
                                <DialogTitle className="dark:text-zinc-100">Cite this Page</DialogTitle>
                                <DialogDescription>Academic citation format.</DialogDescription>
                            </DialogHeader>
                            <div className="mt-4 bg-zinc-50 dark:bg-zinc-800 p-4 rounded border border-zinc-200 dark:border-zinc-700 relative group">
                                <p className="text-sm leading-relaxed pr-8 dark:text-zinc-200">
                                    {workMeta?.title || "Digital Corpus"}. Page {pageNumber}. <i>Digitizing Vietnam Project</i>.{" "}
                                    {typeof window !== "undefined" ? `${window.location.origin}/research/han-nom/search-database/${slug}?page=${pageNumber}` : ""}
                                </p>
                                <button
                                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-branding-brown"
                                    onClick={() => {
                                        const cit = `${workMeta?.title || "Digital Corpus"}. Page ${pageNumber}. Digitizing Vietnam Project. ${window.location.href}`;
                                        navigator.clipboard.writeText(cit);
                                        toast.success("Citation copied to clipboard");
                                    }}
                                >
                                    <Copy className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Open in Toolbox */}
                    <button
                        onClick={() => {
                            const url = new URL("/research/toolbox", window.location.origin);
                            if (slug.startsWith("text-")) {
                                url.searchParams.set("id", slug.replace("text-", ""));
                            } else {
                                url.searchParams.set("corpus", slug);
                                url.searchParams.set("page", pageNumber.toString());
                                if (isDvskttSlug(slug)) {
                                    url.searchParams.set("book", book);
                                    url.searchParams.set("topic", topic);
                                }
                            }
                            router.push(url.pathname + url.search);
                        }}
                        className="flex items-center gap-1.5 text-sm px-3 py-1.5 border border-branding-brown/40 text-branding-brown rounded hover:bg-branding-brown hover:text-white transition-colors"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {slug.startsWith("text-") ? "Edit in Toolbox" : "Open in Toolbox"}
                    </button>
                </div>
            </div>

            {/* ── Main layout: relative wrapper so TOC can hang off the left edge ── */}
            <div className="relative">

                {/* TOC sidebar: absolute, flush to the left of this container */}
                {workMeta?.titles && (
                    <nav className="hidden xl:block absolute right-full top-0 w-52 pr-4 z-20">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">Contents</p>
                        <div className="border border-zinc-200 dark:border-zinc-700 rounded overflow-hidden bg-white dark:bg-zinc-950 shadow-sm">
                            <div className="max-h-[calc(100vh-10rem)] overflow-y-auto">
                                {workMeta.titles.map((b: any, bIdx: number) => (
                                    <div key={bIdx}>
                                        <button
                                            className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between gap-1 transition-colors border-b border-zinc-100 dark:border-zinc-800 ${expandedBook === bIdx
                                                ? "bg-zinc-100 dark:bg-zinc-800 text-branding-brown"
                                                : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-branding-black dark:text-zinc-200"
                                                }`}
                                            onClick={() => setExpandedBook(bIdx === expandedBook ? -1 : bIdx)}
                                        >
                                            <span className="truncate">{b.title}</span>
                                            <ChevronRight className={`h-3 w-3 shrink-0 transition-transform ${expandedBook === bIdx ? "rotate-90" : ""}`} />
                                        </button>
                                        {expandedBook === bIdx && flattenItems(b.children || []).map((t, tIdx) => (
                                            <button
                                                key={tIdx}
                                                className={`w-full text-left px-4 py-1.5 text-xs border-b border-zinc-100 dark:border-zinc-800 transition-colors ${book === String(bIdx) && topic === String(tIdx + 1)
                                                    ? "bg-branding-brown/10 text-branding-brown font-medium"
                                                    : "text-muted-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-200"
                                                    }`}
                                                onClick={() => {
                                                    setBook(String(bIdx));
                                                    setTopic(String(tIdx + 1));
                                                    setPageNumber(1);
                                                }}
                                            >
                                                <span className="line-clamp-2">{t.title}</span>
                                            </button>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </nav>
                )}

                {/* ── 2-column wiki layout (text + infobox) ── */}
                <div className="flex flex-col lg:flex-row gap-10">

                    <div className="flex-1 min-w-0">

                        {/* View mode toggle */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex border-b border-zinc-200 dark:border-zinc-700 gap-0">
                                {(["parallel", "han-nom", "trans"] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        className={`px-4 py-2 text-sm -mb-px border-b-2 transition-colors ${viewMode === mode
                                            ? "border-branding-brown text-branding-brown font-medium"
                                            : "border-transparent text-muted-foreground hover:text-branding-black dark:hover:text-zinc-100"
                                            }`}
                                    >
                                        {mode === "parallel" ? "Parallel" : mode === "han-nom" ? "Nom" : "QN"}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Text content */}
                        {viewMode === "parallel" ? (() => {
                            // Build a merged list keyed by line number so each line is aligned
                            const lineNums = Array.from(new Set([
                                ...(pageData?.hanNom?.map(l => l.n) ?? []),
                                ...(pageData?.transliteration?.map(l => l.n) ?? []),
                            ]));
                            const hnMap = new Map(pageData?.hanNom?.map(l => [l.n, l.text]) ?? []);
                            const trMap = new Map(pageData?.transliteration?.map(l => [l.n, l.text]) ?? []);
                            return (
                                <div>
                                    {/* Column headers */}
                                    <div className="grid grid-cols-2 gap-x-8 mb-6">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <FileText className="h-3.5 w-3.5" /> Hán-Nôm (original)
                                        </p>
                                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <BookOpen className="h-3.5 w-3.5" /> Quốc ngữ
                                        </p>
                                    </div>
                                    {/* One row per line number — aligned across both columns */}
                                    {/* One row per line number — aligned across both columns */}
                                    <div className="space-y-0">
                                        {lineNums.map((n) => (
                                            <div key={n} className="grid grid-cols-2 gap-x-8 group">
                                                {/* Han-Nom cell */}
                                                <div className="flex gap-3">
                                                    <span className="text-[10px] text-muted-foreground dark:text-zinc-600 w-6 shrink-0 text-right select-none">{n}</span>
                                                    <span
                                                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 px-1 rounded transition-colors text-branding-black dark:text-zinc-100"
                                                        style={{ fontSize: `${fontSize * 1.4}px`, lineHeight }}
                                                    >
                                                        {hnMap.has(n) ? highlightText(hnMap.get(n)!, searchQuery) : <span className="text-muted-foreground italic text-sm">—</span>}
                                                    </span>
                                                </div>
                                                {/* Quốc ngữ cell */}
                                                <div className="flex gap-3">
                                                    <span className="text-[10px] text-muted-foreground dark:text-zinc-600 w-6 shrink-0 text-right select-none">{n}</span>
                                                    <span
                                                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 px-1 rounded transition-colors text-branding-black/85 dark:text-zinc-200"
                                                        style={{ fontSize: `${fontSize}px`, lineHeight }}
                                                    >
                                                        {trMap.has(n) ? highlightText(trMap.get(n)!, searchQuery) : <span className="text-muted-foreground italic text-sm">—</span>}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {lineNums.length === 0 && (
                                            <p className="text-sm text-muted-foreground italic">No text available for this page.</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })() : (
                            /* Single-column modes */
                            <div>
                                {viewMode === "han-nom" && (
                                    <>
                                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                                            <FileText className="h-3.5 w-3.5" /> Hán-Nôm (original)
                                        </p>
                                        <div className="space-y-0 text-branding-black dark:text-zinc-100" style={{ fontSize: `${fontSize * 1.4}px`, lineHeight }}>
                                            {pageData?.hanNom?.map((line, idx) => (
                                                <div key={idx} className="flex gap-3 group">
                                                    <span className="text-[10px] text-muted-foreground dark:text-zinc-600 mt-1 w-6 shrink-0 text-right select-none">{line.n}</span>
                                                    <span className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 px-1 rounded transition-colors">{highlightText(line.text, searchQuery)}</span>
                                                </div>
                                            ))}
                                            {(!pageData?.hanNom || pageData.hanNom.length === 0) && (
                                                <p className="text-sm text-muted-foreground italic">No Hán-Nôm text available for this page.</p>
                                            )}
                                        </div>
                                    </>
                                )}
                                {viewMode === "trans" && (
                                    <>
                                        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6 flex items-center gap-2">
                                            <BookOpen className="h-3.5 w-3.5" /> Quốc ngữ
                                        </p>
                                        <div className="space-y-0 text-branding-black/85 dark:text-zinc-200" style={{ fontSize: `${fontSize}px`, lineHeight }}>
                                            {pageData?.transliteration?.map((line, idx) => (
                                                <div key={idx} className="flex gap-3 group">
                                                    <span className="text-[10px] text-muted-foreground dark:text-zinc-600 mt-1 w-6 shrink-0 text-right select-none">{line.n}</span>
                                                    <span className="hover:bg-zinc-50 dark:hover:bg-zinc-800/60 px-1 rounded transition-colors">{highlightText(line.text, searchQuery)}</span>
                                                </div>
                                            ))}
                                            {(!pageData?.transliteration || pageData.transliteration.length === 0) && (
                                                <p className="text-sm text-muted-foreground italic">No transliteration available for this page.</p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Bottom pagination */}
                        <div className="flex items-center justify-between mt-16 pt-6 border-t border-zinc-200 dark:border-zinc-700">
                            <button
                                onClick={handlePrev}
                                disabled={pageNumber === 1}
                                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-branding-brown disabled:opacity-30 transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" /> Previous page
                            </button>
                            <span className="text-sm text-muted-foreground">Page {pageNumber}</span>
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-branding-brown transition-colors"
                            >
                                Next page <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* ── Right: wiki infobox ── */}
                    <aside className="lg:w-52 xl:w-56 shrink-0">
                        <div className="lg:sticky lg:top-8 space-y-6">

                            {/* Manuscript image */}
                            <div className="border border-zinc-200 dark:border-zinc-700 rounded overflow-hidden">
                                <div className="bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 border-b border-zinc-200 dark:border-zinc-700">
                                    Manuscript Image · Page {pageNumber}
                                </div>
                                <div className="bg-zinc-950 aspect-[3/4] flex items-center justify-center">
                                    {imageUrl ? (
                                        <img
                                            src={imageUrl}
                                            alt={`Manuscript page ${pageNumber}`}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-white/20">
                                            <ImageIcon className="h-10 w-10" />
                                            <p className="text-xs">No image available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Notes & Annotations */}
                            <div className="border border-zinc-200 dark:border-zinc-700 rounded overflow-hidden">
                                <div className="bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-2">
                                    <Info className="h-3.5 w-3.5" />
                                    Notes &amp; Annotations
                                </div>
                                <div className="p-4 max-h-80 overflow-y-auto">
                                    {pageData?.notes && pageData.notes.length > 0 ? (
                                        <ol className="space-y-4 list-decimal list-inside">
                                            {pageData.notes.map((note, idx) => (
                                                <li key={idx} className="text-sm text-branding-black/80 dark:text-zinc-300 leading-relaxed">
                                                    <span className="font-semibold text-branding-brown text-xs mr-1">[{note.id}]</span>
                                                    {note.content}
                                                </li>
                                            ))}
                                        </ol>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic text-center py-6">No annotations for this page.</p>
                                    )}
                                </div>
                            </div>

                            {/* Work info box */}
                            {workMeta && (
                                <div className="border border-zinc-200 dark:border-zinc-700 rounded overflow-hidden text-sm">
                                    <div className="bg-zinc-100 dark:bg-zinc-800 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2 border-b border-zinc-200 dark:border-zinc-700">
                                        About this Work
                                    </div>
                                    <dl className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {workMeta.title && (
                                            <div className="px-3 py-2">
                                                <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Title</dt>
                                                <dd className="dark:text-zinc-200 font-medium leading-snug">{workMeta.title}</dd>
                                            </div>
                                        )}
                                        {workMeta.date && (
                                            <div className="px-3 py-2 flex gap-2">
                                                <dt className="text-muted-foreground shrink-0 w-20 text-xs">Date</dt>
                                                <dd className="dark:text-zinc-200 text-xs">{workMeta.date}</dd>
                                            </div>
                                        )}
                                        {workMeta.genre && (
                                            <div className="px-3 py-2 flex gap-2">
                                                <dt className="text-muted-foreground shrink-0 w-20 text-xs">Genre</dt>
                                                <dd className="dark:text-zinc-200 text-xs">{workMeta.genre}</dd>
                                            </div>
                                        )}
                                        {workMeta.language && (
                                            <div className="px-3 py-2 flex gap-2">
                                                <dt className="text-muted-foreground shrink-0 w-20 text-xs">Language</dt>
                                                <dd className="dark:text-zinc-200 text-xs">{workMeta.language}</dd>
                                            </div>
                                        )}
                                        {workMeta.pages && (
                                            <div className="px-3 py-2 flex gap-2">
                                                <dt className="text-muted-foreground shrink-0 w-20 text-xs">Pages</dt>
                                                <dd className="dark:text-zinc-200 text-xs">{workMeta.pages.toLocaleString()}</dd>
                                            </div>
                                        )}
                                        {workMeta.attributions && workMeta.attributions.length > 0 && (
                                            <div className="px-3 py-2">
                                                <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Attributions</dt>
                                                <dd className="space-y-1.5">
                                                    {workMeta.attributions.map((attr: any, i: number) => (
                                                        <div key={i}>
                                                            <span className="dark:text-zinc-200 text-xs font-medium">{attr.name}</span>
                                                            <span className="text-muted-foreground text-[10px] ml-1.5">({attr.role})</span>
                                                            {attr.note && (
                                                                <p className="text-[10px] text-muted-foreground italic mt-0.5">{attr.note}</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </dd>
                                            </div>
                                        )}
                                        {workMeta.curationStatus && (
                                            <div className="px-3 py-2 flex gap-2 items-center">
                                                <dt className="text-muted-foreground shrink-0 w-20 text-xs">Status</dt>
                                                <dd>
                                                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${workMeta.curationStatus === "curated"
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                                                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400"
                                                        }`}>
                                                        {workMeta.curationStatus === "curated" ? "✓ Curated" : "Wiki"}
                                                    </span>
                                                </dd>
                                            </div>
                                        )}
                                    </dl>
                                </div>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
