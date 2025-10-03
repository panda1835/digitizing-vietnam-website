import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RefreshCw, BookOpen, ExternalLink, Eye, EyeOff } from "lucide-react";
import type { BookType } from "./types";

type QuizHeaderProps = {
  locale: string;
  currentQuizIndex: number;
  totalQuizzes: number;
  score: number;
  selectedBook: BookType;
  selectedPage: number;
  selectedPoem: string;
  showPageImage: boolean;
  onTogglePageImage: () => void;
  onRestart: () => void;
  currentQuizPageNumber: number;
  currentQuizLineNumber: number;
  currentQuizPoemTitle?: string;
  currentQuizPoemId?: number;
};

export default function QuizHeader({
  locale,
  currentQuizIndex,
  totalQuizzes,
  score,
  selectedBook,
  selectedPage,
  selectedPoem,
  showPageImage,
  onTogglePageImage,
  onRestart,
  currentQuizPageNumber,
  currentQuizLineNumber,
  currentQuizPoemTitle,
  currentQuizPoemId,
}: QuizHeaderProps) {
  return (
    <>
      {/* Header with stats and controls */}
      <div className="mb-4 flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            {locale === "vi" ? "Câu hỏi" : "Question"} {currentQuizIndex + 1} /{" "}
            {totalQuizzes}
          </div>
          <div className="text-sm text-gray-600">
            {locale === "vi" ? "Điểm:" : "Score:"} {score}
          </div>
          <div className="text-sm text-gray-600">
            {selectedBook === "luc-van-tien"
              ? locale === "vi"
                ? `Trang ${selectedPage}`
                : `Page ${selectedPage}`
              : selectedBook === "ho-xuan-huong"
              ? selectedPoem
              : currentQuizPoemTitle}
          </div>
        </div>
        <div className="flex gap-2">
          {selectedBook === "luc-van-tien" && (
            <Button variant="outline" size="sm" onClick={onTogglePageImage}>
              {showPageImage ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  {locale === "vi" ? "Ẩn trang" : "Hide Page"}
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  {locale === "vi" ? "Hiện trang" : "Show Page"}
                </>
              )}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onRestart}>
            <RefreshCw className="w-4 h-4 mr-2" />
            {locale === "vi" ? "Bắt đầu lại" : "Restart"}
          </Button>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mb-4 flex gap-4 text-sm">
        <Link
          href={`/${locale}/tools/han-nom-dictionaries`}
          className="flex items-center gap-1 text-blue-600 hover:underline"
          target="_blank"
        >
          <BookOpen className="w-4 h-4" />
          {locale === "vi" ? "Từ điển" : "Dictionary"}
          <ExternalLink className="w-3 h-3" />
        </Link>
        {selectedBook === "luc-van-tien" ? (
          <Link
            href={`/${locale}/our-collections/luc-van-tien/van-tien-co-tich-tan-truyen?page=${currentQuizPageNumber}&line=${currentQuizLineNumber}`}
            className="flex items-center gap-1 text-blue-600 hover:underline"
            target="_blank"
          >
            <BookOpen className="w-4 h-4" />
            {locale === "vi" ? "Xem trong bản thảo" : "View in manuscript"}
            <ExternalLink className="w-3 h-3" />
          </Link>
        ) : selectedBook === "ho-xuan-huong" ? (
          <Link
            href={`/${locale}/our-collections/tho-ho-xuan-huong/tinh-hoa-mua-xuan?topic=${encodeURIComponent(
              currentQuizPoemTitle || selectedPoem
            )}&line=${currentQuizLineNumber}`}
            className="flex items-center gap-1 text-blue-600 hover:underline"
            target="_blank"
          >
            <BookOpen className="w-4 h-4" />
            {locale === "vi" ? "Xem bài thơ" : "View poem"}
            <ExternalLink className="w-3 h-3" />
          </Link>
        ) : (
          <Link
            href={`/${locale}/our-collections/quoc-am-thi-tap/nguyen-trai-quoc-am-thi-tap?topic=${
              currentQuizPoemId || ""
            }&line=${currentQuizLineNumber}`}
            className="flex items-center gap-1 text-blue-600 hover:underline"
            target="_blank"
          >
            <BookOpen className="w-4 h-4" />
            {locale === "vi" ? "Xem bài thơ" : "View poem"}
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>
    </>
  );
}
