import localFont from "next/font/local";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import type { Quiz } from "./types";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";

const NomNaTong = localFont({
  src: "../../../../../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
});

type QuizCardProps = {
  locale: string;
  quiz: Quiz;
  currentQuizIndex: number;
  totalQuizzes: number;
  onAnswerChange: (value: string) => void;
  onSubmitAnswer: () => void;
  onNextQuiz: () => void;
};

export default function QuizCard({
  locale,
  quiz,
  currentQuizIndex,
  totalQuizzes,
  onAnswerChange,
  onSubmitAnswer,
  onNextQuiz,
}: QuizCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {quiz.type === "full-sentence"
            ? locale === "vi"
              ? "Dịch cả câu"
              : "Translate the full sentence"
            : locale === "vi"
            ? "Điền từ còn thiếu"
            : "Fill in the missing word"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Show regular text before answering, lookupable text after entering answer */}
        {quiz.userAnswer.trim() ? (
          <div className="mb-6 text-center">
            <LookupableHanNomText text={quiz.hanNomText} className="text-3xl" />
          </div>
        ) : (
          <div className={`text-3xl mb-6 text-center ${NomNaTong.className}`}>
            {quiz.hanNomText}
          </div>
        )}

        {quiz.type === "fill-in-blank" && (
          <div className="mb-4 text-lg text-center text-gray-700">
            {quiz.displayText}
          </div>
        )}

        {!quiz.isAnswered ? (
          <div className="space-y-4">
            <Input
              type="text"
              placeholder={
                locale === "vi"
                  ? quiz.type === "full-sentence"
                    ? "Nhập câu dịch..."
                    : "Nhập từ còn thiếu..."
                  : quiz.type === "full-sentence"
                  ? "Enter translation..."
                  : "Enter missing word..."
              }
              value={quiz.userAnswer}
              onChange={(e) => onAnswerChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && quiz.userAnswer.trim()) {
                  onSubmitAnswer();
                }
              }}
              className="text-lg"
              autoFocus
            />
            <Button
              onClick={onSubmitAnswer}
              className="w-full"
              size="lg"
              disabled={!quiz.userAnswer.trim()}
            >
              {locale === "vi" ? "Kiểm tra" : "Check Answer"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-lg ${
                quiz.isCorrect
                  ? "bg-green-50 border-2 border-green-500"
                  : "bg-red-50 border-2 border-red-500"
              }`}
            >
              <div className="flex items-center mb-2">
                {quiz.isCorrect ? (
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

              {!quiz.isCorrect && (
                <>
                  <div className="mb-2">
                    <span className="font-semibold">
                      {locale === "vi" ? "Bạn trả lời:" : "Your answer:"}
                    </span>{" "}
                    {quiz.userAnswer}
                  </div>
                  <div>
                    <span className="font-semibold">
                      {locale === "vi" ? "Đáp án đúng:" : "Correct answer:"}
                    </span>{" "}
                    {quiz.correctAnswer}
                  </div>
                </>
              )}
            </div>

            <Button onClick={onNextQuiz} className="w-full" size="lg">
              {currentQuizIndex < totalQuizzes - 1
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
  );
}
