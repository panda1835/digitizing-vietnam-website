import { getTranslations, setRequestLocale } from "next-intl/server";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Merriweather } from "next/font/google";
import Link from "next/link";

import { PageHeader } from "@/components/common/PageHeader";
import {
  getCategoryBySlug,
  getOnlineResources,
} from "../resource-utils";

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

export const revalidate = 60 * 60 * 24;

export async function generateMetadata({
  params,
}: {
  params: { locale: string; categorySlug: string };
}): Promise<Metadata> {
  const t = await getTranslations();

  try {
    const categories = await getOnlineResources(params.locale);
    const category = getCategoryBySlug(categories, params.categorySlug);

    if (category) {
      return {
        title: `${category.category_name} | Digitizing Việt Nam`,
      };
    }
  } catch (error) {
    console.error("Error fetching online resource metadata:", error);
  }

  return {
    title: `${t("NavigationBar.online-resources")} | Digitizing Việt Nam`,
  };
}

const OnlineResourceCategoryPage = async ({
  params: { locale, categorySlug },
}: {
  params: { locale: string; categorySlug: string };
}) => {
  setRequestLocale(locale);

  const t = await getTranslations();
  const categories = await getOnlineResources(locale).catch((error) => {
    console.error("Error fetching online resource category:", error);
    return [];
  });
  const category = getCategoryBySlug(categories, categorySlug);

  if (!category) {
    notFound();
  }

  return (
    <div className="flex flex-col max-width items-center">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={category.category_name}
          subtitle={category.description}
          breadcrumbItems={[
            {
              label: t("NavigationBar.online-resources"),
              href: "online-resources",
            },
            { label: category.category_name },
          ]}
          locale={locale}
        />

        <div className="mt-12">
          {category.resources.length === 0 && (
            <p className="text-branding-black text-base font-light font-['Helvetica Neue'] leading-relaxed">
              {t("OnlineResource.no-resource-message")}
            </p>
          )}
          {category.resources.map((resource) => (
            <div key={resource.title} className="mb-8">
              <div
                className={`${merriweather.className} text-branding-black text-2xl leading-relaxed`}
              >
                <Link
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-branding-brown"
                >
                  {resource.title}
                </Link>
              </div>
              <p className="text-branding-black text-base font-light font-['Helvetica Neue'] leading-relaxed mt-2">
                {resource.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnlineResourceCategoryPage;
