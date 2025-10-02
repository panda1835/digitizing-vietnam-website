import { getTranslations } from "next-intl/server";
import LucVanTienQuizClient from "./LucVanTienQuizClient";

export default async function LucVanTienQuizPage({
  params,
}: {
  params: { locale: string };
}) {
  const t = await getTranslations();
  const { locale } = params;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {locale === "vi" ? "Trắc Nghiệm Lục Vân Tiên" : "Luc Van Tien Quiz"}
      </h1>
      <p className="mb-8 text-gray-600">
        {locale === "vi"
          ? "Kiểm tra khả năng đọc chữ Hán Nôm của bạn bằng cách dịch các câu từ Lục Vân Tiên sang Quốc ngữ."
          : "Test your Han Nom reading skills by translating sentences from Luc Van Tien to modern Vietnamese."}
      </p>
      <LucVanTienQuizClient locale={locale} />
    </div>
  );
}
