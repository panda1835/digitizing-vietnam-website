import Link from "next/link";
import localFont from "next/font/local";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, RefreshCw, ExternalLink } from "lucide-react";
import type { Quiz, BookType } from "./types";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

type QuizResultsProps = {
  locale: string;
  quizzes: Quiz[];
  score: number;
  selectedBook: BookType;
  onRestart: () => void;
};

export default function QuizResults({
  locale,
  quizzes,
  score,
  selectedBook,
  onRestart,
}: QuizResultsProps) {
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
          {quizzes.map((quiz) => (
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
                  <div className="mt-2">
                    {selectedBook === "luc-van-tien" ? (
                      <Link
                        href={`/${locale}/our-collections/luc-van-tien/van-tien-co-tich-tan-truyen?page=${quiz.pageNumber}&line=${quiz.lineNumber}`}
                        className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                        target="_blank"
                      >
                        {locale === "vi"
                          ? `Xem trong bản thảo (Trang ${quiz.pageNumber}, Dòng ${quiz.lineNumber})`
                          : `View in manuscript (Page ${quiz.pageNumber}, Line ${quiz.lineNumber})`}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : selectedBook === "ho-xuan-huong" ? (
                      <Link
                        href={`/${locale}/our-collections/tho-ho-xuan-huong/tinh-hoa-mua-xuan?topic=${encodeURIComponent(
                          quiz.poemTitle || ""
                        )}&line=${quiz.lineNumber}`}
                        className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                        target="_blank"
                      >
                        {locale === "vi"
                          ? `Xem bài thơ: ${quiz.poemTitle} (Dòng ${quiz.lineNumber})`
                          : `View poem: ${quiz.poemTitle} (Line ${quiz.lineNumber})`}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      <Link
                        href={`/${locale}/our-collections/quoc-am-thi-tap/nguyen-trai-quoc-am-thi-tap`}
                        className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                        target="_blank"
                      >
                        {locale === "vi"
                          ? `Xem bài thơ: ${quiz.poemTitle} (Dòng ${quiz.lineNumber})`
                          : `View poem: ${quiz.poemTitle} (Line ${quiz.lineNumber})`}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
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

        <Button onClick={onRestart} className="w-full" size="lg">
          <RefreshCw className="w-4 h-4 mr-2" />
          {locale === "vi" ? "Làm lại" : "Try Again"}
        </Button>
      </CardContent>
    </Card>
  );
}
