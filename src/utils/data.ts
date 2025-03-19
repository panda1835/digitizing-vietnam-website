import { fetchAPI } from "./fetch-api";

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
