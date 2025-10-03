"use server";

import type {
  LucVanTienPageData,
  HoXuanHuongPoemData,
  NguyenTraiPoemData,
} from "./types";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export async function fetchLucVanTienData(
  pageNumber: number
): Promise<LucVanTienPageData | null> {
  try {
    const response = await fetch(
      `${apiUrl}/searchable-text/luc-van-tien?page=${pageNumber}`,
      { cache: "no-store" }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching page data:", error);
    return null;
  }
}

export async function fetchHoXuanHuongData(
  poemTitle: string
): Promise<HoXuanHuongPoemData | null> {
  try {
    const response = await fetch(
      `${apiUrl}/searchable-text/tinh-hoa-mua-xuan?topic=${encodeURIComponent(
        poemTitle
      )}`,
      { cache: "no-store" }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching poem data:", error);
    return null;
  }
}

export async function fetchAvailableHoXuanHuongPoems(): Promise<string[]> {
  try {
    // Fetch any poem to get the list of all poems
    const response = await fetch(
      `${apiUrl}/searchable-text/tinh-hoa-mua-xuan?topic=Cảnh thu`,
      { cache: "no-store" }
    );
    const data = await response.json();
    return data.all_qn_topic || [];
  } catch (error) {
    console.error("Error fetching poems:", error);
    return [];
  }
}

export async function fetchNguyenTraiData(
  poemId: string
): Promise<NguyenTraiPoemData | null> {
  try {
    const response = await fetch(
      `${apiUrl}/searchable-text/quoc-am-thi-tap?topicId=${poemId}`,
      { cache: "no-store" }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching Nguyen Trai data:", error);
    return null;
  }
}

export async function fetchAvailableNguyenTraiPoems(): Promise<
  { id: number; title: string; titleNum: number }[]
> {
  try {
    // Fetch any poem to get the list of all poems
    const response = await fetch(
      `${apiUrl}/searchable-text/quoc-am-thi-tap?topicId=1`,
      { cache: "no-store" }
    );
    const data = await response.json();
    const poems = data.all_ids.map((id: number, index: number) => ({
      id,
      title: data.all_qn_titles[index],
      titleNum: data.all_title_nums[index],
    }));
    return poems;
  } catch (error) {
    console.error("Error fetching Nguyen Trai poems:", error);
    return [];
  }
}
