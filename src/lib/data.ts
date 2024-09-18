import exp from "constants";
import config from "./config";

export async function fetchData(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Failed to fetch");
  }
  const data = await res.json();

  return data;
}

export async function fetchCollections(locale) {
  const data = await fetchData(`${config.api.collections}?lang=${locale}`);
  const collections = data["data"];

  return collections;
}

export async function fetchEachCollection(collectionId, locale) {
  const collectionDataResponse = await fetchData(
    `${config["api"]["collections"]}/${collectionId}?lang=${locale}`
  );
  const collectionData = collectionDataResponse["data"];

  const featuredArticlesResponse = await fetchData(
    `${config["api"]["blogs"]}?related-collection=${collectionId}`
  );
  const featuredArticles = featuredArticlesResponse["data"];

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
  const manifest = manifestResponse;
  let mediaType = "document";
  if (manifestResponse["media"]) {
    mediaType = manifestResponse["media"];
  }

  // Fetch collection data
  const collectionResponse = await fetchData(
    `${config["api"]["collections"]}/${collectionId}?lang=${locale}`
  );
  const collectionName = collectionResponse["data"]["title"];

  // Fetch page OCR text
  const ocrResponse = await fetchData(
    `${config["api"]["ocr"]}/${collectionId}/${documentId}?canvasId=${canvasId}`
  );
  const currentPageOCR = ocrResponse["text"];

  return {
    manifest,
    mediaType,
    collectionName,
    currentPageOCR,
  };
}

export async function fetchBlogs() {
  const newData = await fetchData(`${config["api"]["blogs"]}/news`);
  const news = newData["data"];

  const highlightData = await fetchData(`${config["api"]["blogs"]}/highlights`);
  const highlights = highlightData["data"];

  const initiativeData = await fetchData(
    `${config["api"]["blogs"]}/initiatives`
  );
  const initiatives = initiativeData["data"];

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
