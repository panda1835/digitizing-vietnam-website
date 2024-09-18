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

  const featuredArticlesResponse = await fetchData(
    `${config["api"]["blogs"]}?related-collection=${collectionId}`
  );

  const data = await Promise.all([
    collectionDataResponse,
    featuredArticlesResponse,
  ]);
  const collectionData = data[0]["data"];
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
