import { NextResponse } from "next/server";
import fs from "fs/promises";
import { parseStringPromise } from "xml2js";
import path from "path";
import db from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = searchParams.get("page");
    let returnData = {};

    const [data]: any = await db.query(
      `SELECT * FROM chinh_phu_ngam WHERE (textNo = ?)`,
      [page]
    );

    // count the number of rows in the database
    // const count = await db.query(`SELECT COUNT(*) as count FROM chinh_phu_ngam`);
    const jsonLVTRawText = await parseStringPromise(data[0].text);
    const jsonLVTText = await parseStringPromise(
      data[0].text.replace(/<seg[^>]*>(.*?)<\/seg>/g, "$1")
    );

    returnData = {
      // count: count[0][0].count,
      count: 64,
      rawText: jsonLVTRawText,
      text: jsonLVTText,
    };

    return NextResponse.json(returnData);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
