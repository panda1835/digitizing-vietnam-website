import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, ExternalLink } from "lucide-react";
import type { BookType, QuizMode } from "./types";

type QuizSetupProps = {
  locale: string;
  selectedBook: BookType;
  setSelectedBook: (book: BookType) => void;
  selectedPage: number;
  setSelectedPage: (page: number) => void;
  selectedPoem: string;
  setSelectedPoem: (poem: string) => void;
  availablePoems: string[];
  selectedNguyenTraiPoem: string;
  setSelectedNguyenTraiPoem: (poemId: string) => void;
  availableNguyenTraiPoems: { id: number; title: string; titleNum: number }[];
  quizCount: number;
  setQuizCount: (count: number) => void;
  quizMode: QuizMode;
  setQuizMode: (mode: QuizMode) => void;
  totalPages: number;
  isLoading: boolean;
  onStartQuiz: () => void;
};

export default function QuizSetup({
  locale,
  selectedBook,
  setSelectedBook,
  selectedPage,
  setSelectedPage,
  selectedPoem,
  setSelectedPoem,
  availablePoems,
  selectedNguyenTraiPoem,
  setSelectedNguyenTraiPoem,
  availableNguyenTraiPoems,
  quizCount,
  setQuizCount,
  quizMode,
  setQuizMode,
  totalPages,
  isLoading,
  onStartQuiz,
}: QuizSetupProps) {
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">
          {locale === "vi" ? "Cài Đặt Bài Trắc Nghiệm" : "Quiz Settings"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Book Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {locale === "vi" ? "Chọn tác phẩm:" : "Select book:"}
          </label>
          <Select
            value={selectedBook}
            onValueChange={(value: BookType) => setSelectedBook(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="luc-van-tien">
                {locale === "vi"
                  ? "Lục Vân Tiên - Nguyễn Đình Chiểu"
                  : "Luc Van Tien - Nguyen Dinh Chieu"}
              </SelectItem>
              <SelectItem value="ho-xuan-huong">
                {locale === "vi"
                  ? "Tinh Hoa Mùa Xuân - Hồ Xuân Hương"
                  : "Spring Essence - Ho Xuan Huong Poems"}
              </SelectItem>
              <SelectItem value="nguyen-trai">
                {locale === "vi"
                  ? "Quốc Âm Thi Tập - Nguyễn Trãi"
                  : "Nguyen Trai Quoc Am Thi Tap"}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Page/Poem Selection */}
        {selectedBook === "luc-van-tien" ? (
          <div>
            <label className="block text-sm font-medium mb-2">
              {locale === "vi" ? "Chọn trang để học:" : "Select page to study:"}
            </label>
            <Select
              value={selectedPage.toString()}
              onValueChange={(value) => setSelectedPage(Number(value))}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={locale === "vi" ? "Chọn trang" : "Select page"}
                />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <SelectItem key={page} value={page.toString()}>
                      {locale === "vi" ? `Trang ${page}` : `Page ${page}`}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        ) : selectedBook === "ho-xuan-huong" ? (
          <div>
            <label className="block text-sm font-medium mb-2">
              {locale === "vi" ? "Chọn bài thơ:" : "Select poem:"}
            </label>
            <Select
              value={selectedPoem}
              onValueChange={(value) => setSelectedPoem(value)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={locale === "vi" ? "Chọn bài thơ" : "Select poem"}
                />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {availablePoems.map((poem) => (
                  <SelectItem key={poem} value={poem}>
                    {poem}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-2">
              {locale === "vi" ? "Chọn bài thơ:" : "Select poem:"}
            </label>
            <Select
              value={selectedNguyenTraiPoem}
              onValueChange={(value) => setSelectedNguyenTraiPoem(value)}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={locale === "vi" ? "Chọn bài thơ" : "Select poem"}
                />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {availableNguyenTraiPoems.map((poem) => (
                  <SelectItem key={poem.id} value={poem.id.toString()}>
                    {poem.titleNum === 0
                      ? poem.title
                      : `${poem.title} (${locale === "vi" ? "Bài" : "Part"} ${
                          poem.titleNum
                        })`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Quiz Count Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {locale === "vi" ? "Số câu hỏi:" : "Number of questions:"}
          </label>
          <Select
            value={quizCount.toString()}
            onValueChange={(value) => setQuizCount(Number(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 15, 20].map((count) => (
                <SelectItem key={count} value={count.toString()}>
                  {count} {locale === "vi" ? "câu" : "questions"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quiz Mode Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {locale === "vi" ? "Chế độ luyện tập:" : "Quiz mode:"}
          </label>
          <Select
            value={quizMode}
            onValueChange={(value: QuizMode) => setQuizMode(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sentences">
                {locale === "vi" ? "Chỉ dịch câu hoàn chỉnh" : "Sentences only"}
              </SelectItem>
              <SelectItem value="missing-words">
                {locale === "vi" ? "Chỉ điền từ thiếu" : "Missing words only"}
              </SelectItem>
              <SelectItem value="mixed">
                {locale === "vi" ? "Kết hợp cả hai" : "Mixed"}
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-2">
            {locale === "vi"
              ? quizMode === "sentences"
                ? "Tất cả câu hỏi sẽ yêu cầu dịch toàn bộ câu từ Hán Nôm sang Quốc Ngữ"
                : quizMode === "missing-words"
                ? "Tất cả câu hỏi sẽ yêu cầu điền từ bị thiếu trong câu dịch"
                : "Câu hỏi sẽ xen kẽ giữa dịch câu hoàn chỉnh và điền từ thiếu"
              : quizMode === "sentences"
              ? "All questions will ask you to translate the entire sentence from Han Nom to Vietnamese"
              : quizMode === "missing-words"
              ? "All questions will ask you to fill in the missing word in the translation"
              : "Questions will alternate between full sentence translations and fill-in-the-blank"}
          </p>
        </div>

        {/* Quick Links */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-3">
            {locale === "vi" ? "Tài nguyên hữu ích:" : "Useful resources:"}
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href={`/${locale}/tools/han-nom-dictionaries`}
              className="flex items-center gap-2 text-blue-600 hover:underline"
              target="_blank"
            >
              <BookOpen className="w-4 h-4" />
              {locale === "vi" ? "Từ điển Hán Nôm" : "Han Nom Dictionary"}
              <ExternalLink className="w-3 h-3" />
            </Link>
            {selectedBook === "luc-van-tien" ? (
              <Link
                href={`/${locale}/our-collections/luc-van-tien/van-tien-co-tich-tan-truyen`}
                className="flex items-center gap-2 text-blue-600 hover:underline"
                target="_blank"
              >
                <BookOpen className="w-4 h-4" />
                {locale === "vi"
                  ? "Xem toàn bộ Lục Vân Tiên"
                  : "View full Luc Van Tien"}
                <ExternalLink className="w-3 h-3" />
              </Link>
            ) : selectedBook === "ho-xuan-huong" ? (
              <Link
                href={`/${locale}/our-collections/tho-ho-xuan-huong/tinh-hoa-mua-xuan`}
                className="flex items-center gap-2 text-blue-600 hover:underline"
                target="_blank"
              >
                <BookOpen className="w-4 h-4" />
                {locale === "vi"
                  ? "Xem toàn bộ Thơ Hồ Xuân Hương"
                  : "View full Ho Xuan Huong Poems"}
                <ExternalLink className="w-3 h-3" />
              </Link>
            ) : (
              <Link
                href={`/${locale}/our-collections/quoc-am-thi-tap/nguyen-trai-quoc-am-thi-tap`}
                className="flex items-center gap-2 text-blue-600 hover:underline"
                target="_blank"
              >
                <BookOpen className="w-4 h-4" />
                {locale === "vi"
                  ? "Xem toàn bộ Quốc Âm Thi Tập"
                  : "View full Nguyen Trai Quoc Am Thi Tap"}
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        </div>

        {/* Start Button */}
        <Button
          onClick={onStartQuiz}
          className="w-full"
          size="lg"
          disabled={isLoading}
        >
          {isLoading
            ? locale === "vi"
              ? "Đang tải..."
              : "Loading..."
            : locale === "vi"
            ? "Bắt đầu"
            : "Start Quiz"}
        </Button>
      </CardContent>
    </Card>
  );
}
