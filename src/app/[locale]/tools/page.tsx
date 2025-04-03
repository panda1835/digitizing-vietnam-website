import BreadcrumbAndSearchBar from "@/components/layout/BreadcrumbAndSearchBar";
import { getTranslations } from "next-intl/server";

import { Merriweather } from "next/font/google";
import { Metadata } from "next";

import { Separator } from "@/components/ui/separator";
import { InfoCard } from "@/components/common/InfoCard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("NavigationBar.tools")} | Digitizing Việt Nam`,
  };
}

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

const Tools = async ({ params: { locale } }) => {
  const t = await getTranslations();
  const tools = [
    {
      href: "https://ocr.digitizingvietnam.com",
      target: "_blank",
      rel: "noopener noreferrer",
      name: t("Tools.image-ocr-platform.name"),
      description: t("Tools.image-ocr-platform.description"),
    },
    {
      href: "/tools/han-nom-dictionaries",
      name: t("Tools.han-nom-dictionaries.name"),
      description: t("Tools.han-nom-dictionaries.description"),
    },
    {
      href: "/tools/kieu-tools",
      name: t("Tools.kieu-tools.name"),
      description: t("Tools.kieu-tools.description"),
    },
  ];
  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 w-full">
        <BreadcrumbAndSearchBar
          locale={locale}
          breadcrumbItems={[{ label: t("NavigationBar.tools") }]}
        />
        <div
          className={`${merriweather.className} text-branding-black text-4xl`}
        >
          {t("NavigationBar.tools")}
        </div>
        {/* Subheadline */}
        <div
          className={`font-light font-['Helvetica Neue'] leading-relaxed mt-8 max-w-4xl`}
        >
          {locale === "en"
            ? "Explore a suite of Digital Humanities tools designed for textual analysis and historical research. These resources support scholars in studying and interpreting historical texts with precision."
            : "Khám phá bộ công cụ Nhân văn Số được thiết kế để phân tích văn bản và nghiên cứu lịch sử. Những tài nguyên này hỗ trợ các nhà nghiên cứu trong việc nghiên cứu và diễn giải các văn bản lịch sử một cách chính xác."}
        </div>
        <div className="mt-28">
          <Separator />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
          {tools.map((tool) => (
            <div key={tool.name}>
              <InfoCard
                name={tool.name}
                description={tool.description}
                url={tool.href}
                newTab={false}
              />
            </div>
          ))}
        </div>

        {/* <iframe
          src="https://kimtudien.com.vn"
          width="100%"
          height="600"
          frameBorder="0"
          title="Embedded Website"
        ></iframe> */}
      </div>
    </div>
  );
};

export default Tools;
