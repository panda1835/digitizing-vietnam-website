"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Merriweather } from "next/font/google";
import { ChevronDown, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

const merriweather = Merriweather({
  weight: ["300", "400", "700"],
  subsets: ["vietnamese"],
});

interface Blank {
  word: string;
  options: string[];
}

interface Poem {
  poem_text: string;
  blanks: Blank[];
  introduction: string;
  interpretation: string;
}

interface TopicData {
  topic: string;
  poems: Poem[];
}

interface Segment {
  type: "text" | "blank";
  content?: string;
  index?: number;
  expected?: string;
  options?: string[];
}

export function HocCaDaoContent({ locale }: { locale: string }) {
  const t = useTranslations("Tools.ca-dao-tuc-ngu.hoc-ca-dao");

  // Game data state
  const [data, setData] = useState<TopicData[]>([]);
  const [loading, setLoading] = useState(true);

  // Selector states
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);
  const [activePoemIndex, setActivePoemIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Game play states
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [activeBlankIndex, setActiveBlankIndex] = useState<number | null>(null);
  const [hasChecked, setHasChecked] = useState(false);

  // Fetch learning data
  useEffect(() => {
    fetch("/data/ca-dao-tuc-ngu/learning-data.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load data");
        return res.json();
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading learning data:", err);
        setLoading(false);
      });
  }, []);

  // Current active topic & poem
  const currentTopic = data[activeTopicIndex];
  const currentPoem = currentTopic?.poems[activePoemIndex];

  // Reset answers when changing topic or poem
  useEffect(() => {
    setUserAnswers({});
    setActiveBlankIndex(null);
    setHasChecked(false);
  }, [activeTopicIndex, activePoemIndex]);

  // Automatically focus the first blank when a new poem loads
  useEffect(() => {
    if (currentPoem && currentPoem.blanks.length > 0) {
      setActiveBlankIndex(0);
    }
  }, [currentPoem]);

  // Translate topic names for English layout
  const getTopicLabel = (topic: string) => {
    if (locale !== "en") return topic;
    switch (topic) {
      case "Chủ đề tình cảm":
        return "Sentiments & Family";
      case "Chủ đề về hôn nhân":
        return "Marriage & Custom";
      case "Chủ đề về cái đẹp":
        return "Beauty & Integrity";
      case "Chủ đề về nông nghiệp":
        return "Agriculture & Labor";
      default:
        return topic;
    }
  };

  // Parser: segment the poem into lines of text and interactive blanks
  const poemLines = useMemo(() => {
    if (!currentPoem) return [];

    const { poem_text, blanks } = currentPoem;
    let currentIndex = 0;
    const segments: Segment[] = [];

    // Find each blank word position sequentially
    for (let i = 0; i < blanks.length; i++) {
      const blank = blanks[i];
      const pos = poem_text.indexOf(blank.word, currentIndex);
      if (pos !== -1) {
        if (pos > currentIndex) {
          segments.push({
            type: "text",
            content: poem_text.slice(currentIndex, pos),
          });
        }
        segments.push({
          type: "blank",
          index: i,
          expected: blank.word,
          options: blank.options,
        });
        currentIndex = pos + blank.word.length;
      }
    }

    if (currentIndex < poem_text.length) {
      segments.push({
        type: "text",
        content: poem_text.slice(currentIndex),
      });
    }

    // Split segments by newline to group them line-by-line
    const lines: Segment[][] = [[]];
    segments.forEach((seg) => {
      if (seg.type === "blank") {
        lines[lines.length - 1].push(seg);
      } else {
        const parts = (seg.content || "").split("\n");
        parts.forEach((part, idx) => {
          if (idx > 0) {
            lines.push([]);
          }
          if (part) {
            lines[lines.length - 1].push({ type: "text", content: part });
          }
        });
      }
    });

    return lines;
  }, [currentPoem]);

  // Determine current states
  const isFilled = (idx: number) => userAnswers[idx] !== undefined;
  const isCorrect = (idx: number) => {
    if (!currentPoem) return false;
    return userAnswers[idx] === currentPoem.blanks[idx].word;
  };

  // Checks if there are any errors in the current filled answers (only if checked)
  const hasErrors = useMemo(() => {
    if (!hasChecked) return false;
    return Object.keys(userAnswers).some((key) => {
      const idx = parseInt(key, 10);
      return !isCorrect(idx);
    });
  }, [userAnswers, currentPoem, hasChecked]);

  // Checks if the poem is fully completed and all answers are correct (only if checked)
  const isSolved = useMemo(() => {
    if (!currentPoem || !hasChecked) return false;
    const allFilled = currentPoem.blanks.every((_, idx) => isFilled(idx));
    return allFilled && !hasErrors;
  }, [currentPoem, userAnswers, hasErrors, hasChecked]);

  // Checks if all blanks are filled, enabling the check button
  const allBlanksFilled = useMemo(() => {
    if (!currentPoem) return false;
    return currentPoem.blanks.every((_, idx) => isFilled(idx));
  }, [currentPoem, userAnswers]);

  const handleSelectOption = (option: string) => {
    if (activeBlankIndex === null || !currentPoem) return;

    setUserAnswers((prev) => ({
      ...prev,
      [activeBlankIndex]: option,
    }));
    setHasChecked(false); // Reset check state on edit

    // Find the next empty blank index to auto-focus
    const nextEmptyIdx = currentPoem.blanks.findIndex(
      (_, idx) => idx !== activeBlankIndex && userAnswers[idx] === undefined
    );

    if (nextEmptyIdx !== -1) {
      setActiveBlankIndex(nextEmptyIdx);
    } else {
      setActiveBlankIndex(null);
    }
  };

  const handleNextPoem = () => {
    if (!currentTopic || !isSolved) return;
    if (activePoemIndex < currentTopic.poems.length - 1) {
      setActivePoemIndex((prev) => prev + 1);
    } else {
      // Loop back to the first poem of the current topic
      setActivePoemIndex(0);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-branding-brown"></div>
      </div>
    );
  }

  if (!currentTopic || !currentPoem) {
    return (
      <div className="text-center py-20 text-branding-black/60">
        No learning data available.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10 max-w-5xl w-full mx-auto">
      {/* Title section */}
      <section className="scroll-mt-32">
        <p className="text-[15px] md:text-base text-branding-black/70 font-light leading-relaxed max-w-3xl">
          {t("intro")}
        </p>
      </section>

      {/* Topic selector */}
      <div className="relative w-full md:w-80">
        <label className="block text-xs font-bold uppercase tracking-wider text-branding-brown mb-2">
          {t("topic_label")}
        </label>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full border border-branding-brown/20 bg-white hover:border-branding-brown/50 text-branding-black px-4 py-3 rounded-2xl flex items-center justify-between shadow-sm cursor-pointer transition-all duration-200"
        >
          <span className="font-semibold text-sm">
            {getTopicLabel(currentTopic.topic)}
          </span>
          <ChevronDown className={`h-4 w-4 text-branding-brown transition-transform duration-200 ${isDropdownOpen ? "transform rotate-180" : ""}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute z-10 mt-2 w-full bg-white border border-branding-brown/15 rounded-2xl shadow-lg py-2 animate-fadeIn">
            {data.map((topicData, idx) => (
              <button
                key={topicData.topic}
                onClick={() => {
                  setActiveTopicIndex(idx);
                  setActivePoemIndex(0);
                  setIsDropdownOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-branding-gray transition-colors cursor-pointer ${
                  idx === activeTopicIndex ? "text-branding-brown font-bold" : "text-branding-black"
                }`}
              >
                {getTopicLabel(topicData.topic)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Game Card */}
      <div className="bg-white p-6 md:p-10 rounded-3xl border border-branding-brown/10 shadow-md flex flex-col min-h-[450px] relative overflow-hidden transition-all duration-300">
        {/* Topic Badge */}
        <div>
          <span className="inline-block text-[11px] font-bold uppercase tracking-widest bg-branding-black text-white px-3 py-1.5 rounded-full mb-6">
            {getTopicLabel(currentTopic.topic)}
          </span>
        </div>

        {/* Lời dẫn / Introduction */}
        <div className="mb-8">
          <h3 className={`${merriweather.className} text-xl md:text-2xl text-branding-black font-bold mb-3 leading-snug`}>
            {t("instruction_heading")}
          </h3>
          <p className="text-[15px] md:text-base text-branding-black/80 font-light leading-relaxed">
            {currentPoem.introduction}
          </p>
        </div>

        {/* Poem Area */}
        <div className="flex flex-col items-center justify-center py-6 md:py-8 px-4 bg-branding-gray/30 rounded-2xl border border-branding-brown/5 mb-8 w-full">
          <div className={`${merriweather.className} text-base md:text-lg text-branding-black text-center space-y-4 md:space-y-6 w-full`}>
            {poemLines.map((line, lineIdx) => (
              <div key={lineIdx} className="flex flex-wrap items-center justify-center gap-x-2 gap-y-3 leading-relaxed">
                {line.map((seg, segIdx) => {
                  if (seg.type === "text") {
                    return <span key={segIdx}>{seg.content}</span>;
                  }

                  const idx = seg.index!;
                  const selectedWord = userAnswers[idx];
                  const active = idx === activeBlankIndex;
                  const filled = selectedWord !== undefined;
                  const correct = isCorrect(idx);

                  let blankStyle = "border-2 border-dashed border-branding-black/25 bg-branding-gray/50 text-branding-black/40 text-xs md:text-sm font-medium hover:bg-branding-gray/80 hover:border-branding-black/40";
                  
                  if (active) {
                    blankStyle = "border-2 border-dashed border-branding-brown bg-branding-brown/5 text-branding-brown font-semibold shadow-sm ring-2 ring-branding-brown/10";
                  } else if (filled) {
                    if (hasChecked) {
                      blankStyle = correct
                        ? "border-2 border-emerald-600 bg-emerald-50 text-emerald-700 font-bold shadow-sm"
                        : "border-2 border-red-600 bg-red-50 text-red-700 font-bold shadow-sm";
                    } else {
                      // Neutral filled style before checking
                      blankStyle = "border-2 border-solid border-branding-brown/40 bg-branding-gray/80 text-branding-black font-semibold shadow-sm";
                    }
                  }

                  return (
                    <button
                      key={segIdx}
                      onClick={() => {
                        setActiveBlankIndex(idx);
                        setHasChecked(false); // Reset check state when editing a blank
                      }}
                      className={`inline-flex items-center justify-center px-3 py-1 min-w-[110px] h-[32px] rounded-lg transition-all duration-200 cursor-pointer align-middle text-xs md:text-sm ${blankStyle}`}
                    >
                      {filled ? selectedWord : "\u00a0"}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Action Banners & Option selectors */}
        <div className="flex flex-col gap-6 mt-auto">
          {/* Error Banner */}
          {hasErrors && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 text-red-700 text-sm md:text-[15px] font-medium leading-normal animate-fadeIn">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <span>{t("error_message")}</span>
            </div>
          )}

          {/* Success Banner */}
          {isSolved && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 text-emerald-800 text-sm md:text-[15px] font-medium leading-normal animate-fadeIn">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <span>{t("success_message")}</span>
            </div>
          )}

          {/* Option Selector Cards (Shown only when a blank is active/focused) */}
          {activeBlankIndex !== null && currentPoem.blanks[activeBlankIndex] && (
            <div className="bg-branding-gray/50 border border-branding-brown/10 rounded-2xl p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-branding-brown/80 mb-3 text-center">
                {locale === "en" ? "CHOOSE A WORD FOR THIS BLANK" : "CHỌN TỪ THÍCH HỢP"}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {currentPoem.blanks[activeBlankIndex].options.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleSelectOption(option)}
                    className="border border-branding-brown/20 bg-white hover:bg-branding-brown/5 hover:border-branding-brown text-branding-black px-6 py-3 rounded-xl shadow-sm text-sm font-semibold transition-all hover:scale-105 active:scale-95 duration-150 cursor-pointer text-center min-w-[120px]"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Lời bình / Interpretation section (Revealed on solve) */}
          {isSolved && (
            <div className="border-t border-branding-brown/10 pt-6 animate-fadeIn">
              <h4 className={`${merriweather.className} text-lg md:text-xl text-branding-black font-bold mb-3`}>
                {t("poem_interpretation_heading")}
              </h4>
              <p className="text-[15px] md:text-base text-branding-black/80 font-light leading-relaxed italic">
                {currentPoem.interpretation}
              </p>
            </div>
          )}

          {/* Action Button Container */}
          <div className="flex justify-end items-center gap-4 mt-4">
            {!isSolved ? (
              <button
                onClick={() => setHasChecked(true)}
                disabled={!allBlanksFilled}
                className="inline-flex items-center gap-2 px-6 py-3 bg-branding-brown text-white hover:bg-branding-brown/90 font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-sm uppercase tracking-wider shadow-sm"
              >
                {t("check_button")}
              </button>
            ) : (
              <button
                onClick={handleNextPoem}
                className="inline-flex items-center gap-2 px-6 py-3 bg-branding-black text-white hover:bg-branding-black/90 font-bold rounded-lg transition-colors cursor-pointer text-sm uppercase tracking-wider shadow-sm"
              >
                {t("next_button")}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
