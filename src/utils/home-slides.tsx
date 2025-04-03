import { fetcher } from "@/lib/api";
import { getImageByKey } from "./image";

export async function generateHomePageCarouselItems(locale: string) {
  const queryParams = {
    fields: "*",
    "populate[0]": "carousel.image",
    locale: locale,
  };

  const queryString = new URLSearchParams(queryParams).toString();

  const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/home-page?${queryString}`;

  const data = await fetcher(url);
  const homeData = data.data;
  return homeData.carousel.map((image) => ({
    img: getImageByKey(image.image.formats, "medium")!.url,
    caption: image.caption,
  }));
}
