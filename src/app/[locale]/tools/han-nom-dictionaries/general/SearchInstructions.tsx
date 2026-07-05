"use client";

import { useTranslations } from "next-intl";
import localFont from "next/font/local";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

// Same NomNaTong pattern the dictionary Entry components use so the example
// glyphs render in the dictionary's font rather than a system fallback.
const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

export default function SearchInstructions() {
  const t = useTranslations(
    "Tools.han-nom-dictionaries.dictionaries.general.instructions"
  );

  const modes = [
    {
      key: "char",
      title: t("char-title"),
      desc: t("char-desc"),
      example: t("char-example"),
      isHanNom: true,
    },
    {
      key: "quocngu",
      title: t("quocngu-title"),
      desc: t("quocngu-desc"),
      example: t("quocngu-example"),
      isHanNom: false,
    },
    {
      key: "components",
      title: t("components-title"),
      desc: t("components-desc"),
      example: t("components-example"),
      isHanNom: true,
    },
    {
      key: "radical",
      title: t("radical-title"),
      desc: t("radical-desc"),
      example: null,
      isHanNom: true,
    },
  ];

  return (
    <div className="mb-6">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem
          value="how-to-search"
          className="border rounded-lg bg-white px-4"
        >
          <AccordionTrigger className="text-branding-brown hover:no-underline">
            {t("title")}
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-gray-700 mb-4">{t("intro")}</p>
            <ul className="flex flex-col gap-4">
              {modes.map((mode) => (
                <li key={mode.key} className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">
                      {mode.title}
                    </span>
                    {mode.example && (
                      <>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-500 text-xs uppercase tracking-wide">
                          {t("example-label")}
                        </span>
                        <span
                          className={`text-xl text-branding-brown ${
                            mode.isHanNom ? NomNaTong.className : ""
                          }`}
                        >
                          {mode.example}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-gray-600">{mode.desc}</p>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
