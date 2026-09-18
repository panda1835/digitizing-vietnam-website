"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MagnifyingGlassIcon, PencilIcon } from "@heroicons/react/16/solid";
import HandwritingPad from "./HandwritingPad";
import { useTranslations } from "next-intl";
import CompactRadicals from "@/app/[locale]/tools/han-nom-tools/han-nom-input-method-editor/CompactRadicals";
import {
  getRadicals,
  type Radical,
} from "@/app/[locale]/tools/han-nom-tools/han-nom-input-method-editor/actions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import localFont from "next/font/local";
import { Noto_Serif_SC } from "next/font/google";

const NomNaTong = localFont({
  src: "../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

const notoSerifSC = Noto_Serif_SC({ weight: "500", subsets: ["latin"] });

function isCJKChar(char: string): boolean {
  const codePoint = char.codePointAt(0);
  if (codePoint === undefined) return false;

  return (
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
    (codePoint >= 0x20000 && codePoint <= 0x2ebef) ||
    (codePoint >= 0x30000 && codePoint <= 0x323af) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff) ||
    (codePoint >= 0x2e80 && codePoint <= 0x2fdf)
  );
}

function isComponentQuery(query: string): boolean {
  const characters = Array.from(query.trim());
  return characters.length >= 2 && characters.every(isCJKChar);
}

export default function DictionarySearchBar({
  placeholder,
  searchWord,
  hdwd_list = [], // default empty array
  searchPath = "",
  stackFromXl = false,
  variant = "pill",
}: {
  placeholder: string;
  searchWord: string | undefined;
  hdwd_list?: string[];
  searchPath?: string;
  // From xl up, keep the buttons on their own line: for a narrow column on a
  // wide screen, where the row would squeeze the input.
  stackFromXl?: boolean;
  // "pill" is the dictionary pages' own tall rounded bar; "flat" matches the
  // plainer bordered box Việt Điển uses, for sitting beside it on the hub.
  variant?: "pill" | "flat";
}) {
  const t = useTranslations();

  const flat = variant === "flat";
  const fieldHeight = flat ? "h-[42px]" : "h-[54px]";
  const inputClass = flat
    ? `${fieldHeight} px-4 pl-10 rounded-md border border-slate-300 bg-white text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-branding-brown focus:border-branding-brown`
    : `${fieldHeight} px-5 py-2 pl-12 bg-white shadow-lg rounded-[26px]`;
  const buttonClass = flat
    ? `${fieldHeight} rounded-md px-3 border flex items-center justify-center cursor-pointer bg-black hover:bg-gray-800 transition-all`
    : "rounded-lg h-12 px-3 border flex items-center justify-center cursor-pointer bg-black hover:bg-gray-800 transition-all";

  const [searchKeyword, setSearchKeyword] = useState(searchWord || "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [userIsTyping, setUserIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userIsTyping) return;

    const searchTerm = searchKeyword.trim();
    if (!searchTerm) {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    const componentQuery = isComponentQuery(searchTerm);
    const controller = new AbortController();

    if (componentQuery) {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }

    const timer = window.setTimeout(
      async () => {
        let nextSuggestions: string[] = [];

        if (componentQuery) {
          try {
            const response = await fetch(
              `/api/han-nom-dictionary/components?q=${encodeURIComponent(
                searchTerm
              )}`,
              { signal: controller.signal }
            );

            if (response.ok) {
              const data = (await response.json()) as { matches?: string[] };
              nextSuggestions = data.matches ?? [];
            }
          } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError")
              return;
            console.error("Failed to load component suggestions:", error);
          }
        } else if (hdwd_list.length > 0) {
          const lowerSearchTerm = searchTerm.toLowerCase();
          nextSuggestions = hdwd_list
            .filter((entry) => {
              const entryLower = entry.toLowerCase();
              return (
                entryLower.startsWith(lowerSearchTerm) ||
                entryLower
                  .split(/\s+/)
                  .some((word) => word.startsWith(lowerSearchTerm))
              );
            })
            .sort((first, second) => {
              const firstStarts = first
                .toLowerCase()
                .startsWith(lowerSearchTerm);
              const secondStarts = second
                .toLowerCase()
                .startsWith(lowerSearchTerm);
              if (firstStarts !== secondStarts) return firstStarts ? -1 : 1;
              return first.localeCompare(second);
            })
            .slice(0, 20);
        }

        setSuggestions(nextSuggestions);
        setShowSuggestions(nextSuggestions.length > 0);
        setActiveSuggestionIndex(-1);
      },
      componentQuery ? 150 : 0
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchKeyword, hdwd_list, userIsTyping]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navigateToSearch = (searchTerm: string) => {
    setUserIsTyping(false);
    const query = `?q=${encodeURIComponent(searchTerm)}`;
    window.location.href = searchPath ? `${searchPath}${query}` : query;
  };

  const handleSearch = (term?: string) => {
    const searchTerm = term || searchKeyword;
    if (!searchTerm.trim()) return;
    navigateToSearch(searchTerm);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (activeSuggestionIndex >= 0 && suggestions[activeSuggestionIndex]) {
        handleSuggestionClick(suggestions[activeSuggestionIndex]);
      } else {
        handleSearch();
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1
      );
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchKeyword(newValue);
    setUserIsTyping(true);

    // If user clears the input, hide suggestions immediately and reset state
    if (newValue.trim() === "") {
      setShowSuggestions(false);
      setSuggestions([]);
      setActiveSuggestionIndex(-1);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchKeyword(suggestion);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    setUserIsTyping(false); // Reset typing state before navigation
    handleSearch(suggestion);
  };

  const handleInputFocus = () => {
    // Only show suggestions if user is typing and there are suggestions
    if (userIsTyping && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const [radicalOpen, setRadicalOpen] = useState(false);
  const [handwritingOpen, setHandwritingOpen] = useState(false);
  const [radicals, setRadicals] = useState<Radical[]>([]);

  useEffect(() => {
    getRadicals().then(setRadicals);
  }, []);

  const handleCandidateSelected = (char: string) => {
    const newKeyword = searchKeyword + char;
    setSearchKeyword(newKeyword);
    setUserIsTyping(true);
    setRadicalOpen(false);
    setHandwritingOpen(false);
  };

  return (
    <div
      className={`relative w-full flex flex-wrap items-center gap-2 ${
        stackFromXl ? "sm:flex-nowrap xl:flex-wrap" : "sm:flex-nowrap"
      }`}
    >
      <div
        className={`relative basis-full flex-1 min-w-0 ${
          stackFromXl ? "sm:basis-auto xl:basis-full" : "sm:basis-auto"
        }`}
      >
        <MagnifyingGlassIcon
          className={`absolute ${
            flat ? "left-3 h-4 w-4" : "left-4 h-5 w-5"
          } top-1/2 transform -translate-y-1/2 text-gray-700 z-10`}
        />
        <input
          ref={inputRef}
          type="text"
          name="search-query"
          placeholder={placeholder}
          value={searchKeyword}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          className={`${NomNaTong.className} w-full ${inputClass}`}
          autoComplete="off"
        />

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`px-4 py-3 cursor-pointer hover:bg-yellow-50 border-b border-gray-100 last:border-b-0 ${
                  index === activeSuggestionIndex
                    ? "bg-yellow-50 text-branding-brown"
                    : "text-gray-800"
                } ${NomNaTong.className}`}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setActiveSuggestionIndex(index)}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Radical search */}
      <Dialog open={radicalOpen} onOpenChange={setRadicalOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                {/* A button, not a div: the tooltip is hover-only, so the
                    label here is what a keyboard, a screen reader or a touch
                    user has to go on. */}
                <button
                  type="button"
                  aria-label={t(
                    "Tools.han-nom-dictionaries.alternative-input-methods.radical-tooltip"
                  )}
                  className={buttonClass}
                >
                  <span
                    className={`${notoSerifSC.className} text-xl leading-none antialiased text-white`}
                  >
                    部
                  </span>
                </button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {t(
                  "Tools.han-nom-dictionaries.alternative-input-methods.radical-tooltip"
                )}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DialogContent className="w-[95vw] max-w-2xl h-[85vh] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {t(
                "Tools.han-nom-dictionaries.alternative-input-methods.radical-title"
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                "Tools.han-nom-dictionaries.alternative-input-methods.radical-description"
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 border rounded-lg bg-gray-50 p-3 overflow-hidden">
            <div className="h-full">
              <CompactRadicals
                radicals={radicals}
                onCharacterSelect={handleCandidateSelected}
                autoScrollToStroke
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Handwriting search */}
      <Dialog open={handwritingOpen} onOpenChange={setHandwritingOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <DialogTrigger asChild>
                <button
                  type="button"
                  aria-label={t(
                    "Tools.han-nom-dictionaries.alternative-input-methods.handwriting-tooltip"
                  )}
                  className={buttonClass}
                >
                  <PencilIcon className="h-5 w-5 text-white" />
                </button>
              </DialogTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {t(
                  "Tools.han-nom-dictionaries.alternative-input-methods.handwriting-tooltip"
                )}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DialogContent className="w-[95vw] max-w-2xl h-[85vh] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {t(
                "Tools.han-nom-dictionaries.alternative-input-methods.handwriting-title"
              )}
            </DialogTitle>
            <DialogDescription>
              {t(
                "Tools.han-nom-dictionaries.alternative-input-methods.handwriting-description"
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 border rounded-lg bg-gray-50 p-3 overflow-y-auto">
            <HandwritingPad onSelect={handleCandidateSelected} />
          </div>
        </DialogContent>
      </Dialog>

      <Button
        onClick={() => handleSearch()}
        className={flat ? `${fieldHeight} rounded-md` : "h-12 rounded-lg"}
      >
        {t("Button.search")}
      </Button>
    </div>
  );
}
