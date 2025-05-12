"use client";

import { useState } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PencilIcon } from "lucide-react";
import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import HandwritingPad from "./HandwritingPad";
import { useTranslations } from "next-intl";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import localFont from "next/font/local";

const NomNaTong = localFont({
  src: "../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});
export default function DictionarySearchBar({
  placeholder,
  searchWord,
}: {
  placeholder: string;
  searchWord: string | undefined;
}) {
  const t = useTranslations();

  const [searchKeyword, setSearchKeyword] = useState(searchWord || "");

  const handleSearch = () => {
    window.location.href = `?q=${encodeURIComponent(searchKeyword)}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const [open, setOpen] = useState(false);

  const handleCandidateSelected = (char: string) => {
    setSearchKeyword(searchKeyword + char); // append
    setOpen(false); // close dialog
  };

  return (
    <div className="relative w-full flex items-center gap-2">
      <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-700" />
      <input
        type="text"
        name="search-query"
        placeholder={placeholder}
        value={searchKeyword}
        onChange={(e) => setSearchKeyword(e.target.value)}
        onKeyDown={handleKeyDown}
        className={`${NomNaTong.className} flex-1 h-[54px] w-full px-5 py-2 pl-12 bg-white shadow-lg rounded-[26px]`}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="rounded-lg h-12 px-3">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  {/* <Image
                    unoptimized
                    src="/images/signature.png"
                    alt="handwriting"
                    width={20}
                    height={20}
                  /> */}
                  <PencilIcon className="w-4 h-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("Tools.han-nom-dictionaries.writing-pad.tooltip")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("Tools.han-nom-dictionaries.writing-pad.title")}
            </DialogTitle>
            <DialogDescription>
              {t("Tools.han-nom-dictionaries.writing-pad.description")}
            </DialogDescription>
          </DialogHeader>

          <HandwritingPad onSelect={handleCandidateSelected} />
        </DialogContent>
      </Dialog>

      <Button onClick={handleSearch} className="h-12 rounded-lg">
        {t("Button.search")}
      </Button>
    </div>
  );
}
