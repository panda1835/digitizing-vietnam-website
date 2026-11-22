import { Suspense } from "react";
import { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SITE_URL } from "@/utils/seo";
import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import NgheThuCongReader from "./NgheThuCongReader";

const PATH = "research/ca-dao-tuc-ngu/tu-dien-nghe-thu-cong";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({
    locale,
    namespace: "Tools.ca-dao-tuc-ngu",
  });
  const title = `${t("nghe-thu-cong.seo.title")} | Digitizing Việt Nam`;
  const description = t("nghe-thu-cong.seo.description");
  const url = `${SITE_URL}/${locale}/${PATH}`;
  const image = {
    url: `${SITE_URL}/images/research-hub/opengraph-image.png`,
    width: 1200,
    height: 630,
    alt: t("seo.image-alt"),
  };

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${SITE_URL}/en/${PATH}`,
        vi: `${SITE_URL}/vi/${PATH}`,
      },
    },
    openGraph: {
      type: "website",
      siteName: "Digitizing Việt Nam",
      title,
      description,
      url,
      locale: locale === "vi" ? "vi_VN" : "en_US",
      alternateLocale: locale === "vi" ? "en_US" : "vi_VN",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function TuDienNgheThuCongPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations();

  return (
    <main className="flex flex-col items-center w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="w-full mb-20">
        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={[
            { label: t("ResearchHub.title"), href: "research" },
            {
              label: t("Tools.ca-dao-tuc-ngu.name"),
              href: "research/ca-dao-tuc-ngu",
            },
            { label: t("Tools.ca-dao-tuc-ngu.nghe-thu-cong.title") },
          ]}
        />

        {/* The open Entry lives in ?muc=, read with useSearchParams. */}
        <Suspense>
          <NgheThuCongReader />
        </Suspense>
      </div>
    </main>
  );
}
