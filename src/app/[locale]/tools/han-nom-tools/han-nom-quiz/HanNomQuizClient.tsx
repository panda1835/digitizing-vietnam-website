"use client";

import { useState, useEffect } from "react";
import QuizSetup from "./QuizSetup";
import QuizResults from "./QuizResults";
import QuizHeader from "./QuizHeader";
import QuizCard from "./QuizCard";
import PageImage from "./PageImage";
import { generateQuizzes, normalizeText } from "./utils";
import type {
  Quiz,
  LineData,
  PageData,
  BookType,
  LucVanTienPageData,
  HoXuanHuongPoemData,
  NguyenTraiPoemData,
} from "./types";
import {
  fetchLucVanTienData,
  fetchHoXuanHuongData,
  fetchAvailableHoXuanHuongPoems,
  fetchNguyenTraiData,
  fetchAvailableNguyenTraiPoems,
} from "./actions";

export default function HanNomQuizClient({ locale }: { locale: string }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPageImage, setShowPageImage] = useState(true);

  // Book selection
  const [selectedBook, setSelectedBook] = useState<BookType>("luc-van-tien");

  // Luc Van Tien specific
  const [selectedPage, setSelectedPage] = useState<number>(1);
  const [totalPages] = useState<number>(104);

  // Ho Xuan Huong specific
  const [selectedPoem, setSelectedPoem] = useState<string>("");
  const [availablePoems, setAvailablePoems] = useState<string[]>([]);

  // Nguyen Trai specific
  const [selectedNguyenTraiPoem, setSelectedNguyenTraiPoem] =
    useState<string>("");
  const [availableNguyenTraiPoems, setAvailableNguyenTraiPoems] = useState<
    { id: number; title: string; titleNum: number }[]
  >([]);
  const [currentNguyenTraiData, setCurrentNguyenTraiData] =
    useState<NguyenTraiPoemData | null>(null);

  const [quizCount, setQuizCount] = useState<number>(10);
  const [quizMode, setQuizMode] = useState<
    "sentences" | "missing-words" | "mixed"
  >("mixed");
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [isQuizStarted, setIsQuizStarted] = useState(false);

  const currentQuiz = quizzes[currentQuizIndex];

  // Helper function to format Nguyen Trai poem title
  const formatNguyenTraiPoemTitle = (title: string, titleNum: number) => {
    if (titleNum === 0) {
      return title;
    }
    return `${title} (Bài ${titleNum})`;
  };

  // Fetch available Ho Xuan Huong poems on mount
  useEffect(() => {
    if (selectedBook === "ho-xuan-huong") {
      loadAvailablePoems();
    } else if (selectedBook === "nguyen-trai") {
      loadAvailableNguyenTraiPoems();
    }
  }, [selectedBook]);

  const loadAvailablePoems = async () => {
    const poems = await fetchAvailableHoXuanHuongPoems();
    setAvailablePoems(poems);
    if (poems.length > 0) {
      setSelectedPoem(poems[0]);
    }
  };

  const loadAvailableNguyenTraiPoems = async () => {
    const poems = await fetchAvailableNguyenTraiPoems();
    setAvailableNguyenTraiPoems(poems);
    if (poems.length > 0) {
      setSelectedNguyenTraiPoem(poems[0].id.toString());
    }
  };

  const loadLucVanTienData = async (pageNumber: number) => {
    setIsLoading(true);
    try {
      const data = await fetchLucVanTienData(pageNumber);
      if (data) {
        setPageData(data);
      }
      return data;
    } catch (error) {
      console.error("Error fetching page data:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const loadHoXuanHuongData = async (poemTitle: string) => {
    setIsLoading(true);
    try {
      const data = await fetchHoXuanHuongData(poemTitle);
      if (data) {
        setPageData(data);
      }
      return data;
    } catch (error) {
      console.error("Error fetching poem data:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const loadNguyenTraiData = async (poemId: string) => {
    setIsLoading(true);
    try {
      const data = await fetchNguyenTraiData(poemId);
      if (data) {
        setPageData(data);
        setCurrentNguyenTraiData(data);
      }
      return data;
    } catch (error) {
      console.error("Error fetching Nguyen Trai data:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const extractLinesFromLucVanTien = (data: LucVanTienPageData): LineData[] => {
    const lines: LineData[] = [];

    if (
      data.text?.page?.div?.[0]?.lg?.[0]?.l &&
      data.text?.page?.div?.[1]?.lg?.[0]?.l
    ) {
      const hanNomLines = data.text.page.div[0].lg[0].l;
      const quocNguLines = data.text.page.div[1].lg[0].l;

      for (
        let i = 0;
        i < Math.min(hanNomLines.length, quocNguLines.length);
        i++
      ) {
        const hanNomLine = hanNomLines[i];
        const quocNguLine = quocNguLines[i];

        lines.push({
          hanNom: typeof hanNomLine === "string" ? hanNomLine : hanNomLine._,
          quocNgu:
            typeof quocNguLine === "string" ? quocNguLine : quocNguLine._,
          lineNumber: i + 1,
        });
      }
    }

    return lines;
  };

  const extractLinesFromHoXuanHuong = (
    data: HoXuanHuongPoemData
  ): LineData[] => {
    const lines: LineData[] = [];

    if (data.nom && data.qn) {
      const hanNomLines = data.nom.split("#");
      const quocNguLines = data.qn.split("#");

      for (
        let i = 0;
        i < Math.min(hanNomLines.length, quocNguLines.length);
        i++
      ) {
        if (hanNomLines[i].trim() && quocNguLines[i].trim()) {
          lines.push({
            hanNom: hanNomLines[i].trim(),
            quocNgu: quocNguLines[i].trim(),
            lineNumber: i + 1,
          });
        }
      }
    }

    return lines;
  };

  const extractLinesFromNguyenTrai = (data: NguyenTraiPoemData): LineData[] => {
    const lines: LineData[] = [];

    if (data.hn_body?.body?.lg?.[0]?.l && data.qn_body?.body?.lg?.[0]?.l) {
      const hnLines = data.hn_body.body.lg[0].l;
      const qnLines = data.qn_body.body.lg[0].l;

      for (let i = 0; i < Math.min(hnLines.length, qnLines.length); i++) {
        const hnLine = hnLines[i];
        const qnLine = qnLines[i];

        // Each line has two segments (two halves of a verse)
        if (
          hnLine.seg &&
          qnLine.seg &&
          hnLine.seg.length >= 2 &&
          qnLine.seg.length >= 2
        ) {
          // First half
          const hnText1 = hnLine.seg[0]?.split("|").join("") || "";
          const qnText1 = qnLine.seg[0]?.split("|").join(" ") || "";
          if (hnText1.trim() && qnText1.trim()) {
            lines.push({
              hanNom: hnText1.trim(),
              quocNgu: qnText1.trim(),
              lineNumber: lines.length + 1,
            });
          }

          // Second half
          const hnText2 = hnLine.seg[1]?.split("|").join("") || "";
          const qnText2 = qnLine.seg[1]?.split("|").join(" ") || "";
          if (hnText2.trim() && qnText2.trim()) {
            lines.push({
              hanNom: hnText2.trim(),
              quocNgu: qnText2.trim(),
              lineNumber: lines.length + 1,
            });
          }
        }
      }
    }

    return lines;
  };

  const startQuiz = async () => {
    setIsLoading(true);

    let data;
    let lines: LineData[] = [];

    if (selectedBook === "luc-van-tien") {
      data = await loadLucVanTienData(selectedPage);
      if (data) {
        lines = extractLinesFromLucVanTien(data as LucVanTienPageData);
      }
    } else if (selectedBook === "ho-xuan-huong") {
      data = await loadHoXuanHuongData(selectedPoem);
      if (data) {
        lines = extractLinesFromHoXuanHuong(data as HoXuanHuongPoemData);
      }
    } else if (selectedBook === "nguyen-trai") {
      data = await loadNguyenTraiData(selectedNguyenTraiPoem);
      if (data) {
        lines = extractLinesFromNguyenTrai(data as NguyenTraiPoemData);
      }
    }

    if (lines.length > 0) {
      const generatedQuizzes = generateQuizzes(lines, quizCount, quizMode);

      // Set metadata for all quizzes
      if (selectedBook === "luc-van-tien") {
        generatedQuizzes.forEach((q) => (q.pageNumber = selectedPage));
      } else if (selectedBook === "ho-xuan-huong") {
        generatedQuizzes.forEach((q) => {
          q.poemTitle = selectedPoem;
          q.pageNumber = 0; // Not applicable for poems
        });
      } else if (selectedBook === "nguyen-trai") {
        const poemInfo = availableNguyenTraiPoems.find(
          (p) => p.id.toString() === selectedNguyenTraiPoem
        );
        const poemTitle = poemInfo
          ? formatNguyenTraiPoemTitle(poemInfo.title, poemInfo.titleNum)
          : "";
        generatedQuizzes.forEach((q) => {
          q.poemTitle = poemTitle;
          q.poemId = parseInt(selectedNguyenTraiPoem);
          q.titleNum = poemInfo?.titleNum || 0;
          q.pageNumber = 0; // Not applicable for poems
        });
      }

      setQuizzes(generatedQuizzes);
      setIsQuizStarted(true);
      setCurrentQuizIndex(0);
      setScore(0);
      setShowResults(false);
    }

    setIsLoading(false);
  };

  const handleAnswerChange = (value: string) => {
    const updatedQuizzes = [...quizzes];
    updatedQuizzes[currentQuizIndex].userAnswer = value;
    setQuizzes(updatedQuizzes);
  };

  const handleSubmitAnswer = () => {
    const updatedQuizzes = [...quizzes];
    const quiz = updatedQuizzes[currentQuizIndex];

    const normalizedUserAnswer = normalizeText(quiz.userAnswer);
    const normalizedCorrectAnswer = normalizeText(quiz.correctAnswer);

    const isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;

    quiz.isAnswered = true;
    quiz.isCorrect = isCorrect;

    if (isCorrect) {
      setScore(score + 1);
    }

    setQuizzes(updatedQuizzes);
  };

  const handleNextQuiz = () => {
    if (currentQuizIndex < quizzes.length - 1) {
      setCurrentQuizIndex(currentQuizIndex + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleRestart = () => {
    setIsQuizStarted(false);
    setCurrentQuizIndex(0);
    setScore(0);
    setShowResults(false);
    setPageData(null);
  };

  // Quiz setup screen
  if (!isQuizStarted) {
    return (
      <QuizSetup
        locale={locale}
        selectedBook={selectedBook}
        setSelectedBook={setSelectedBook}
        selectedPage={selectedPage}
        setSelectedPage={setSelectedPage}
        selectedPoem={selectedPoem}
        setSelectedPoem={setSelectedPoem}
        availablePoems={availablePoems}
        selectedNguyenTraiPoem={selectedNguyenTraiPoem}
        setSelectedNguyenTraiPoem={setSelectedNguyenTraiPoem}
        availableNguyenTraiPoems={availableNguyenTraiPoems}
        quizCount={quizCount}
        setQuizCount={setQuizCount}
        quizMode={quizMode}
        setQuizMode={setQuizMode}
        totalPages={totalPages}
        isLoading={isLoading}
        onStartQuiz={startQuiz}
      />
    );
  }

  // Loading state
  if (isLoading || quizzes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">
          {locale === "vi" ? "Đang tải..." : "Loading..."}
        </div>
      </div>
    );
  }

  // Results screen
  if (showResults) {
    return (
      <QuizResults
        locale={locale}
        quizzes={quizzes}
        score={score}
        selectedBook={selectedBook}
        onRestart={handleRestart}
      />
    );
  }

  // Main quiz interface
  return (
    <div className="max-w-6xl mx-auto">
      <QuizHeader
        locale={locale}
        currentQuizIndex={currentQuizIndex}
        totalQuizzes={quizzes.length}
        score={score}
        selectedBook={selectedBook}
        selectedPage={selectedPage}
        selectedPoem={selectedPoem}
        showPageImage={showPageImage}
        onTogglePageImage={() => setShowPageImage(!showPageImage)}
        onRestart={handleRestart}
        currentQuizPageNumber={currentQuiz.pageNumber}
        currentQuizLineNumber={currentQuiz.lineNumber}
        currentQuizPoemTitle={currentQuiz.poemTitle}
        currentQuizPoemId={currentQuiz.poemId}
      />

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Page Image (if shown and applicable) */}
        {showPageImage && pageData && selectedBook === "luc-van-tien" && (
          <PageImage
            locale={locale}
            pageData={pageData as LucVanTienPageData}
            selectedPage={selectedPage}
          />
        )}

        {/* Quiz Card */}
        <div
          className={
            showPageImage && selectedBook === "luc-van-tien"
              ? "lg:w-2/3"
              : "w-full"
          }
        >
          <QuizCard
            locale={locale}
            quiz={currentQuiz}
            currentQuizIndex={currentQuizIndex}
            totalQuizzes={quizzes.length}
            onAnswerChange={handleAnswerChange}
            onSubmitAnswer={handleSubmitAnswer}
            onNextQuiz={handleNextQuiz}
          />

          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuizIndex + 1) / quizzes.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
