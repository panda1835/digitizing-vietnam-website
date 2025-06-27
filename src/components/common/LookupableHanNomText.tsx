"use client";
import { Link } from "@/i18n/routing";
import React, { useState } from "react";
import localFont from "next/font/local";
import EntryTDCNDG from "@/app/[locale]/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai/Entry";
import EntryGDNVHV from "@/app/[locale]/tools/han-nom-dictionaries/giup-doc-nom-va-han-viet/Entry";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Merriweather } from "next/font/google";
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

const NomNaTong = localFont({
  src: "../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function LookupableHanNomText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState("");
  const [entryData, setEntryData] = useState<{
    tdcndg: {
      defs: DictionaryEntry[];
      refs: [];
    };
    giupdoc: GDNVHVDictionaryEntry[];
  } | null>({
    tdcndg: { defs: [], refs: [] },
    giupdoc: [],
  });
  const [loading, setLoading] = useState(false);
  const t = useTranslations();

  const handleDictionarySearch = async (character: string) => {
    setLoading(true);
    setPopoverOpen(true);
    try {
      const response = await fetch(
        `/api/han-nom-dictionary/all?q=${character}`
      );
      if (!response.ok) throw new Error("Failed to fetch dictionary entry");
      const data = await response.json();
      setEntryData(data);
      setSelectedCharacter(character);
    } catch (err: any) {
      toast.error(t("Toast.error-occurred"));
    } finally {
      setLoading(false);
    }
  };

  const characters = Array.from(text);

  return (
    <div>
      <div className={`text-2xl ${NomNaTong.className} ${className || ""}`}>
        {characters.map((word, index) => (
          <Popover
            key={index}
            open={popoverOpen && selectedCharacter === word}
            onOpenChange={(open) => setPopoverOpen(open)}
          >
            <PopoverTrigger asChild>
              <span
                className={`cursor-pointer hover:text-branding-brown`}
                onClick={() => handleDictionarySearch(word)}
              >
                {word}
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-96 max-w-3xl rounded-lg">
              <div
                className={`text-center ${NomNaTong.className} text-3xl mt-2`}
              >
                {selectedCharacter}
              </div>
              <ScrollArea className="mt-4 max-w-3xl pr-4 max-h-96 h-96">
                {loading ? (
                  <div className="flex justify-center items-center h-48">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-branding-brown"></div>
                  </div>
                ) : (
                  <>
                    {entryData!.tdcndg &&
                      entryData!.tdcndg.defs.length == 0 &&
                      entryData!.giupdoc &&
                      entryData!.giupdoc.length == 0 && (
                        <div className="text-center text-muted-foreground">
                          {t("Tools.han-nom-dictionaries.no-result")}
                        </div>
                      )}
                    {entryData!.tdcndg && entryData!.tdcndg.defs.length > 0 && (
                      <div>
                        <Link
                          href={`/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai?q=${selectedCharacter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <div
                            className={`text-xl text-branding-brown mb-4 hover:underline ${merriweather.className}`}
                          >
                            {t(
                              "Tools.han-nom-dictionaries.dictionaries.tu-dien-chu-nom-dan-giai.name"
                            )}
                          </div>
                        </Link>
                        {entryData!.tdcndg.defs.map((entry, idx) => (
                          <EntryTDCNDG
                            key={idx}
                            entry={entryData!.tdcndg.defs[idx]}
                            refs={entryData!.tdcndg.refs}
                          />
                        ))}
                      </div>
                    )}
                    <div className="mt-10"></div>
                    {entryData!.giupdoc && entryData!.giupdoc.length > 0 && (
                      <div>
                        <Link
                          href={`/tools/han-nom-dictionaries/giup-doc-nom-va-han-viet?q=${selectedCharacter}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <div
                            className={`text-xl text-branding-brown mb-4 hover:underline ${merriweather.className}`}
                          >
                            {t(
                              "Tools.han-nom-dictionaries.dictionaries.giup-doc-nom-va-han-viet.name"
                            )}
                          </div>
                        </Link>
                        <EntryGDNVHV entry={entryData!.giupdoc[0]} />
                      </div>
                    )}
                  </>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
        ))}
      </div>
    </div>
  );
}
