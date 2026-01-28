import { getTranslations, setRequestLocale } from "next-intl/server";
import { fetcher } from "@/lib/api";
import { getImageByKey } from "@/utils/image";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { PedagogyCollectionItem } from "./PedagogyCollectionItem";
import { routing } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("NavigationBar.outreach")} | Digitizing Việt Nam`,
  };
}

// Generate static pages for all locales
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Revalidate every hour for ISR
export const revalidate = 3600;

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

export interface PedagogyCollection {
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
  pedagogies?: Pedagogy[];
}

export interface PedagogyCategory {
  slug: string;
  category_name: string;
  description: string;
  display_order: number;
  pedagogy_collections: PedagogyCollection[];
}

const Pedagogies = async ({ params: { locale } }) => {
  // Enable static rendering for this page
  setRequestLocale(locale);

  const t = await getTranslations();

  let pedagogyData: PedagogyCategory[] = [];

  try {
    const queryParams = {
      fields: "*",
      "populate[0]": "pedagogy_collections.thumbnail",
      locale: locale,
    };

    const queryString = new URLSearchParams(queryParams).toString();

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/pedagogy-categories?${queryString}`;

    const data = await fetcher(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });
    const allCategories = data.data;

    const pedagogyCategories: PedagogyCategory[] = [];

    allCategories.forEach((category) => {
      pedagogyCategories.push({
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
            } as PedagogyCollection;
          }) || [],
      });
    });

    pedagogyData = pedagogyCategories;
  } catch (error) {
    console.error("Error fetching pedagogy categories:", error);
  }

  // Filter out digital-humanities-tool category
  const filteredPedagogyData = pedagogyData.filter(
    (category) => category.slug !== "digital-humanities-tool"
  );

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
        {filteredPedagogyData.length > 0 && (
          <Tabs
            defaultValue={filteredPedagogyData[0].category_name
              .replace(/\s/g, "")
              .toLowerCase()}
            className="w-full mt-10"
          >
            <TabsList className="h-auto p-0 bg-transparent gap-8">
              {filteredPedagogyData.map((category) => (
                <TabsTrigger
                  key={category.category_name}
                  value={category.category_name
                    .replace(/\s/g, "")
                    .toLowerCase()}
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

            {filteredPedagogyData.map((category) => (
              <TabsContent
                value={category.category_name.replace(/\s/g, "").toLowerCase()}
                className="mt-6 space-y-4"
                key={category.category_name}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-10">
                  {category.pedagogy_collections.map((collection) => (
                    <PedagogyCollectionItem
                      collection={collection}
                      key={collection.slug}
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

export default Pedagogies;
