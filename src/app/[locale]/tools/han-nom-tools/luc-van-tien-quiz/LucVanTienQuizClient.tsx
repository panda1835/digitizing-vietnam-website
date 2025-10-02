"use client";

import { useState, useEffect } from "react";
import localFont from "next/font/local";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, RefreshCw, ArrowRight } from "lucide-react";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

type QuizType = "full-sentence" | "fill-in-blank";

type Quiz = {
  id: number;
  type: QuizType;
  hanNomText: string;
  correctAnswer: string;
  userAnswer: string;
  isAnswered: boolean;
  isCorrect: boolean | null;
  hiddenWord?: string;
  displayText?: string;
};

// Sample data from first page - in production, this would come from API
const sampleLines = [
  {
    hanNom: "畧畑䀡傳西銘",
    quocNgu: "Trước đèn xem chuyện Tây Minh",
  },
  {
    hanNom: "𡄎唭𠄩𡦂人情喓𠻗",
    quocNgu: "Ngẫm cười hai chữ nhân tình éo le",
  },
  {
    hanNom: "埃匕𠳺匕麻𦖑",
    quocNgu: "Ai ai lẳng lặng mà nghe",
  },
  {
    hanNom: "𡨺噒役畧苓𠽮身𡢐",
    quocNgu: "Dữ răn việc trước, lành dè thân sau",
  },
  {
    hanNom: "𤳆辰忠孝𫜵頭",
    quocNgu: "Trai thời trung hiếu làm đầu",
  },
  {
    hanNom: "𡛔辰節行𱺵句捞𨉓",
    quocNgu: "Gái thời tiết hạnh là câu trau mình",
  },
  {
    hanNom: "固𠊛扵郡東城",
    quocNgu: "Có người ở quận Đông Thành",
  },
  {
    hanNom: "修仁積𱐩𱢭生昆䝨",
    quocNgu: "Tu nhân tích đức sớm sinh con hiền",
  },
  {
    hanNom: "達𠸜𱺵陸雲仙",
    quocNgu: "Đặt tên là Lục Vân Tiên",
  },
  {
    hanNom: "歲𣃣𠄩糁芸專斈行",
    quocNgu: "Tuổi vừa hai tám, nghề chuyên học hành",
  },
  {
    hanNom: "蹺柴𤍇史𥸷經",
    quocNgu: "Theo thầy nấu sử sôi kinh",
  },
  {
    hanNom: "𣎃㝵包𬋩功程劳刀",
    quocNgu: "Tháng ngày bao quản công trình lao đao",
  },
  {
    hanNom: "文它起鳳滕雲",
    quocNgu: "Văn đà khởi phụng đằng vân",
  },
  {
    hanNom: "武添叁畧六韜埃皮",
    quocNgu: "Võ thêm tam lược lục thao ai bì",
  },
];

function generateQuizzes(count: number = 10): Quiz[] {
  const quizzes: Quiz[] = [];
  const usedIndices = new Set<number>();

  // Generate quizzes ensuring we have a mix
  for (let i = 0; i < count; i++) {
    let randomIndex: number;
    do {
      randomIndex = Math.floor(Math.random() * sampleLines.length);
    } while (usedIndices.has(randomIndex));
    usedIndices.add(randomIndex);

    const line = sampleLines[randomIndex];
    const quizType: QuizType = i % 2 === 0 ? "full-sentence" : "fill-in-blank";

    if (quizType === "full-sentence") {
      quizzes.push({
        id: i,
        type: "full-sentence",
        hanNomText: line.hanNom,
        correctAnswer: line.quocNgu,
        userAnswer: "",
        isAnswered: false,
        isCorrect: null,
      });
    } else {
      // For fill-in-blank, hide a random word
      const words = line.quocNgu.split(" ");
      if (words.length > 1) {
        const wordIndex = Math.floor(Math.random() * words.length);
        const hiddenWord = words[wordIndex];
        const displayText = words
          .map((w, idx) => (idx === wordIndex ? "______" : w))
          .join(" ");

        quizzes.push({
          id: i,
          type: "fill-in-blank",
          hanNomText: line.hanNom,
          correctAnswer: hiddenWord,
          userAnswer: "",
          isAnswered: false,
          isCorrect: null,
          hiddenWord: hiddenWord,
          displayText: displayText,
        });
      } else {
        // If only one word, make it full sentence instead
        quizzes.push({
          id: i,
          type: "full-sentence",
          hanNomText: line.hanNom,
          correctAnswer: line.quocNgu,
          userAnswer: "",
          isAnswered: false,
          isCorrect: null,
        });
      }
    }
  }

  return quizzes;
}

function normalizeText(text: string): string {
  // Remove extra whitespace, normalize punctuation
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[,.\t]/g, "");
}

