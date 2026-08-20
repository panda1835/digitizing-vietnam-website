import { Metadata } from "next";
import { Suspense } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { PageHeader } from "@/components/common/PageHeader";
import CorpusSearch from "./_components/CorpusSearch";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("ResearchHub.HanNomHub.hero.title")} | Digitizing Việt Nam`,
  };
}

export default async function SecondarySourceCorpusPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations();
  const vi = locale === "vi";

  const title = vi ? "Kho nghiên cứu thứ cấp" : "Secondary Source Corpus";
  const subtitle = vi
    ? "Tìm kiếm toàn văn và hỏi đáp có dẫn nguồn trên các công trình nghiên cứu Hán Nôm hiện đại. Mỗi trích dẫn mở đúng trang quét để bạn tự kiểm chứng."
    : "Full-text search and cited question-answering across modern Hán-Nôm scholarship. Every citation opens the scanned page so you can verify it yourself.";

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={title}
          subtitle={subtitle}
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "research" },
            { label: t("ResearchHub.HanNomHub.hero.title"), href: "research/han-nom" },
            { label: title },
          ]}
          locale={locale}
        />

        <main className="mt-10">
          {/* CorpusSearch reads ?q= via useSearchParams, which Next requires to
              sit inside a Suspense boundary. */}
          <Suspense fallback={<div className="text-sm text-muted-foreground">…</div>}>
            <CorpusSearch locale={locale} />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
