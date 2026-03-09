import { getTranslations, setRequestLocale } from "next-intl/server";
import { fetcher } from "@/lib/api";
import { getImageByKey } from "@/utils/image";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { PedagogyCollectionItem } from "../pedagogy/PedagogyCollectionItem";
import { routing } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("NavigationBar.outreach-menu")} | Digitizing Việt Nam`,
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const revalidate = 3600;

export interface Outreach {
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

export interface OutreachCollection {
  slug: string;
  title: string;
  abstract: string;
  thumbnail?: {
    url: string;
    width: number;
    height: number;
    formats?: any;
  };
  pedagogy_category?: {
    slug: string;
    name: string;
  };
  pedagogies?: Outreach[];
}

export interface OutreachCategory {
  slug: string;
  category_name: string;
  description: string;
  display_order: number;
  pedagogy_collections: OutreachCollection[];
}

const TAB_ORDER = ["digital-humanities-tool", "podcast"];
const humanizeSlug = (slug: string) =>
  slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const OutreachPage = async ({ params: { locale } }) => {
  setRequestLocale(locale);

  const t = await getTranslations();

  let outreachData: OutreachCategory[] = [];

  try {
    const queryParams = {
      fields: "*",
      "populate[0]": "pedagogy_collections.thumbnail",
      locale: locale,
    };

    const queryString = new URLSearchParams(queryParams).toString();

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/pedagogy-categories?${queryString}`;

    const data = await fetcher(url, {
      next: { revalidate: 3600 },
    });
    const allCategories = data.data;

    const categories: OutreachCategory[] = [];

    allCategories.forEach((category) => {
      categories.push({
        slug: category.slug,
        category_name: category.name,
        description: category.description,
        display_order: category.display_order,
        pedagogy_collections:
          category.pedagogy_collections?.map((collection) => {
            const thumbnail = collection.thumbnail
              ? getImageByKey(collection.thumbnail.formats, "medium")
              : null;
            return {
              slug: collection.slug,
              title: collection.title,
              abstract: collection.abstract,
              thumbnail: thumbnail
                ? {
                    url: thumbnail.url,
                    width: thumbnail.width,
                    height: thumbnail.height,
                    formats: collection.thumbnail.formats,
                  }
                : undefined,
            } as OutreachCollection;
          }) || [],
      });
    });

    outreachData = categories;
  } catch (error) {
    console.error("Error fetching outreach categories:", error);
  }

  const visibleOutreachData = outreachData
    .filter(
      (category) =>
        TAB_ORDER.includes(category.slug) &&
        category.pedagogy_collections.length > 0
    )
    .sort((a, b) => TAB_ORDER.indexOf(a.slug) - TAB_ORDER.indexOf(b.slug));

  return (
    <div className="flex flex-col max-width items-center">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={t("NavigationBar.outreach-menu")}
          subtitle={t("Outreach.subtitle")}
          breadcrumbItems={[{ label: t("NavigationBar.outreach-menu") }]}
          locale={locale}
        />
        {visibleOutreachData.length > 0 && (
          <Tabs defaultValue={visibleOutreachData[0].slug} className="w-full mt-10">
            <TabsList className="h-auto p-0 bg-transparent gap-8">
              {visibleOutreachData.map((category) => (
                <TabsTrigger
                  key={category.slug}
                  value={category.slug}
                  className={[
                    "px-4 py-2 h-auto",
                    "data-[state=active]:bg-branding-white data-[state=active]:shadow-none",
                    "data-[state=active]:border-gray-200 data-[state=active]:text-foreground",
                    "data-[state=active]:border-b-branding-brown",
                    "rounded-t-lg rounded-b-none border border-b-2 border-transparent text-base font-normal",
                  ].join(" ")}
                >
                  {category.category_name || humanizeSlug(category.slug)}
                </TabsTrigger>
              ))}
            </TabsList>

            {visibleOutreachData.map((category) => (
              <TabsContent value={category.slug} className="mt-6 space-y-4" key={category.slug}>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-10">
                  {category.pedagogy_collections.map((collection) => (
                    <PedagogyCollectionItem
                      collection={collection}
                      key={collection.slug}
                      basePath="/outreach"
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default OutreachPage;
