import { getTranslations, setRequestLocale } from "next-intl/server";
import { fetcher } from "@/lib/api";
import { getImageByKey } from "@/utils/image";
import Link from "next/link";
import { FlaskConical } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Metadata } from "next";
import { PageHeader } from "@/components/common/PageHeader";
import { PedagogyCollectionItem } from "./PedagogyCollectionItem";
import { routing } from "@/i18n/routing";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("NavigationBar.pedagogy-menu")} | Digitizing Việt Nam`,
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

const TAB_ORDER = ["mini-lecture", "textbook", "syllabus"];
const humanizeSlug = (slug: string) =>
  slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

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

  // Only show pedagogy tabs explicitly.
  const visiblePedagogyData = pedagogyData
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
          title={t("NavigationBar.pedagogy-menu")}
          subtitle={t("Pedagogy.subtitle")}
          breadcrumbItems={[{ label: t("NavigationBar.pedagogy-menu") }]}
          locale={locale}
        />
        {/* Language Lab feature card */}
        <div className="mt-10 rounded-2xl border border-red-100 bg-red-50 px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-700 text-white">
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-stone-900 text-base leading-tight">Vietnamese Language Lab</p>
              <p className="text-sm text-stone-500 mt-0.5">
                Turn any Vietnamese news article into vocabulary lists, grammar notes, and comprehension questions — instantly.
              </p>
            </div>
          </div>
          <Link
            href="/pedagogy/language-lab"
            className="shrink-0 rounded-xl bg-red-700 hover:bg-red-800 px-5 py-2.5 text-sm font-medium text-white transition-colors"
          >
            Open Language Lab →
          </Link>
        </div>

        {/* Tab */}
        {visiblePedagogyData.length > 0 && (
          <Tabs
            defaultValue={visiblePedagogyData[0].slug}
            className="w-full mt-10"
          >
            <TabsList className="h-auto p-0 bg-transparent gap-8">
              {visiblePedagogyData.map((category) => (
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

            {visiblePedagogyData.map((category) => (
              <TabsContent
                value={category.slug}
                className="mt-6 space-y-4"
                key={category.slug}
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