export default function LucVanTienQuizClient({ locale }: { locale: string }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    setQuizzes(generateQuizzes(10));
  }, []);

  const currentQuiz = quizzes[currentQuizIndex];

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
    setQuizzes(generateQuizzes(10));
    setCurrentQuizIndex(0);
    setScore(0);
    setShowResults(false);
  };

  if (quizzes.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">
          {locale === "vi" ? "Đang tải..." : "Loading..."}
        </div>
      </div>
    );
  }

  if (showResults) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            {locale === "vi" ? "Kết Quả" : "Results"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className="text-4xl font-bold mb-2">
              {score} / {quizzes.length}
            </div>
            <div className="text-xl text-gray-600">
              {Math.round((score / quizzes.length) * 100)}%{" "}
              {locale === "vi" ? "chính xác" : "correct"}
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {quizzes.map((quiz, index) => (
              <div
                key={quiz.id}
                className={`p-4 rounded-lg border-2 ${
                  quiz.isCorrect
                    ? "border-green-500 bg-green-50"
                    : "border-red-500 bg-red-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className={`text-2xl mb-2 ${NomNaTong.className}`}>
                      {quiz.hanNomText}
                    </div>
                    {quiz.type === "fill-in-blank" && (
                      <div className="text-sm text-gray-600 mb-1">
                        {quiz.displayText}
                      </div>
                    )}
                    <div className="text-sm">
                      <span className="font-semibold">
                        {locale === "vi" ? "Đáp án đúng:" : "Correct answer:"}
                      </span>{" "}
                      {quiz.correctAnswer}
                    </div>
                    {!quiz.isCorrect && (
                      <div className="text-sm text-red-600">
                        <span className="font-semibold">
                          {locale === "vi" ? "Bạn trả lời:" : "Your answer:"}
                        </span>{" "}
                        {quiz.userAnswer || "(không có)"}
                      </div>
                    )}
                  </div>
                  <div>
                    {quiz.isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handleRestart} className="w-full" size="lg">
            <RefreshCw className="w-4 h-4 mr-2" />
            {locale === "vi" ? "Làm lại" : "Try Again"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {locale === "vi" ? "Câu hỏi" : "Question"} {currentQuizIndex + 1} /{" "}
          {quizzes.length}
        </div>
        <div className="text-sm text-gray-600">
          {locale === "vi" ? "Điểm:" : "Score:"} {score}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {currentQuiz.type === "full-sentence"
              ? locale === "vi"
                ? "Dịch cả câu"
                : "Translate the full sentence"
              : locale === "vi"
              ? "Điền từ còn thiếu"
              : "Fill in the missing word"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl mb-6 text-center ${NomNaTong.className}`}>
            {currentQuiz.hanNomText}
          </div>

          {currentQuiz.type === "fill-in-blank" && (
            <div className="mb-4 text-lg text-center text-gray-700">
              {currentQuiz.displayText}
            </div>
          )}

          {!currentQuiz.isAnswered ? (
            <div className="space-y-4">
              <Input
                type="text"
                placeholder={
                  locale === "vi"
                    ? currentQuiz.type === "full-sentence"
                      ? "Nhập câu dịch..."
                      : "Nhập từ còn thiếu..."
                    : currentQuiz.type === "full-sentence"
                    ? "Enter translation..."
                    : "Enter missing word..."
                }
                value={currentQuiz.userAnswer}
                onChange={(e) => handleAnswerChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && currentQuiz.userAnswer.trim()) {
                    handleSubmitAnswer();
                  }
                }}
                className="text-lg"
                autoFocus
              />
              <Button
                onClick={handleSubmitAnswer}
                className="w-full"
                size="lg"
                disabled={!currentQuiz.userAnswer.trim()}
              >
                {locale === "vi" ? "Kiểm tra" : "Check Answer"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className={`p-4 rounded-lg ${
                  currentQuiz.isCorrect
                    ? "bg-green-50 border-2 border-green-500"
                    : "bg-red-50 border-2 border-red-500"
                }`}
              >
                <div className="flex items-center mb-2">
                  {currentQuiz.isCorrect ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-green-600 mr-2" />
                      <span className="text-green-700 font-semibold">
                        {locale === "vi" ? "Chính xác!" : "Correct!"}
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-600 mr-2" />
                      <span className="text-red-700 font-semibold">
                        {locale === "vi" ? "Không chính xác" : "Incorrect"}
                      </span>
                    </>
                  )}
                </div>

                {!currentQuiz.isCorrect && (
                  <>
                    <div className="mb-2">
                      <span className="font-semibold">
                        {locale === "vi" ? "Bạn trả lời:" : "Your answer:"}
                      </span>{" "}
                      {currentQuiz.userAnswer}
                    </div>
                    <div>
                      <span className="font-semibold">
                        {locale === "vi" ? "Đáp án đúng:" : "Correct answer:"}
                      </span>{" "}
                      {currentQuiz.correctAnswer}
                    </div>
                  </>
                )}
              </div>

              <Button onClick={handleNextQuiz} className="w-full" size="lg">
                {currentQuizIndex < quizzes.length - 1
                  ? locale === "vi"
                    ? "Câu tiếp theo"
                    : "Next Question"
                  : locale === "vi"
                  ? "Xem kết quả"
                  : "View Results"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

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
  );
}
