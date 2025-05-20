"use client";
import { Link } from "@/i18n/routing";
import React, { useState } from "react";
import localFont from "next/font/local";
import EntryTDCNDG from "@/app/[locale]/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai/Entry";
import EntryGDNVHV from "@/app/[locale]/tools/han-nom-dictionaries/giup-doc-nom-va-han-viet/Entry";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

import { useTranslations } from "next-intl";

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
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState("");
  const [entryData, setEntryData] = useState<{
    tdcndg: {
      defs: DictionaryEntry[];
      refs: [];
    };
    giupdoc: GDNVHVDictionaryEntry[];
  } | null>({
    tdcndg: {
      defs: [],
      refs: [],
    },
    giupdoc: [],
  });
  const [loading, setLoading] = useState(false);
  const t = useTranslations();

  const handleDictionarySearch = async (character) => {
    setLoading(true);
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
      const response = await fetch(
        `${apiUrl}/han-nom-dictionary/all?q=${character}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch dictionary entry");
      }

      const data = await response.json();
      setEntryData(data); // Store the fetched entry data
      setDialogVisible(true); // Show the dialog with the entry data
      setSelectedCharacter(character);
    } catch (err: any) {
      toast.error(t("Toast.error-occurred"));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogVisible(false);
    setSelectedCharacter("");
    setEntryData({
      tdcndg: {
        defs: [],
        refs: [],
      },
      giupdoc: [],
    });
  };

  const characters = Array.from(text);

  return (
    <div>
      <div className={`text-2xl ${NomNaTong.className}  ${className || ""}`}>
        {characters.map((word, index) => (
          <HoverCard key={index}>
            <HoverCardTrigger>
              <span className="cursor-pointer">{word}</span>
            </HoverCardTrigger>
            <HoverCardContent>
              <Button
                className=" text-white px-4 py-2 rounded"
                onClick={() => {
                  handleDictionarySearch(word);
                }}
                disabled={loading}
              >
                {loading ? t("Button.looking-up") : t("Button.look-up")}
              </Button>
            </HoverCardContent>
          </HoverCard>
        ))}
      </div>

      <Dialog open={dialogVisible} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle
              className={`text-center text-2xl mt-2 ${NomNaTong.className}`}
            >
              {selectedCharacter}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="mt-4 max-h-64">
            {entryData!.tdcndg &&
              (entryData!.tdcndg.defs.length > 0 ? (
                <div>
                  <Link
                    href={`/tools/han-nom-dictionaries/tu-dien-chu-nom-dan-giai?q=${selectedCharacter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="text-xl mb-2 hover:underline">
                      {t(
                        "Tools.han-nom-dictionaries.dictionaries.tu-dien-chu-nom-dan-giai.name"
                      )}
                    </div>
                  </Link>
                  <EntryTDCNDG
                    entry={entryData!.tdcndg.defs[0]}
                    refs={entryData!.tdcndg.refs}
                  />
                </div>
              ) : (
                <p>{t("Tools.han-nom-dictionaries.no-result")}</p>
              ))}
            <div className="mt-10"></div>
            {entryData!.giupdoc &&
              (entryData!.giupdoc.length > 0 ? (
                <div>
                  <Link
                    href={`/tools/han-nom-dictionaries/giup-doc-nom-va-han-viet?q=${selectedCharacter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="text-xl mb-2 hover:underline">
                      {t(
                        "Tools.han-nom-dictionaries.dictionaries.giup-doc-nom-va-han-viet.name"
                      )}
                    </div>
                  </Link>
                  <EntryGDNVHV entry={entryData!.giupdoc[0]} />
                </div>
              ) : (
                <p>{t("Tools.han-nom-dictionaries.no-result")}</p>
              ))}
          </ScrollArea>
          <Button
            className="mt-4 px-4 py-4 rounded"
            onClick={handleCloseDialog}
          >
            {t("Button.close")}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
