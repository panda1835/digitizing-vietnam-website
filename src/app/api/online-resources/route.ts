import { NextResponse } from "next/server";

import { fetcher } from "@/lib/api";

import { OnlineResource, ResourceCategory } from "@/types/online-resources";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams(searchParams);
  const queryString = params.toString();
  const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/online-resource-types?${queryString}`;

  const data = await fetcher(url);
  const allCategories = data.data;
  const resourceCategories: ResourceCategory[] = [];
  // Iterate through each online resource type
  // add the online resources to the array
  allCategories.forEach((category) => {
    resourceCategories.push({
      category_name: category.name,
      description: category.description,
      image_url: category.thumbnail.url,
      resources: category.online_resources.map((resource) => {
        return {
          title: resource.name,
          description: resource.description,
          url: resource.url,
        } as OnlineResource;
      }),
    });
  });

  return NextResponse.json({ data: resourceCategories }, { status: 200 });
}
