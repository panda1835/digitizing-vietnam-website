import { getTranslations } from "next-intl/server";

import { OnlineResource, ResourceCategory } from "@/types/online-resource";
import CategoryDialog from "./CategoryDialog";
import { PageHeader } from "@/components/common/PageHeader";
import { fetcher } from "@/lib/api";

import { Merriweather } from "next/font/google";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t("NavigationBar.online-resources")} | Digitizing Việt Nam`,
  };
}

const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });
const OnlineResources = async ({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { category?: string };
}) => {
  const t = await getTranslations();

  let onlineResources: ResourceCategory[] = [];

  try {
    const queryParams = {
      "pagination[withCount]": "false",
      fields: "*",
      populate: "*",
      locale: locale,
    };

    const queryString = new URLSearchParams(queryParams).toString();

    const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/online-resource-types?${queryString}`;

    const data = await fetcher(url);
    const allCategories = data.data;
    // console.log(allCategories);
    const resourceCategories: ResourceCategory[] = [];
    // Iterate through each online resource type
    // add the online resources to the array
    allCategories.forEach((category) => {
      resourceCategories.push({
        category_name: category.name,
        description: category.description,
        resources: category.online_resources.map((resource) => {
          return {
            title: resource.name,
            description: resource.description,
            url: resource.url,
          } as OnlineResource;
        }),
      });
    });
    onlineResources = resourceCategories;
  } catch (error) {
    console.error("Error fetching online resources:", error);
  } finally {
  }

  return (
    <div className="flex flex-col max-width items-center">
      <div className="flex-col mb-20 w-full">
        <PageHeader
          title={t("NavigationBar.online-resources")}
          subtitle={t("OnlineResource.subtitle")}
          breadcrumbItems={[{ label: t("NavigationBar.online-resources") }]}
          locale={locale}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-16">
          {onlineResources.map((category) => (
            <div
              className="flex flex-col items-left justify-items-start border bg-branding-gray rounded-lg p-5 h-full justify-between"
              key={category.category_name}
            >
              <div
                className={`${merriweather.className} text-branding-brown text-3xl`}
              >
                {category.category_name}
              </div>
              <div>
                <p className="mt-5 text-base font-light font-['Helvetica Neue'] leading-relaxed text-branding-black text-left">
                  {category.description}
                </p>
                <CategoryDialog category={category} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnlineResources;
