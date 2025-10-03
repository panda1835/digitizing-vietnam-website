import { getTranslations } from "next-intl/server";
import HanNomQuizClient from "./HanNomQuizClient";

export default async function HanNomQuizPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();
  const { locale } = params;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {locale === "vi" ? "Trắc Nghiệm Hán Nôm" : "Han Nom Quiz"}
      </h1>
      <p className="mb-8 text-gray-600">
        {locale === "vi"
          ? "Kiểm tra khả năng đọc chữ Hán Nôm của bạn bằng cách dịch các câu từ Lục Vân Tiên, Thơ Hồ Xuân Hương và Quốc Âm Thi Tập sang Quốc ngữ."
          : "Test your Han Nom reading skills by translating sentences from Luc Van Tien, Ho Xuan Huong Poems, and Nguyen Trai Quoc Am Thi Tap to modern Vietnamese."}
      </p>
      <HanNomQuizClient locale={locale} />
    </div>
  );
}
