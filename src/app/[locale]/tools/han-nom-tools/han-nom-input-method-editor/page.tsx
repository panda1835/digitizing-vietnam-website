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

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function HanNomTranslator() {
  const [inputText, setInputText] = useState("");
  const [words, setWords] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<string[][]>([]);
  const [selectedChars, setSelectedChars] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setInputText(text);
    const splitWords = text.trim().split(/\s+/);
    const mappedCandidates = splitWords.map((word) => nomMap[word] || []);
    const mappedSelected = splitWords.map(
      (_, i) => mappedCandidates[i]?.[0] || ""
    );

    setWords(splitWords);
    setCandidates(mappedCandidates);
    setSelectedChars(mappedSelected);
    setActiveIndex(splitWords.length - 1);
  };

  const handleSelect = (wordIndex: number, char: string) => {
    const updated = [...selectedChars];
    updated[wordIndex] = char;
    setSelectedChars(updated);
  };
  const t = useTranslations();
  const locale = useLocale();
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
            placeholder="Nhập chữ Quốc ngữ..."
            className="h-40"
          />
        </div>

        {/* Output Box */}
        <div className="w-full md:w-1/2">
          <Card>
            <CardContent className="py-4 space-y-4">
              <div className="text-xl">
                <LookupableHanNomText text={selectedChars.join(" ")} />
              </div>

              <div className="space-y-2">
                {activeIndex !== null && words[activeIndex] && (
                  <div className="space-y-1">
                    <div className="font-medium">
                      {/* <LookupableHanNomText text={words[activeIndex]} /> */}
                      {words[activeIndex]}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {candidates[activeIndex]?.map((char, i) => (
                        <Button
                          key={i}
                          variant={
                            selectedChars[activeIndex] === char
                              ? "default"
                              : "ghost"
                          }
                          onClick={() => handleSelect(activeIndex, char)}
                        >
                          <div className={`${NomNaTong.className}`}>{char}</div>
                        </Button>
                      ))}
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
