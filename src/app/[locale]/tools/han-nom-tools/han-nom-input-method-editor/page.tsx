// app/page.tsx
"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import nomMap from "./qn_nom.json";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";
import { PageHeader } from "@/components/common/PageHeader";
import localFont from "next/font/local";
import { Copy } from "lucide-react";
import { toast } from "sonner";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function HanNomTranslator() {
  const [inputText, setInputText] = useState("");
  const [words, setWords] = useState<string[][]>([]);
  const [candidates, setCandidates] = useState<string[][][]>([]);
  const [selectedChars, setSelectedChars] = useState<string[][]>([]);
  const [activeIndex, setActiveIndex] = useState<{
    line: number;
    word: number;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);

    const lines = text.split("\n").map((line) => line.trim().split(/\s+/));
    const mappedCandidates = lines.map((line) =>
      line.map((word) => nomMap[word] || [])
    );

    const mappedSelected = lines.map((line, i) =>
      line.map((word, j) => {
        if (words[i]?.[j] === word && selectedChars[i]?.[j]) {
          return selectedChars[i][j];
        }
        return mappedCandidates[i][j]?.[0] || "";
      })
    );

    setWords(lines);
    setCandidates(mappedCandidates);
    setSelectedChars(mappedSelected);
    setActiveIndex(
      lines.length > 0
        ? { line: lines.length - 1, word: lines[lines.length - 1].length - 1 }
        : null
    );
  };

  const handleSelect = (lineIndex: number, wordIndex: number, char: string) => {
    const updated = selectedChars.map((line, i) =>
      line.map((c, j) => (i === lineIndex && j === wordIndex ? char : c))
    );
    setSelectedChars(updated);
  };

  const t = useTranslations();
  const locale = useLocale();

  const handleCopy = () => {
    const textToCopy = selectedChars.map((line) => line.join(" ")).join("\n");
    navigator.clipboard.writeText(textToCopy);
    toast.success(t("Toast.copied"));
  };

  return (
    <div className="flex-col mb-20 w-full">
      <PageHeader
        title={t("Tools.han-nom-tools.tools.han-nom-input-method-editor.name")}
        subtitle={t(
          "Tools.han-nom-tools.tools.han-nom-input-method-editor.description"
        )}
        breadcrumbItems={[
          { label: t("NavigationBar.tools"), href: "tools" },
          { label: t("Tools.han-nom-tools.name"), href: "tools/han-nom-tools" },
          {
            label: t(
              "Tools.han-nom-tools.tools.han-nom-input-method-editor.name"
            ),
          },
        ]}
        locale={locale}
      />
      <div className="flex flex-col md:flex-row gap-4 mt-10">
        {/* Input Box */}
        <div className="w-full md:w-1/2">
          <Textarea
            value={inputText}
            onChange={handleChange}
            placeholder={t(
              "Tools.han-nom-tools.tools.han-nom-input-method-editor.type-in-quoc-ngu"
            )}
            className="h-40"
          />
        </div>

        {/* Output Box */}
        <div className="w-full md:w-1/2">
          <Card>
            <CardContent className="py-4 space-y-4">
              <div className="flex justify-between items-start">
                <div className="text-xl whitespace-pre-line">
                  <LookupableHanNomText
                    text={selectedChars
                      .map((line) => line.join(" "))
                      .join("\n")}
                  />
                </div>
                <div className="flex h-full justify-stretch items-start">
                  <Button
                    // variant="ghost"
                    size="icon"
                    className="bg-black"
                    onClick={handleCopy}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {activeIndex && words[activeIndex.line]?.[activeIndex.word] && (
                  <div className="space-y-1">
                    <div className="font-medium text-xl">
                      {words[activeIndex.line][activeIndex.word]}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {candidates[activeIndex.line][activeIndex.word]?.map(
                        (char, i) => (
                          <Button
                            key={i}
                            variant={
                              selectedChars[activeIndex.line][
                                activeIndex.word
                              ] === char
                                ? "default"
                                : "ghost"
                            }
                            onClick={() =>
                              handleSelect(
                                activeIndex.line,
                                activeIndex.word,
                                char
                              )
                            }
                          >
                            <div className={`${NomNaTong.className} text-xl`}>
                              {char}
                            </div>
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
