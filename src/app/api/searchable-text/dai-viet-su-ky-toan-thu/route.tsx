import { NextResponse } from "next/server";
import db from "@/lib/db";
import {
  flattenItems,
  titleToTopicId,
} from "@/app/[locale]/our-collections/[collectionid]/[documentid]/searchable-text/dai-viet-su-ky-toan-thu/utils";
import { titles } from "@/app/[locale]/our-collections/[collectionid]/[documentid]/searchable-text/dai-viet-su-ky-toan-thu/utils";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const book = searchParams.get("book");
    const page = Number(searchParams.get("page"));
    const topic = searchParams.get("topic");

    // const topicTitle = titles[Number(book)].children[Number(topic) - 1].title;
    let topicTitle = flattenItems(titles[Number(book)].children)[
      Number(topic) - 1
    ].title;

    if (
      [
        "Phụ: Mạc Phúc Nguyên",
        "Phụ: Mạc Phúc Nguyên ",
        "Phụ: Mạc Hậu Hợp",
        "Phụ: Mặc Đăng Doanh, Mạc Phúc Nguyên",
      ].includes(topicTitle)
    ) {
      // For some reason, the "Phụ" tile of Ban Ky Tuc Bien is the same as the previous one
      // So we need to get the previous title. Otherwise, it will not work because the topicId
      // does not exist in the database
      topicTitle = flattenItems(titles[Number(book)].children)[
        Number(topic) - 2
      ].title;
    }

    const topicId = titleToTopicId(topicTitle);

    let returnData = {};

    let data;

    if (book == "0") {
      [data] = await db.query(`SELECT * FROM tbl_quyenthu WHERE (Quyen = ?)`, [
        topic,
      ]);
    } else {
      if (topicId < 15) {
        [data] = await db.query(
          `SELECT * FROM tbl_dvsk_data WHERE (MaTrieuDai = ?)`,
          [topicId]
        );
      } else {
        [data] = await db.query(
          `SELECT * FROM tbl_dvsk_data WHERE (MaTenHieu = ?)`,
          [topicId]
        );
      }
    }

    let chuThich;
    let maChuThich = "";
    maChuThich = data[page - 1]?.ma_chuthich || "";
    const chuThichNumbers = (maChuThich.match(/\{(\d+)\}/g) || []).map((m) =>
      m.replace(/\{|\}/g, "")
    );

    if (chuThichNumbers.length > 0) {
      const placeholders = chuThichNumbers.map(() => "?").join(",");

      if (book == "0") {
        const chuThichResult = await db.query(
          `SELECT * FROM tbl_qthu_chuthich WHERE ma_chuthich IN (${placeholders})`,
          chuThichNumbers
        );
        chuThich = chuThichResult[0] || [];
      } else {
        const chuThichResult = await db.query(
          `SELECT ma_chuthich, chu_thich FROM tbl_chuthich WHERE ma_chuthich IN (${placeholders})`,
          chuThichNumbers
        );
        chuThich = chuThichResult[0] || [];
      }
    }

    returnData = {
      count: data.length,
      quocNgu: data[page - 1]?.QuocNgu || "",
      nom: data[page - 1]?.nom || "",
      phienAm: data[page - 1]?.phien_am || "",
      vT: data[page - 1]?.vt || "",
      image: data[page - 1]?.ToSo || "",
      chuThich: chuThich || [],
    };

    return NextResponse.json(returnData);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
