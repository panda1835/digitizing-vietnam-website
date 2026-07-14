"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  summary?: string;
  poems: Poem[];
}

interface Segment {
  type: "text" | "blank";
  content?: string;
  index?: number;
  expected?: string;
  options?: string[];
}

interface HocCaDaoContentProps {
  locale: string;
  initialData?: TopicData[];
}

export function HocCaDaoContent({ locale, initialData }: HocCaDaoContentProps) {
  const t = useTranslations("Tools.ca-dao-tuc-ngu.hoc-ca-dao");

  // Game data state
  const [data, setData] = useState<TopicData[]>(initialData || []);
  const [loading, setLoading] = useState(!initialData || initialData.length === 0);

  // Selector states
  const [activeTopicIndex, setActiveTopicIndex] = useState(0);
  const [activePoemIndex, setActivePoemIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isUrlRead, setIsUrlRead] = useState(false);

  // Game play states
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [activeBlankIndex, setActiveBlankIndex] = useState<number | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [topicCompleted, setTopicCompleted] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(true);

  // Focus and refs for blanks
  const blankRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  // Fetch learning data
  useEffect(() => {
    if (initialData && initialData.length > 0) {
      // Read URL search params on initial load
      const params = new URLSearchParams(window.location.search);
      const topicParam = params.get("topic");
      const poemParam = params.get("poem");

      let initTopicIdx = 0;
      let initPoemIdx = 0;

      if (topicParam !== null) {
        const tIdx = parseInt(topicParam, 10);
        if (!isNaN(tIdx) && tIdx >= 0 && tIdx < initialData.length) {
          initTopicIdx = tIdx;
          if (poemParam !== null) {
            const pIdx = parseInt(poemParam, 10);
            if (!isNaN(pIdx) && pIdx >= 0 && pIdx < initialData[tIdx].poems.length) {
              initPoemIdx = pIdx;
            }
          }
        }
      }

      setActiveTopicIndex(initTopicIdx);
      setActivePoemIndex(initPoemIdx);
      setIsUrlRead(true);
      setLoading(false);
      return;
    }

    fetch("/data/ca-dao-tuc-ngu/learning-data.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load data");
        return res.json();
      })
      .then((json) => {
        setData(json);

        // Read URL search params on initial load
        const params = new URLSearchParams(window.location.search);
        const topicParam = params.get("topic");
        const poemParam = params.get("poem");

        let initTopicIdx = 0;
        let initPoemIdx = 0;

        if (topicParam !== null) {
          const tIdx = parseInt(topicParam, 10);
          if (!isNaN(tIdx) && tIdx >= 0 && tIdx < json.length) {
            initTopicIdx = tIdx;
            if (poemParam !== null) {
              const pIdx = parseInt(poemParam, 10);
              if (!isNaN(pIdx) && pIdx >= 0 && pIdx < json[tIdx].poems.length) {
                initPoemIdx = pIdx;
              }
            }
          }
        }

        setActiveTopicIndex(initTopicIdx);
        setActivePoemIndex(initPoemIdx);
        setIsUrlRead(true);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading learning data:", err);
        setLoading(false);
      });
  }, [initialData]);

  // Programmatic focus management for accessibility
  const isInitialMount = useRef(true);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (activeBlankIndex !== null) {
      const button = blankRefs.current[activeBlankIndex];
      if (button) {
        if (isInitialMount.current) {
          isInitialMount.current = false;
        } else {
          button.focus();
        }
      }
    }
  }, [activeBlankIndex]);

  // Sync state changes back to URL without reloading page
  useEffect(() => {
    if (loading || data.length === 0 || !isUrlRead) return;

    const params = new URLSearchParams(window.location.search);
    const currentTopicParam = params.get("topic");
    const currentPoemParam = params.get("poem");

    const topicStr = activeTopicIndex.toString();
    const poemStr = activePoemIndex.toString();

    if (currentTopicParam !== topicStr || currentPoemParam !== poemStr) {
      params.set("topic", topicStr);
      params.set("poem", poemStr);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.pushState(null, "", newUrl);
    }
  }, [activeTopicIndex, activePoemIndex, loading, data]);

  // Listen to browser navigation (back/forward)
  useEffect(() => {
    if (data.length === 0) return;

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const topicParam = params.get("topic");
      const poemParam = params.get("poem");

      if (topicParam !== null) {
        const tIdx = parseInt(topicParam, 10);
        if (!isNaN(tIdx) && tIdx >= 0 && tIdx < data.length) {
          setActiveTopicIndex(tIdx);
          const pIdx = parseInt(poemParam || "0", 10);
          if (!isNaN(pIdx) && pIdx >= 0 && pIdx < data[tIdx].poems.length) {
            setActivePoemIndex(pIdx);
          }
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [data]);

  // Current active topic & poem
  const currentTopic = data[activeTopicIndex];
  const currentPoem = currentTopic?.poems[activePoemIndex];

  const totalPoems = currentTopic?.poems.length || 0;
  const currentPoemNum = activePoemIndex + 1;
  const poemsLeft = totalPoems - currentPoemNum;
  const progressPercent = topicCompleted ? 100 : (totalPoems > 0 ? (currentPoemNum / totalPoems) * 100 : 0);

  // Reset answers when changing topic or poem
  useEffect(() => {
    setUserAnswers({});
    setActiveBlankIndex(null);
    setHasChecked(false);
  }, [activeTopicIndex, activePoemIndex]);

  // Reset topic completed state when changing topic
  useEffect(() => {
    setTopicCompleted(false);
  }, [activeTopicIndex]);

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
  const hasErrors = hasChecked && Object.keys(userAnswers).some((key) => {
    const idx = parseInt(key, 10);
    return !isCorrect(idx);
  });

  // Checks if the poem is fully completed and all answers are correct (only if checked)
  const isSolved = !!(currentPoem && hasChecked && 
    currentPoem.blanks.every((_, idx) => isFilled(idx)) && !hasErrors);

  // Checks if all blanks are filled, enabling the check button
  const allBlanksFilled = !!(currentPoem && 
    currentPoem.blanks.every((_, idx) => isFilled(idx)));

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
      setTopicCompleted(true);
    }
    setTimeout(() => {
      progressBarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const handleRestartTopic = () => {
    setActivePoemIndex(0);
    setTopicCompleted(false);
    setTimeout(() => {
      progressBarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
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
      {/* Instructions section (Collapsible Accordion) */}
      <section className="scroll-mt-32 w-full animate-fadeIn">
        <div className="bg-white border border-branding-brown/15 rounded-2xl shadow-sm overflow-hidden">
          <button
            onClick={() => setIsGuideOpen(!isGuideOpen)}
            className="w-full flex items-center justify-between p-5 md:p-6 text-left cursor-pointer hover:bg-branding-gray/20 transition-all duration-200"
          >
            <span className="text-base md:text-lg font-bold text-branding-brown uppercase tracking-wider">
              {t("instruction_guide_title")}
            </span>
            <ChevronDown 
              className={`h-5 w-5 text-branding-brown transition-transform duration-200 ${
                isGuideOpen ? "transform rotate-180" : ""
              }`} 
            />
          </button>
          
          {isGuideOpen && (
            <div className="border-t border-branding-brown/10 p-5 md:p-6 bg-white animate-fadeIn">
              <p 
                className="text-[15px] md:text-base text-branding-black font-normal leading-relaxed max-w-3xl"
                dangerouslySetInnerHTML={{ __html: t.raw("intro") }}
              />
            </div>
          )}
        </div>
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

      {/* Progress Bar */}
      <div ref={progressBarRef} className="w-full flex flex-col gap-2 scroll-mt-10">
        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-branding-brown">
          <span>
            {topicCompleted
              ? (locale === "en" ? "Topic Completed" : "Đã hoàn thành chủ đề")
              : t("progress_label", { current: currentPoemNum, total: totalPoems, left: poemsLeft })}
          </span>
          <span>
            {Math.round(progressPercent)}%
          </span>
        </div>
        <div className="w-full bg-branding-gray border border-branding-brown/15 rounded-full h-3.5 overflow-hidden shadow-inner p-[2px]">
          <div 
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-branding-brown rounded-full transition-all duration-500 ease-out shadow-sm"
          />
        </div>
      </div>

      {/* Main Game Card or Completion Card */}
      {topicCompleted ? (
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-branding-brown/10 shadow-md flex flex-col items-center text-center min-h-[450px] justify-center animate-fadeIn">
          {/* Celebration Icon */}
          <div className="w-16 h-16 bg-branding-brown/10 text-branding-brown rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div>
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest bg-branding-black text-white px-3 py-1.5 rounded-full mb-4">
              {getTopicLabel(currentTopic.topic)}
            </span>
          </div>

          <h3 className={`${merriweather.className} text-2xl md:text-3xl text-branding-black font-bold mb-6`}>
            {locale === "en" ? "Topic Completed!" : "Hoàn thành chủ đề!"}
          </h3>

          {currentTopic.summary && (
            <div className="max-w-2xl bg-branding-gray/30 border border-branding-brown/10 border-l-4 border-l-branding-brown p-6 rounded-r-2xl rounded-l-md text-left mb-8">
              <h4 className="text-xs font-bold uppercase tracking-wider text-branding-brown mb-2">
                {t("summary_heading")}
              </h4>
              <p className="text-[15px] md:text-base text-branding-black/85 font-light leading-relaxed">
                {currentTopic.summary}
              </p>
            </div>
          )}

          <button
            onClick={handleRestartTopic}
            className="inline-flex items-center gap-2 px-6 py-3 bg-branding-brown text-white hover:bg-branding-brown/90 font-bold rounded-lg transition-colors cursor-pointer text-sm uppercase tracking-wider shadow-sm"
          >
            {locale === "en" ? "Review Topic" : "Học lại từ đầu"}
          </button>
        </div>
      ) : (
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
                        ref={(el) => {
                          blankRefs.current[idx] = el;
                        }}
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
      )}
    </div>
  );
}
