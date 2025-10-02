import { getTranslations } from "next-intl/server";
import { Metadata } from "next";

import { PageHeader } from "@/components/common/PageHeader";
import ArticleCard from "@/components/ArticleCard";
import { fetcher } from "@/lib/api";
import { getImageByKey } from "@/utils/image";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("Tools.digital-humanities-tools.name")} | Digitizing Việt Nam`,
  };
}

export interface Pedagogy {
  slug: string;
  title: string;
  description: string;
  contributors: string[];
  languages?: string[];
  keywords?: string[];
  categories?: string[];
  thumbnail?: {
    url: string;
    width: number;
    height: number;
  };
  content: string;
  metadata: any;
}

const DigitalHumanitiesTools = async ({ params: { locale } }) => {
  const t = await getTranslations();

  // Fetch digital humanities tools from pedagogy categories
  let digitalHumanitiesTools: Pedagogy[] = [];
  try {
    const queryParams = {
      fields: "*",
      "populate[0]": "pedagogies.thumbnail",
      locale: locale,
    };

    const queryString = new URLSearchParams(queryParams).toString();
    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/pedagogy-categories?${queryString}`;
    const data = await fetcher(url);
    const allCategories = data.data;

    const dhCategory = allCategories.find(
      (category) => category.slug === "digital-humanities-tool"
    );

    if (dhCategory) {
      digitalHumanitiesTools = dhCategory.pedagogies.map((post) => {
        const thumbnail = getImageByKey(post.thumbnail.formats, "medium");
        return {
          slug: post.slug,
          title: post.title,
          description: post.description,
          content: post.content,
          thumbnail: {
            url: thumbnail!.url,
            width: thumbnail!.width,
            height: thumbnail!.height,
          },
          metadata: post.metadata,
        } as Pedagogy;
      });
    }
  } catch (error) {
    console.error("Error fetching digital humanities tools:", error);
  }

  return (
    <div className="flex flex-col items-center max-width">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={t("Tools.digital-humanities-tools.name")}
          subtitle={t("Tools.digital-humanities-tools.description")}
          breadcrumbItems={[
            { label: t("NavigationBar.tools"), href: "/tools" },
            { label: t("Tools.digital-humanities-tools.name") },
          ]}
          locale={locale}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-10">
          {digitalHumanitiesTools.map((item) => (
            <ArticleCard
              key={`/tools/digital-humanities-tools/${item.slug}`}
              title={item.title}
              description={item.description}
              date=""
              imageUrl={item.thumbnail}
              link={`/tools/digital-humanities-tools/${item.slug}`}
            />
          ))}
        </div>

        {digitalHumanitiesTools.length === 0 && (
          <div className="text-center text-muted-foreground mt-10">
            {t("Tools.digital-humanities-tools.no-tools-message")}
          </div>
        )}
      </div>
    </div>
  );
};

export default DigitalHumanitiesTools;
