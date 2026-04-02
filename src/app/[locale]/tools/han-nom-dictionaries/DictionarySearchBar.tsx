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
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import HandwritingPad from "./HandwritingPad";
import { useTranslations } from "next-intl";
import InputMethodSelector from "@/app/[locale]/tools/han-nom-tools/han-nom-input-method-editor/InputMethodSelector";
import CompactRadicals from "@/app/[locale]/tools/han-nom-tools/han-nom-input-method-editor/CompactRadicals";
import QuocNguSingleChar from "@/app/[locale]/tools/han-nom-tools/han-nom-input-method-editor/QuocNguSingleChar";
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

type InputMethod = "quoc-ngu" | "handwriting" | "radical";
export default function DictionarySearchBar({
  placeholder,
  searchWord,
  hdwd_list = [], // default empty array
  searchPath = "",
}: {
  placeholder: string;
  searchWord: string | undefined;
  hdwd_list?: string[];
  searchPath?: string;
}) {
  const t = useTranslations();

  const [searchKeyword, setSearchKeyword] = useState(searchWord || "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [userIsTyping, setUserIsTyping] = useState(false);
  const [lastSearchTerm, setLastSearchTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions with debouncing to prevent infinite loops
  useEffect(() => {
    const currentSearchTerm = searchKeyword.toLowerCase().trim();

    // Only process if the search term actually changed and user is typing
    if (currentSearchTerm === lastSearchTerm || !userIsTyping) {
      return;
    }

    setLastSearchTerm(currentSearchTerm);

    if (!currentSearchTerm || hdwd_list.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    // Filter entries where any word starts with the search term
    const filtered = hdwd_list.filter((entry) => {
      const entryLower = entry.toLowerCase();

      // Check if the entire entry starts with search term (highest priority)
      if (entryLower.startsWith(currentSearchTerm)) {
        return true;
      }

      // Check if any word in the compound entry starts with search term
      // Split by spaces and check each word
      const words = entryLower.split(/\s+/);
      return words.some((word) => word.startsWith(currentSearchTerm));
    });

    // Sort to prioritize entries that start with the search term
    const sorted = filtered.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();

      // Entries starting with search term come first
      if (
        aLower.startsWith(currentSearchTerm) &&
        !bLower.startsWith(currentSearchTerm)
      ) {
        return -1;
      }
      if (
        !aLower.startsWith(currentSearchTerm) &&
        bLower.startsWith(currentSearchTerm)
      ) {
        return 1;
      }

      // Otherwise maintain alphabetical order
      return a.localeCompare(b);
    });

    const newSuggestions = sorted.slice(0, 20);
    setSuggestions(newSuggestions);
    setShowSuggestions(newSuggestions.length > 0);
    setActiveSuggestionIndex(-1);
  }, [searchKeyword, hdwd_list, userIsTyping, lastSearchTerm]);

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

  const handleSearch = (term?: string) => {
    const searchTerm = term || searchKeyword;
    if (searchTerm.trim()) {
      setUserIsTyping(false); // Reset typing state before navigation
      const query = `?q=${encodeURIComponent(searchTerm)}`;
      window.location.href = searchPath ? `${searchPath}${query}` : query;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
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
      setLastSearchTerm("");
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

  const [open, setOpen] = useState(false);
  const [inputMethod, setInputMethod] = useState<InputMethod>("radical");
  const [radicals, setRadicals] = useState<Radical[]>([]);

  useEffect(() => {
    getRadicals().then(setRadicals);
  }, []);

  const handleCandidateSelected = (char: string) => {
    const newKeyword = searchKeyword + char;
    setSearchKeyword(newKeyword);
    setUserIsTyping(true);
    setLastSearchTerm(""); // Reset to force suggestion recalculation
    setOpen(false);
  };

  return (
    <div className="relative w-full flex items-center gap-2">
      <div className="relative flex-1">
        <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-700 z-10" />
        <input
          ref={inputRef}
          type="text"
          name="search-query"
          placeholder={placeholder}
          value={searchKeyword}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          className={`${NomNaTong.className} w-full h-[54px] px-5 py-2 pl-12 bg-white shadow-lg rounded-[26px]`}
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <div className="rounded-lg h-12 px-3 border flex items-center justify-center cursor-pointer bg-black hover:bg-gray-800 transition-all">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <span className={`${notoSerifSC.className} text-xl leading-none antialiased text-white`}>部</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {t(
                      "Tools.han-nom-dictionaries.alternative-input-methods.tooltip"
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </DialogTrigger>

        <DialogContent className="w-[95vw] max-w-2xl h-[85vh] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {t("Tools.han-nom-dictionaries.alternative-input-methods.title")}
            </DialogTitle>
            <DialogDescription>
              {t(
                "Tools.han-nom-dictionaries.alternative-input-methods.description"
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <InputMethodSelector
                value={inputMethod}
                onChange={setInputMethod}
              />
              <p className="text-sm text-muted-foreground">
                {t(
                  `Tools.han-nom-dictionaries.alternative-input-methods.${inputMethod}-description`
                )}
              </p>
            </div>
            <div
              className={`border rounded-lg bg-gray-50 flex-1 min-h-0 p-3 ${
                inputMethod === "radical"
                  ? "overflow-hidden"
                  : "overflow-y-auto"
              }`}
            >
              {inputMethod === "quoc-ngu" && (
                <QuocNguSingleChar
                  onCharacterSelect={handleCandidateSelected}
                />
              )}
              {inputMethod === "handwriting" && (
                <HandwritingPad onSelect={handleCandidateSelected} />
              )}
              {inputMethod === "radical" && (
                <div className="h-full">
                  <CompactRadicals
                    radicals={radicals}
                    onCharacterSelect={handleCandidateSelected}
                    autoScrollToStroke
                  />
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Button onClick={() => handleSearch()} className="h-12 rounded-lg">
        {t("Button.search")}
      </Button>
    </div>
  );
}
