import { getTranslations } from "next-intl/server";

import { fetcher } from "@/lib/api";
import { getImageByKey } from "@/utils/image";

import ArticleCard from "@/components/ArticleCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("NavigationBar.outreach")} | Digitizing Việt Nam`,
  };
}

// export const dynamic = "force-dynamic";

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

export interface PedagogyCategory {
  slug: string;
  category_name: string;
  description: string;
  display_order: number;
  pedagogies: Pedagogy[];
}

const Pedagogies = async ({ params: { locale } }) => {
  const t = await getTranslations();

  let pedagogyData: PedagogyCategory[] = [];

  try {
    const queryParams = {
      fields: "*",
      "populate[0]": "pedagogies.thumbnail",
      // "populate[1]": "blogs.blog_authors",
      locale: locale,
    };

    const queryString = new URLSearchParams(queryParams).toString();

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/pedagogy-categories?${queryString}`;

    const data = await fetcher(url);
    const allCategories = data.data;

    const pedagogyCategories: PedagogyCategory[] = [];

    allCategories.forEach((category) => {
      pedagogyCategories.push({
        slug: category.slug,
        category_name: category.name,
        description: category.description,
        display_order: category.display_order,
        pedagogies: category.pedagogies.map((post) => {
          const thumbnail = getImageByKey(post.thumbnail.formats, "medium");
          return {
            slug: post.slug,
            title: post.title,
            description: post.description,
            // contributors: (post.contributors &&
            //   post.contributors.map((contributor) => contributor.name)) || [""],
            // languages: (post.languages &&
            //   post.languages.map((language) => language.name)) || [""],
            // keywords: (post.keywords &&
            //   post.keywords.map((keyword) => keyword.name)) || [""],
            // categories: post.categories.map((category) => category.name) || "",
            content: post.content,
            thumbnail: {
              url: thumbnail!.url,
              width: thumbnail!.width,
              height: thumbnail!.height,
            },
            metadata: post.metadata,
          } as Pedagogy;
        }),
      });
    });

    pedagogyData = pedagogyCategories;
  } catch (error) {
    console.error("Error fetching blogs:", error);
  }
  return (
    <div className="flex flex-col max-width items-center">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={t("NavigationBar.outreach")}
          subtitle={t("Outreach.subtitle")}
          breadcrumbItems={[{ label: t("NavigationBar.outreach") }]}
          locale={locale}
        />
        {/* Tab */}
        <Tabs
          defaultValue={pedagogyData[0].category_name
            .replace(/\s/g, "")
            .toLowerCase()}
          className="w-full mt-10"
        >
          <TabsList className="h-auto p-0 bg-transparent gap-8">
            {pedagogyData.map((category) => (
              <TabsTrigger
                key={category.category_name}
                value={category.category_name.replace(/\s/g, "").toLowerCase()}
                className={[
                  "px-4 py-2 h-auto",
                  "data-[state=active]:bg-branding-white data-[state=active]:shadow-none",
                  "data-[state=active]:border-gray-200 data-[state=active]:text-foreground",
                  "data-[state=active]:border-b-branding-brown",
                  "rounded-t-lg rounded-b-none border border-b-2 border-transparent text-base font-normal",
                ].join(" ")}
              >
                {category.category_name}
              </TabsTrigger>
            ))}
          </TabsList>

          {pedagogyData.map((category) => (
            <TabsContent
              value={category.category_name.replace(/\s/g, "").toLowerCase()}
              className="mt-6 space-y-4"
              key={category.category_name}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-10">
                {category.pedagogies.map((item) => (
                  <ArticleCard
                    title={item.title}
                    description={item.description}
                    date={""}
                    imageUrl={item.thumbnail}
                    link={`/pedagogy/${item.slug}`}
                    key={`/pedagogy/${item.slug}`}
                  />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Pedagogies;
