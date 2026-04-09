import { getTranslations, setRequestLocale } from "next-intl/server";
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

const Pedagogies = async ({ params: { locale } }) => {
  // Enable static rendering for this page
  setRequestLocale(locale);

  const t = await getTranslations();

  const vietnameseLanguageTeachingCollection: PedagogyCollection = {
    slug: "vietnamese-language-teaching",
    title: "Vietnamese Language Teaching",
    abstract:
      "A curated hub for lesson planning, curriculum design, classroom resources, and professional learning to support Vietnamese language instruction.",
  };

  return (
    <div className="flex flex-col max-width items-center">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={t("NavigationBar.pedagogy-menu")}
          subtitle={t("Pedagogy.subtitle")}
          breadcrumbItems={[{ label: t("NavigationBar.pedagogy-menu") }]}
          locale={locale}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-10">
          <PedagogyCollectionItem
            collection={vietnameseLanguageTeachingCollection}
            basePath="/pedagogy-1"
          />
        </div>
      </div>
    </div>
  );
};

export default Pedagogies;
