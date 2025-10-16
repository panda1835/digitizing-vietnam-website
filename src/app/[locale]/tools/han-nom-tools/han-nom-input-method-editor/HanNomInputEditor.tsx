"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import localFont from "next/font/local";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import InputMethodSelector from "./InputMethodSelector";
import HandwritingPad from "../../han-nom-dictionaries/HandwritingPad";
import CompactRadicals from "./CompactRadicals";
import QuocNguSingleChar from "./QuocNguSingleChar";
import { getRadicals, type Radical } from "./actions";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

type InputMethod = "quoc-ngu" | "handwriting" | "radical";

export default function HanNomTranslator() {
  const [inputMethod, setInputMethod] = useState<InputMethod>("quoc-ngu");
  const [radicals, setRadicals] = useState<Radical[]>([]);
  const [outputText, setOutputText] = useState("");
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const outputTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch radicals on mount
  useEffect(() => {
    getRadicals().then(setRadicals);
  }, []);

  // Update cursor position in textarea after inserting character
  useEffect(() => {
    if (outputTextareaRef.current) {
      outputTextareaRef.current.focus();
      outputTextareaRef.current.setSelectionRange(
        cursorPosition,
        cursorPosition
      );
    }
  }, [cursorPosition]);

  const t = useTranslations();
  const locale = useLocale();

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    toast.success(t("Toast.copied"));
  };

  const handleCharacterSelect = (char: string) => {
    // Insert character at cursor position
    const before = outputText.substring(0, cursorPosition);
    const after = outputText.substring(cursorPosition);
    const newText = before + char + after;
    setOutputText(newText);
    // Move cursor after the inserted character
    setCursorPosition(cursorPosition + char.length);
  };

  const handleOutputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setOutputText(e.target.value);
    setCursorPosition(e.target.selectionStart || 0);
  };

  const handleOutputClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    setCursorPosition(e.currentTarget.selectionStart || 0);
  };

  const handleOutputKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    setCursorPosition(e.currentTarget.selectionStart || 0);
  };

  const clearOutput = () => {
    setOutputText("");
    setCursorPosition(0);
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

      {/* Input Method Selector */}
      <div className="mt-10 mb-4">
        <InputMethodSelector value={inputMethod} onChange={setInputMethod} />
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Left Side - Input Method */}
        <div className="w-full md:w-1/2 space-y-4">
          {inputMethod === "quoc-ngu" && (
            <div className="border rounded-lg p-4">
              <QuocNguSingleChar onCharacterSelect={handleCharacterSelect} />
            </div>
          )}

          {inputMethod === "handwriting" && (
            <div className="border rounded-lg p-4">
              <HandwritingPad onSelect={handleCharacterSelect} />
            </div>
          )}

          {inputMethod === "radical" && (
            <div className="border rounded-lg p-4">
              <CompactRadicals
                radicals={radicals}
                onCharacterSelect={handleCharacterSelect}
              />
            </div>
          )}
        </div>

        {/* Right Side - Output Box (shared across all methods) */}
        <div className="w-full md:w-1/2">
          <Card>
            <CardContent className="py-4 space-y-4">
              <div className="flex justify-between items-start gap-2">
                <Textarea
                  ref={outputTextareaRef}
                  value={outputText}
                  onChange={handleOutputChange}
                  onClick={handleOutputClick}
                  onKeyUp={handleOutputKeyUp}
                  className={`${NomNaTong.className} text-xl min-h-[200px] flex-1`}
                  placeholder={t(
                    "Tools.han-nom-tools.tools.han-nom-input-method-editor.output-placeholder"
                  )}
                />
                <div className="flex flex-col gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={clearOutput}
                    title="Clear output"
                  >
                    ✕
                  </Button>
                  <Button size="icon" className="bg-black" onClick={handleCopy}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
