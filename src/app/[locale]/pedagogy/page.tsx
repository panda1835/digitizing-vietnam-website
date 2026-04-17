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

  const pedagogyCollections: PedagogyCollection[] = [
    {
      slug: "teaching-vietnamese-language",
      title: t("Pedagogy.items.teaching-vietnamese-language.title"),
      abstract: t("Pedagogy.items.teaching-vietnamese-language.description"),
    },
    {
      slug: "teaching-vietnamese-studies",
      title: t("Pedagogy.items.teaching-vietnamese-studies.title"),
      abstract: t("Pedagogy.items.teaching-vietnamese-studies.description"),
    },
  ];

  return (
    <div className="flex flex-col max-width items-center">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={t("NavigationBar.pedagogy-menu")}
          subtitle={t("Pedagogy.subtitle")}
          breadcrumbItems={[{ label: t("NavigationBar.pedagogy-menu") }]}
          locale={locale}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {pedagogyCollections.map((collection) => (
            <PedagogyCollectionItem
              key={collection.slug}
              collection={collection}
              basePath="/pedagogy"
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pedagogies;
