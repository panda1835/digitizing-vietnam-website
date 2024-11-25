import { fetchAPI } from "./fetch-api";

import config from "../lib/config";

const token = process.env.NEXT_PUBLIC_STRAPI_API_TOKEN;

export async function fetchData(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch");
  }
  const data = await res.json();

  return data;
}

export async function fetchCollections(locale: string) {
  const path = `/collections`;
  const urlParamsObject = { populate: "*", locale: locale, sort: "Order:asc" };
  const options = { headers: { Authorization: `Bearer ${token}` } };
  const data = await fetchAPI(path, urlParamsObject, options);
  return data["data"];
}

export async function fetchEachCollection(collectionId, locale) {
  // const collectionDataResponse = await fetchData(
  //   `${config["api"]["collections"]}/${collectionId}?lang=${locale}`
  // );

  const path = `/collections`;
  const urlParamsObject = {
    populate: "*",
    locale: locale,
    sort: "Order:asc",
    filters: {
      Slug: {
        $eq: collectionId,
      },
    },
  };
  const options = { headers: { Authorization: `Bearer ${token}` } };
  const collectionDataResponse = await fetchAPI(path, urlParamsObject, options);

  const featuredArticlesResponse = await fetchData(
    `${config["api"]["blogs"]}?related-collection=${collectionId}`
  );

  const data = await Promise.all([
    collectionDataResponse,
    featuredArticlesResponse,
  ]);

  console.log(data, data[0]["data"][0]["collection_items"]);
  const collectionData = data[0]["data"][0];
  const featuredArticles = data[1]["data"];

  return {
    collectionData,
    featuredArticles,
  };
}

export async function fetchCollectionItems(
  collectionId,
  documentId,
  locale,
  canvasId
) {
  // Fetch manifest data
  const manifestResponse = await fetchData(
    `${config["api"]["manifest"]}/${collectionId}/${documentId}`
  );

  // Fetch collection data
  const collectionResponse = await fetchData(
    `${config["api"]["collections"]}/${collectionId}?lang=${locale}`
  );

  // Fetch page OCR text
  const ocrResponse = await fetchData(
    `${config["api"]["ocr"]}/${collectionId}/${documentId}?canvasId=${canvasId}`
  );

  const data = await Promise.all([
    manifestResponse,
    collectionResponse,
    ocrResponse,
  ]);

  const manifest = data[0];
  const collectionName = data[1]["data"]["title"];
  const currentPageOCR = data[2]["text"];

  let mediaType = "document";
  if (manifest["media"]) {
    mediaType = manifest["media"];
  }

  return {
    manifest,
    mediaType,
    collectionName,
    currentPageOCR,
  };
}

export async function fetchBlogs() {
  const newData = await fetchData(`${config["api"]["blogs"]}/news`);
  const highlightData = await fetchData(`${config["api"]["blogs"]}/highlights`);
  const initiativeData = await fetchData(
    `${config["api"]["blogs"]}/initiatives`
  );

  const data = await Promise.all([newData, highlightData, initiativeData]);

  const news = data[0]["data"];
  const highlights = data[1]["data"];
  const initiatives = data[2]["data"];

  return {
    news,
    highlights,
    initiatives,
  };
}

export async function fetchBlogArticle(blogId) {
  const data = await fetchData(`${config.api.blogs}?blog-id=${blogId}`);
  const post = data["data"];
  return post;
}
