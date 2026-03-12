import { fetcher } from "@/lib/api";
import { OnlineResource, ResourceCategory } from "@/types/online-resource";

type ApiOnlineResource = {
  name: string;
  description: string;
  url: string;
};

type ApiCategory = {
  name: string;
  description: string;
  online_resources?: ApiOnlineResource[];
};

export const getCategorySlug = (categoryName: string) =>
  categoryName
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const getOnlineResources = async (
  locale: string,
): Promise<ResourceCategory[]> => {
  const queryParams = {
    "pagination[withCount]": "false",
    fields: "*",
    populate: "*",
    locale,
  };
  const queryString = new URLSearchParams(queryParams).toString();

  const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/online-resource-types?${queryString}`;
  const data = await fetcher(url, {
    next: { revalidate: 60 * 60 * 24 },
  });

  const allCategories: ApiCategory[] = data.data ?? [];

  return allCategories.map((category) => ({
    category_name: category.name,
    description: category.description,
    resources: (category.online_resources ?? []).map((resource) => {
      return {
        title: resource.name,
        description: resource.description,
        url: resource.url,
      } as OnlineResource;
    }),
  }));
};

export const getCategoryBySlug = (
  categories: ResourceCategory[],
  categorySlug: string,
) =>
  categories.find(
    (category) => getCategorySlug(category.category_name) === categorySlug,
  );
