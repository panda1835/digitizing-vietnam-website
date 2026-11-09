"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Search, Loader2, X, Maximize2, ExternalLink, ChevronDown } from "lucide-react";
import { Merriweather } from "next/font/google";
import MiniSearch from "minisearch";
import Image from "next/image";
import { ScanLightbox } from "@/components/common/ScanLightbox";

const merriweather = Merriweather({
  weight: ["300", "400", "700"],
  subsets: ["vietnamese"],
});

export function TuDienContent({ locale }: { locale: string }) {
  const t = useTranslations("Tools.ca-dao-tuc-ngu.tu-dien");

  // Guide state
  const [isGuideOpen, setIsGuideOpen] = useState(true);

  // Client-side search and browse states
  const [searchIndex, setSearchIndex] = useState<any[] | null>(null);
  const [miniSearch, setMiniSearch] = useState<MiniSearch | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Category filter
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  // Alphabet browsing state
  const [selectedLetter, setSelectedLetter] = useState<string>("A");
  const [letterEntries, setLetterEntries] = useState<Record<string, any[]>>({});
  const [letterLoading, setLetterLoading] = useState(false);

  // Pagination state
  const [visibleCount, setVisibleCount] = useState<number>(10);

  // Lightbox state
  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  const closeLightbox = useCallback(() => setActiveScanId(null), []);

  const ALPHABET = ["A", "B", "C", "D", "Đ", "E", "G", "H", "I", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "X", "Y"];

  // Helper to normalize the first character of the poem
  const getCleanFirstChar = (poemText: string): string => {
    const cleaned = poemText.replace(/^['"\s]+/, "");
    if (!cleaned) return "A";
    const char = cleaned.charAt(0).toUpperCase();
    return char === "Đ" ? "Đ" : char;
  };

  // Helper to clean category text
  const cleanCategory = (cat?: string) => {
    if (!cat) return "";
    return cat.replace(/[()]/g, "").trim().toUpperCase();
  };

  // Helper to assign colors to badges
  const getCategoryStyle = (cat?: string) => {
    const clean = cleanCategory(cat);
    if (clean.includes("THÀNH NGỮ")) return "bg-[#4a5d36] text-white";
    if (clean.includes("TỤC NGỮ")) return "bg-[#a5701c] text-white";
    return "bg-[#2b4c60] text-white"; // CA DAO or others
  };

  // In-flight fetch cache to prevent concurrent duplicate network calls
  const letterPromisesRef = useRef<Record<string, Promise<any[]> | undefined>>({});

  // Fetch partitioned letters JSON data
  const fetchLetter = async (letter: string) => {
    const baseFile = letter === "Đ" ? "D" : letter;
    if (letterEntries[baseFile]) return letterEntries[baseFile];
    const cachedPromise = letterPromisesRef.current[baseFile];
    if (cachedPromise) return cachedPromise;
    
    setLetterLoading(true);
    const promise = (async () => {
      try {
        const res = await fetch(`/data/ca-dao-tuc-ngu/letters/${baseFile}.json`);
        if (res.ok) {
          const data = await res.json();
          setLetterEntries((prev) => ({ ...prev, [baseFile]: data }));
          setLetterLoading(false);
          return data;
        }
      } catch (e) {
        console.error("Error loading letter data:", e);
      }
      // If failed, clear cache entry so it can be retried
      delete letterPromisesRef.current[baseFile];
      setLetterLoading(false);
      return [];
    })();

    letterPromisesRef.current[baseFile] = promise;
    return promise;
  };

  // Load and compile search index
  const loadSearchIndex = async () => {
    if (miniSearch) return miniSearch;
    setSearchLoading(true);
    try {
      const res = await fetch("/data/ca-dao-tuc-ngu/search-index.json");
      if (res.ok) {
        const data = await res.json();
        setSearchIndex(data);
        const ms = new MiniSearch({
          fields: ["poem"], // Search only by poem text
          storeFields: ["id", "poem", "category", "letter"],
          searchOptions: {
            prefix: true,
            fuzzy: 0.2,
          },
        });
        ms.addAll(data);
        setMiniSearch(ms);
        setSearchLoading(false);
        return ms;
      }
    } catch (e) {
      console.error("Error loading search index:", e);
    }
    setSearchLoading(false);
    return null;
  };

  // Execute full-text search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setVisibleCount(10); // Reset page count
    
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    let ms = miniSearch;
    if (!ms) {
      ms = await loadSearchIndex();
    }
    if (ms) {
      const results = ms.search(query);
      setSearchResults(results);
    }
  };

  // Handle letter filter click
  const handleLetterClick = (letter: string) => {
    setSearchQuery("");
    setSelectedLetter(letter);
    setVisibleCount(10);
    fetchLetter(letter);
  };

  // Load the initial letter chunk 'A'
  useEffect(() => {
    fetchLetter("A");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load missing explanation details for paginated results (especially during global search)
  const [detailsMap, setDetailsMap] = useState<Record<string, any>>({});

  // Filter & Resolve entries to display based on active letter/search and categories
  const currentEntries = useMemo(() => {
    let list: any[] = [];
    
    if (searchQuery.trim()) {
      list = searchResults;
    } else {
      const baseFile = selectedLetter === "Đ" ? "D" : selectedLetter;
      const rawEntries = letterEntries[baseFile] || [];
      
      // Separate D and Đ filter
      if (selectedLetter === "D") {
        list = rawEntries.filter(e => getCleanFirstChar(e.poem) === "D");
      } else if (selectedLetter === "Đ") {
        list = rawEntries.filter(e => getCleanFirstChar(e.poem) === "Đ");
      } else {
        list = rawEntries;
      }
    }

    // Filter by Category
    if (selectedCategory !== "ALL") {
      list = list.filter(e => {
        const cat = e.category || detailsMap[e.id]?.category;
        return cleanCategory(cat).includes(selectedCategory);
      });
    }

    return list;
  }, [searchQuery, searchResults, selectedLetter, letterEntries, selectedCategory, detailsMap]);
  
  useEffect(() => {
    const loadDetails = async () => {
      const neededEntries = currentEntries.slice(0, visibleCount);

      // Determine unique letters we need to fetch
      const missingLetters = Array.from(new Set(
        neededEntries
          .filter((entry) => !entry.explanation && !detailsMap[entry.id])
          .map((entry) => entry.letter)
          .filter(Boolean)
      ));

      if (missingLetters.length === 0) return;

      // Fetch all missing letters in parallel (deduplicated by letterPromisesRef)
      const dataArrays = await Promise.all(missingLetters.map((l) => fetchLetter(l)));

      // Map letter files by their key for fast lookup
      const loadedMap: Record<string, any[]> = {};
      missingLetters.forEach((letter, index) => {
        const baseFile = letter === "Đ" ? "D" : letter;
        loadedMap[baseFile] = dataArrays[index];
      });

      const updatedDetails = { ...detailsMap };
      let changed = false;

      for (const entry of neededEntries) {
        if (!entry.explanation && !updatedDetails[entry.id]) {
          const baseFile = entry.letter;
          if (baseFile) {
            const letterData = letterEntries[baseFile] || loadedMap[baseFile] || [];
            const found = letterData.find((d: any) => d.id === entry.id);
            if (found) {
              updatedDetails[entry.id] = found;
              changed = true;
            }
          }
        }
      }

      if (changed) {
        setDetailsMap(updatedDetails);
      }
    };

    loadDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentEntries, visibleCount]);

  return (
    <div className="w-full flex flex-col gap-6 animate-fadeIn">
      {/* Instructions section (Collapsible Accordion) */}
      <section className="scroll-mt-32 w-full animate-fadeIn mb-4">
        <div className="bg-white border border-branding-brown/15 rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setIsGuideOpen(!isGuideOpen)}
            className="w-full flex items-center justify-between p-5 md:p-6 text-left cursor-pointer hover:bg-branding-gray/20 transition-all duration-200"
          >
            <span className="text-base md:text-lg font-bold text-branding-brown uppercase tracking-wider">
              {t("instruction_guide_title")}
            </span>
            <ChevronDown 
              className={`h-5 w-5 text-branding-brown transition-transform duration-200 ${
                isGuideOpen ? "transform rotate-180" : ""
              }`} 
            />
          </button>
          
          {isGuideOpen && (
            <div className="border-t border-branding-brown/10 p-5 md:p-6 bg-white animate-fadeIn">
              <div className="text-[15px] md:text-base text-branding-black font-normal leading-relaxed max-w-3xl space-y-3">
                <p>
                  {t("instruction_intro")}
                </p>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li dangerouslySetInnerHTML={{ __html: t.raw("instruction_step1") }} />
                  <li dangerouslySetInnerHTML={{ __html: t.raw("instruction_step2") }} />
                  <li dangerouslySetInnerHTML={{ __html: t.raw("instruction_step3") }} />
                </ul>
                <div className="pt-3 border-t border-branding-brown/10 mt-3 text-branding-black font-medium">
                  {t("embedding_search_prefix")}
                  <a
                    href="https://ca-dao.richardhoa.io.vn/search-page"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-branding-brown underline hover:text-branding-brown/85 inline-flex items-center gap-0.5"
                  >
                    {t("embedding_search_link_text")}
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>.
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="flex flex-col gap-6 animate-fadeIn w-full">
        {/* Main header title for Search section */}
        <h3 className={`${merriweather.className} text-2xl text-branding-black font-normal mt-2`}>
          {locale === "vi" ? "Từ điển Thành ngữ, Tục ngữ, Ca dao Việt Nam" : "Dictionary of Vietnamese Idioms, Proverbs and Folk Verses"}
        </h3>

      {/* Search Input and Category Dropdown */}
      <div className="flex flex-col md:flex-row gap-4 w-full items-stretch">
        {/* Category Dropdown */}
        <div className="relative min-w-[200px] flex-shrink-0">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setVisibleCount(10);
            }}
            className="w-full bg-white border border-branding-brown/20 text-sm text-branding-black pl-4 pr-10 py-3 rounded-2xl focus:outline-none focus:border-branding-brown focus:ring-1 focus:ring-branding-brown shadow-sm cursor-pointer appearance-none"
          >
            <option value="ALL">{locale === "vi" ? "Tất cả phân loại" : "All categories"}</option>
            <option value="CA DAO">{locale === "vi" ? "Ca dao" : "Folk verse"}</option>
            <option value="TỤC NGỮ">{locale === "vi" ? "Tục ngữ" : "Proverb"}</option>
            <option value="TỤC NGỮ HÁN VIỆT">{locale === "vi" ? "Tục ngữ Hán Việt" : "Sino-Vietnamese proverb"}</option>
            <option value="THÀNH NGỮ">{locale === "vi" ? "Thành ngữ" : "Idiom"}</option>
            <option value="THÀNH NGỮ HÁN VIỆT">{locale === "vi" ? "Thành ngữ Hán Việt" : "Sino-Vietnamese idiom"}</option>
          </select>
          <div className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-branding-brown/70">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>

        {/* Search text input */}
        <div className="relative flex-1 flex items-center shadow-sm rounded-2xl overflow-hidden border border-branding-brown/20 bg-white">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={locale === "vi" ? "Tìm kiếm theo văn bản câu..." : "Search by the text of an entry..."}
            className="w-full pl-5 pr-12 py-3.5 bg-white text-sm text-branding-black focus:outline-none"
          />
          <div className="absolute right-4 flex items-center gap-2">
            {searchLoading && <Loader2 className="animate-spin h-5 w-5 text-branding-brown" />}
            {searchQuery && (
              <button
                onClick={() => handleSearch("")}
                className="text-gray-400 hover:text-branding-brown"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            {!searchQuery && <Search className="text-gray-450 h-5 w-5" />}
          </div>
        </div>
      </div>



      {/* Circular Alphabet Browsing list */}
      <div className="w-full flex flex-wrap justify-center gap-2.5 py-4 border-y border-gray-100 my-2">
        {ALPHABET.map((letter) => {
          const isActive = selectedLetter === letter && !searchQuery;
          return (
            <button
              key={letter}
              onClick={() => handleLetterClick(letter)}
              className={`h-9 w-9 flex items-center justify-center text-sm font-bold rounded-full border transition-all duration-300 ${
                isActive
                  ? "bg-branding-brown text-white border-branding-brown shadow-md"
                  : "bg-white border-gray-200 text-branding-black hover:border-branding-brown hover:text-branding-brown"
              }`}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Dynamic Results Stack */}
      <div className="w-full flex flex-col gap-6 mt-4">
        {letterLoading && !searchQuery && (
          <div className="flex flex-col items-center justify-center py-20 w-full">
            <Loader2 className="animate-spin h-10 w-10 text-branding-brown mb-2" />
            <span className="text-sm text-gray-500">{locale === "vi" ? "Đang tải dữ liệu..." : "Loading data..."}</span>
          </div>
        )}

        {/* Entries Loop */}
        {!letterLoading && currentEntries.slice(0, visibleCount).map((entry) => {
          // Resolve full details object (since index list doesn't have explanations)
          const detail = entry.explanation ? entry : detailsMap[entry.id];
          const hasDetails = !!detail;

          return (
            <div
              key={entry.id}
              className="bg-white p-6 md:p-8 rounded-3xl border border-branding-brown/10 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-stretch transition-all duration-300 hover:shadow-md"
            >
              {/* Left Side: Content */}
              <div className="flex-1 flex flex-col gap-4">
                <div>
                  <span className={`inline-block px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest rounded-md ${getCategoryStyle(detail?.category || entry.category)}`}>
                    {cleanCategory(detail?.category || entry.category)}
                  </span>
                </div>

                {/* Poem text */}
                <h4 className={`${merriweather.className} text-lg md:text-xl text-branding-black font-bold whitespace-pre-line leading-relaxed italic`}>
                  {entry.poem}
                </h4>

                {/* Meaning & Explanation text */}
                <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
                  {hasDetails ? (
                    <p className="text-sm md:text-[15px] text-branding-black/85 font-light leading-relaxed whitespace-pre-line">
                      {detail.explanation}
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 py-4">
                      <Loader2 className="animate-spin h-4 w-4 text-branding-brown" />
                      <span className="text-xs text-gray-500">{locale === "vi" ? "Đang tải nghĩa giải thích..." : "Loading the explanation..."}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Cropped Page Scan (Whole element clickable) */}
              <div 
                onClick={() => setActiveScanId(entry.id)}
                className="w-full md:w-[32%] min-h-[160px] md:min-h-none flex-shrink-0 border border-gray-150 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center relative group cursor-zoom-in"
              >
                <Image
                  src={`https://iiif.digitizingvietnam.com/iiif/2/tu-dien-thanh-ngu-tuc-ngu-ca-dao-viet-nam/output-folder/${entry.id}.png/full/full/0/default.jpg`}
                  alt="Scanned page snippet"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-contain transition-transform duration-300 group-hover:scale-102"
                  loading="lazy"
                />
                
                {/* Maximize zoom overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                  <span className="px-4 py-2 bg-white/95 text-branding-black text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5">
                    <Maximize2 className="h-3.5 w-3.5" />
                    {locale === "vi" ? "Xem phóng to" : "View larger"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Load More Trigger */}
        {!letterLoading && currentEntries.length > visibleCount && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => setVisibleCount(prev => prev + 15)}
              className="px-8 py-3 bg-branding-black text-white text-sm font-bold rounded-xl hover:bg-branding-brown hover:shadow-md transition-all duration-300"
            >
              {locale === "vi" ? "Xem thêm" : "Load More"}
            </button>
          </div>
        )}

        {/* Empty Search State */}
        {!letterLoading && currentEntries.length === 0 && (
          <div className="text-center py-20 text-gray-500 bg-white border border-branding-brown/5 rounded-3xl p-8">
            {locale === "vi" ? "Không tìm thấy dữ liệu phù hợp với bộ lọc và tìm kiếm." : "No entries match your filters and search."}
          </div>
        )}
      </div>
      </div>

      {/* Lightbox Modal for enlarged scans matching templates/wiki.html */}
      {activeScanId && (
        <ScanLightbox
          src={`https://iiif.digitizingvietnam.com/iiif/2/tu-dien-thanh-ngu-tuc-ngu-ca-dao-viet-nam/output-folder/${activeScanId}.png/full/full/0/default.jpg`}
          alt="Enlarged scan"
          onClose={closeLightbox}
        />
      )}
    </div>
  );
}
