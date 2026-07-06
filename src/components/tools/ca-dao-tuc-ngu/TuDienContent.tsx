"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Search, Loader2, X, Maximize2, ExternalLink, ChevronDown, ChevronUp, BookOpen, Music, Info } from "lucide-react";
import { Merriweather } from "next/font/google";
import MiniSearch from "minisearch";

const merriweather = Merriweather({
  weight: ["300", "400", "700"],
  subsets: ["vietnamese"],
});

export function TuDienContent({ locale }: { locale: string }) {
  const t = useTranslations("Tools.ca-dao-tuc-ngu.tu-dien");

  // Tab state
  const [activeTab, setActiveTab] = useState<"proverbs" | "poetry" | "search">("proverbs");
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

  const toggleItem = (index: number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const accordionItems = [
    {
      type: "proverb",
      title: t("example_proverb_1_title"),
      desc: t("example_proverb_1_desc"),
    },
    {
      type: "proverb",
      title: t("example_proverb_2_title"),
      desc: t("example_proverb_2_desc"),
    },
    {
      type: "idiom",
      title: t("example_idiom_1_title"),
      desc: t("example_idiom_1_desc"),
    },
    {
      type: "idiom",
      title: t("example_idiom_2_title"),
      desc: t("example_idiom_2_desc"),
    },
    {
      type: "idiom",
      title: t("example_idiom_3_title"),
      desc: t("example_idiom_3_desc"),
    },
    {
      type: "idiom",
      title: t("example_idiom_4_title"),
      desc: t("example_idiom_4_desc"),
    },
  ];

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

  // Modal zoom state
  const [activeScanId, setActiveScanId] = useState<string | null>(null);

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

  // Fetch partitioned letters JSON data
  const fetchLetter = async (letter: string) => {
    const baseFile = letter === "Đ" ? "D" : letter;
    if (letterEntries[baseFile]) return letterEntries[baseFile];
    
    setLetterLoading(true);
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
    setLetterLoading(false);
    return [];
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
      const updatedDetails = { ...detailsMap };
      let changed = false;

      for (const entry of neededEntries) {
        if (!entry.explanation && !updatedDetails[entry.id]) {
          // Find detail in letter file
          const baseFile = entry.letter;
          if (baseFile) {
            const data = await fetchLetter(baseFile);
            const found = data.find((d: any) => d.id === entry.id);
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

  // Listen for Escape key to close lightbox and manage page scrolling lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveScanId(null);
      }
    };
    if (activeScanId) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Disable background scrolling
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = ""; // Restore background scrolling
    };
  }, [activeScanId]);

  return (
    <div className="w-full flex flex-col gap-6 animate-fadeIn">
      {/* Lightbox specific animations matching templates/wiki.html */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes lightboxZoomIn {
          from {
            transform: scale(0.92);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes lightboxFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}} />
      
      {/* Intro details (Extracted from Việt Chương book) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-150 pb-6">
        <p 
          className="text-base text-branding-black/80 font-light leading-relaxed max-w-3xl" 
          dangerouslySetInnerHTML={{ __html: t.raw("intro") }} 
        />
        
        {/* External embedding search link */}
        <a
          href="https://ca-dao.richardhoa.io.vn/search-page"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-3 border border-branding-brown/30 text-branding-brown text-sm font-bold rounded-xl hover:bg-branding-brown hover:text-white transition-all duration-300"
        >
          {locale === "vi" ? "Tìm kiếm ngữ nghĩa (Embedding Search)" : "Embedding Semantic Search"}
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-branding-gray/60 overflow-x-auto whitespace-nowrap mt-4 scrollbar-none w-full mx-auto">
        <button
          onClick={() => setActiveTab("proverbs")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-all duration-300 ${
            activeTab === "proverbs"
              ? "border-branding-brown text-branding-brown font-bold"
              : "border-transparent text-gray-500 hover:text-branding-brown/80"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          {t("tab_proverbs_idioms")}
        </button>

        <button
          onClick={() => setActiveTab("poetry")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-all duration-300 ${
            activeTab === "poetry"
              ? "border-branding-brown text-branding-brown font-bold"
              : "border-transparent text-gray-500 hover:text-branding-brown/80"
          }`}
        >
          <Music className="h-4 w-4" />
          {t("tab_poetry_songs")}
        </button>

        <button
          onClick={() => setActiveTab("search")}
          className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-all duration-300 ${
            activeTab === "search"
              ? "border-branding-brown text-branding-brown font-bold"
              : "border-transparent text-gray-500 hover:text-branding-brown/80"
          }`}
        >
          <Search className="h-4 w-4" />
          {t("tab_dictionary_search")}
        </button>
      </div>

      {/* Tab Panels */}
      <div className="w-full mt-2">
        {/* Tab 1: Proverbs & Idioms */}
        {activeTab === "proverbs" && (
          <div className="flex flex-col gap-10 animate-fadeIn">
            {/* Intro header */}
            <div className="w-full mx-auto">
              <h3 className={`${merriweather.className} text-2xl md:text-3xl text-branding-black font-normal mb-3`}>
                {t("proverbs_intro_title")}
              </h3>
              <p className="text-base text-branding-black/80 font-light leading-relaxed">
                {t("proverbs_intro_desc")}
              </p>
            </div>

            {/* Side-by-side definition cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 w-full mx-auto">
              {/* Proverb card */}
              <div className="bg-white p-8 rounded-3xl border border-branding-brown/10 shadow-sm transition-all hover:shadow-md">
                <span className="inline-block px-3 py-1 bg-amber-100/70 border border-amber-200 text-[#a5701c] text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                  {t("tab_proverbs_idioms").split("&")[0].trim()}
                </span>
                <h4 className={`${merriweather.className} text-xl text-branding-black font-bold mb-4`}>
                  {t("proverb_def_title")}
                </h4>
                <p className="text-[15px] text-branding-black/85 font-light leading-relaxed">
                  {t("proverb_def_body")}
                </p>
              </div>

              {/* Idiom card */}
              <div className="bg-white p-8 rounded-3xl border border-branding-brown/10 shadow-sm transition-all hover:shadow-md">
                <span className="inline-block px-3 py-1 bg-emerald-100/70 border border-emerald-200 text-[#4a5d36] text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                  {t("tab_proverbs_idioms").split("&")[1].trim()}
                </span>
                <h4 className={`${merriweather.className} text-xl text-branding-black font-bold mb-4`}>
                  {t("idiom_def_title")}
                </h4>
                <p className="text-[15px] text-branding-black/85 font-light leading-relaxed">
                  {t("idiom_def_body")}
                </p>
              </div>
            </div>

            {/* Interactive helper text */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 font-medium tracking-wide mt-2">
              <Info className="h-4 w-4 text-branding-brown/80" />
              <span>{t("interactive_flip_title")}</span>
            </div>

            {/* Interactive Accordion Stack */}
            <div className="bg-white border border-branding-brown/10 rounded-3xl shadow-sm divide-y divide-gray-100 overflow-hidden w-full mx-auto">
              {accordionItems.map((item, idx) => {
                const isExpanded = !!expandedItems[idx];
                const badgeColor =
                  item.type === "proverb"
                    ? "bg-amber-100/50 text-[#a5701c] border-amber-200/60"
                    : "bg-emerald-100/50 text-[#4a5d36] border-emerald-200/60";
                const badgeLabel =
                  item.type === "proverb"
                    ? t("tab_proverbs_idioms").split("&")[0].trim()
                    : t("tab_proverbs_idioms").split("&")[1].trim();

                return (
                  <div key={idx} className="transition-colors hover:bg-gray-50/50">
                    <button
                      onClick={() => toggleItem(idx)}
                      className="w-full flex items-center justify-between px-6 py-5 text-left transition-all focus:outline-none"
                    >
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 border text-xs font-bold uppercase tracking-wider rounded-full ${badgeColor}`}>
                          {badgeLabel}
                        </span>
                        <span className={`${merriweather.className} text-base md:text-lg text-branding-black font-normal`}>
                          {item.title.split(":").slice(1).join(":").trim() || item.title}
                        </span>
                      </div>
                      <div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded ? "max-h-[300px] border-t border-gray-100" : "max-h-0"
                      }`}
                    >
                      <div className="px-6 py-4 text-[15px] text-branding-black/80 font-light leading-relaxed">
                        <p>{item.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Ca dao & Dân ca & Đặc tính */}
        {activeTab === "poetry" && (
          <div className="flex flex-col gap-12 animate-fadeIn w-full mx-auto">
            {/* Header section */}
            <div className="w-full">
              <h3 className={`${merriweather.className} text-2xl md:text-3xl text-branding-black font-normal mb-3`}>
                {t("poetry_intro_title")}
              </h3>
              <p className="text-base text-branding-black/80 font-light leading-relaxed">
                {t("poetry_intro_desc")}
              </p>
            </div>

            {/* Vocal padding / visualizer section */}
            <div className="w-full bg-white p-8 rounded-3xl border border-branding-brown/10 shadow-sm">
              <h4 className={`${merriweather.className} text-xl text-branding-black font-bold mb-3`}>
                {t("poetry_transition_title")}
              </h4>
              <p className="text-[15px] text-branding-black/80 font-light leading-relaxed mb-8">
                {t("poetry_transition_desc")}
              </p>

              {/* Song visualizers */}
              <div className="flex flex-col gap-8 w-full">
                {/* Example 1: Làm trai */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-gray-100 pb-8">
                  <div className="bg-[#f9fafb] p-6 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                      {locale === "vi" ? "Bản gốc Ca dao (Văn học)" : "Original Folk Verse"}
                    </span>
                    <pre className={`${merriweather.className} text-sm md:text-base text-branding-black font-normal whitespace-pre-line leading-relaxed text-center`}>
                      {`Làm trai quyết chí tu thân,
Công danh chớ vội, nợ nần chớ lo.
Khi nên, trời giúp công cho,
Làm trai năm liệu bảy lo mới hào.`}
                    </pre>
                  </div>
                  <div className="bg-[#fffbeb] p-6 rounded-2xl border border-amber-200/85 text-center flex flex-col items-center justify-center">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-branding-brown/95 mb-3 font-bold">
                      {locale === "vi" ? "Bản hát Dân ca (Nhạc điệu)" : "Sung Folk Song Melody"}
                    </span>
                    <p className="text-sm md:text-base text-branding-black/95 font-medium leading-relaxed text-center">
                      Quyết chí <strong className="text-branding-brown font-bold">mà</strong> tu thân <strong className="text-branding-brown font-bold">ơ</strong>,
                      <br />
                      Công danh <strong className="text-branding-brown font-bold">là danh</strong> chớ vội <strong className="text-branding-brown font-bold">chứ đã</strong> nợ nần...
                      <br />
                      <strong className="text-branding-brown font-bold">mà</strong> không lo,
                    </p>
                  </div>
                </div>

                {/* Example 2: Trống cơm */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#f9fafb] p-6 rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                      {locale === "vi" ? "Bản gốc Ca dao (Văn học)" : "Original Folk Verse"}
                    </span>
                    <pre className={`${merriweather.className} text-sm md:text-base text-branding-black font-normal whitespace-pre-line leading-relaxed text-center`}>
                      {`Trống cơm khéo vỗ nên vông,
Một bầy con sếu lội sông đi tìm.
Thương ai con mắt lim dim,
Một bầy con nhện đi tìm giăng tơ.
Thương ai duyên nợ tang bồng...`}
                    </pre>
                  </div>
                  <div className="bg-[#fffbeb] p-6 rounded-2xl border border-amber-200/85 text-center flex flex-col items-center justify-center">
                    <span className="block text-xs font-semibold uppercase tracking-wider text-branding-brown/95 mb-3 font-bold">
                      {locale === "vi" ? "Bản hát Dân ca (Nhạc điệu)" : "Sung Folk Song Melody"}
                    </span>
                    <p className="text-sm md:text-base text-branding-black/95 font-medium leading-relaxed text-center">
                      <strong className="text-branding-brown font-bold">(Tình bằng)</strong> có cái trống cơm, khen ai khéo vỗ <strong className="text-branding-brown font-bold">(ấy mấy)</strong> vông nên vông <strong className="text-branding-brown font-bold">(ấy mấy)</strong> vông nên vông,
                      <br />
                      Một bầy <strong className="text-branding-brown font-bold">(tang tình)</strong> con sếu lội lội lội sông <strong className="text-branding-brown font-bold">(ấy mấy)</strong> đi tìm.
                      <br />
                      Em nhớ thương ai đôi con mắt <strong className="text-branding-brown font-bold">(ấy mấy)</strong> lim dim...
                      <br />
                      Một bầy <strong className="text-branding-brown font-bold">(tang tình)</strong> con nhện <strong className="text-branding-brown font-bold">(ì ới a, ấy mấy)</strong> giăng tơ, giăng tơ <strong className="text-branding-brown font-bold">(ấy mấy)</strong> đi tìm.
                      <br />
                      Em nhớ thương ai, duyên nợ khách tang bồng...
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cultural Properties section */}
            <div className="w-full mt-4">
              <h3 className={`${merriweather.className} text-2xl md:text-3xl text-branding-black font-normal mb-6 border-b border-gray-100 pb-3`}>
                {t("properties_title")}
              </h3>

              {/* Properties stack */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-3xl border border-branding-brown/10 shadow-sm flex flex-col gap-4">
                  <span className="text-4xl font-normal text-branding-brown">01</span>
                  <h4 className={`${merriweather.className} text-lg text-branding-black font-bold`}>
                    {t("prop_collective_title")}
                  </h4>
                  <p className="text-sm md:text-[15px] text-branding-black/80 font-light leading-relaxed">
                    {t("prop_collective_desc")}
                  </p>
                </div>

                <div className="bg-white p-8 rounded-3xl border border-branding-brown/10 shadow-sm flex flex-col gap-4">
                  <span className="text-4xl font-normal text-branding-brown">02</span>
                  <h4 className={`${merriweather.className} text-lg text-branding-black font-bold`}>
                    {t("prop_oral_title")}
                  </h4>
                  <p className="text-sm md:text-[15px] text-branding-black/80 font-light leading-relaxed">
                    {t("prop_oral_desc")}
                  </p>
                </div>
              </div>
            </div>

            {/* Academic blockquotes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full mt-4 bg-gray-50/30 p-8 md:p-10 rounded-3xl border border-gray-100">
              <div className="flex flex-col gap-4">
                <span className="text-5xl font-serif text-branding-brown/20 leading-none h-4">“</span>
                <h5 className={`${merriweather.className} text-base text-branding-black font-bold leading-snug`}>
                  {t("quote_bogatyrev_title")}
                </h5>
                <blockquote className="text-xs md:text-sm text-branding-black/75 italic leading-relaxed pl-4 border-l-2 border-branding-brown/30">
                  {t("quote_bogatyrev_body")}
                </blockquote>
              </div>

              <div className="flex flex-col gap-4">
                <span className="text-5xl font-serif text-branding-brown/20 leading-none h-4">“</span>
                <h5 className={`${merriweather.className} text-base text-branding-black font-bold leading-snug`}>
                  {t("quote_chicherov_title")}
                </h5>
                <blockquote className="text-xs md:text-sm text-branding-black/75 italic leading-relaxed pl-4 border-l-2 border-branding-brown/30">
                  {t("quote_chicherov_body")}
                </blockquote>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Dictionary & Search */}
        {activeTab === "search" && (
          <div className="flex flex-col gap-6 animate-fadeIn w-full">
            {/* Main header title for Search section */}
            <h3 className={`${merriweather.className} text-2xl text-branding-black font-normal mt-2`}>
              {locale === "vi" ? "Từ điển & Tìm kiếm Thành ngữ, Tục ngữ, Ca Dao Việt Nam" : "Dictionary & Search of Proverbs and Folk Verses"}
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
            <option value="ALL">{locale === "vi" ? "Tất cả phân loại" : "All Categories"}</option>
            <option value="CA DAO">Ca Dao</option>
            <option value="TỤC NGỮ">Tục Ngữ</option>
            <option value="TỤC NGỮ HÁN VIỆT">Tục Ngữ Hán Việt</option>
            <option value="THÀNH NGỮ">Thành Ngữ</option>
            <option value="THÀNH NGỮ HÁN VIỆT">Thành Ngữ Hán Việt</option>
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
            placeholder={locale === "vi" ? "Tìm kiếm theo câu thơ..." : "Search by verses..."}
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
            <span className="text-sm text-gray-500">{locale === "vi" ? "Đang tải dữ liệu..." : "Loading letter data..."}</span>
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
                      <span className="text-xs text-gray-500">{locale === "vi" ? "Đang tải nghĩa giải thích..." : "Loading explanation..."}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Side: Cropped Page Scan (Whole element clickable) */}
              <div 
                onClick={() => setActiveScanId(entry.id)}
                className="w-full md:w-[32%] min-h-[160px] md:min-h-none flex-shrink-0 border border-gray-150 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center relative group cursor-zoom-in"
              >
                <img
                  src={`https://iiif.digitizingvietnam.com/iiif/2/tu-dien-thanh-ngu-tuc-ngu-ca-dao-viet-nam/output-folder/${entry.id}.png/full/full/0/default.jpg`}
                  alt="Scanned page snippet"
                  className="object-contain max-h-[220px] md:max-h-none w-full h-full transition-transform duration-300 group-hover:scale-102"
                  loading="lazy"
                />
                
                {/* Maximize zoom overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                  <span className="px-4 py-2 bg-white/95 text-branding-black text-xs font-bold rounded-lg shadow-md flex items-center gap-1.5">
                    <Maximize2 className="h-3.5 w-3.5" />
                    {locale === "vi" ? "Xem phóng to" : "Maximize view"}
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
            {locale === "vi" ? "Không tìm thấy dữ liệu phù hợp với bộ lọc và tìm kiếm." : "No data matching your filters and search."}
          </div>
        )}
      </div>
      </div>
    )}
  </div>

      {/* Lightbox Modal for enlarged scans matching templates/wiki.html */}
      {activeScanId && (
        <div 
          onClick={() => setActiveScanId(null)}
          className="fixed inset-0 z-50 bg-[#2d1810]/90 backdrop-blur-md flex items-center justify-center p-4 select-none cursor-zoom-out"
          style={{ animation: 'lightboxFadeIn 0.25s ease-out forwards' }}
          role="dialog"
          aria-modal="true"
        >
          {/* Close Button - Clean '×' positioned in top-right */}
          <button 
            onClick={() => setActiveScanId(null)}
            className="absolute top-6 right-8 bg-transparent border-none text-white text-5xl font-light hover:text-branding-brown hover:scale-105 transition-all opacity-80 hover:opacity-100 cursor-pointer outline-none select-none z-10"
            aria-label="Close image"
          >
            &times;
          </button>
          
          {/* Enlarged image snippet with premium white card padding wrapper */}
          <img 
            src={`https://iiif.digitizingvietnam.com/iiif/2/tu-dien-thanh-ngu-tuc-ngu-ca-dao-viet-nam/output-folder/${activeScanId}.png/full/full/0/default.jpg`}
            alt="Enlarged scan"
            className="max-w-[90%] max-h-[85vh] object-contain rounded-lg bg-white p-2 shadow-2xl cursor-zoom-out select-none"
            style={{ 
              animation: 'lightboxZoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              boxShadow: '0 1rem 3rem rgba(0, 0, 0, 0.4)'
            }}
            onClick={(e) => {
              // Clicking the image itself closes the lightbox, matching the design
              setActiveScanId(null);
            }}
          />
        </div>
      )}
    </div>
  );
}
