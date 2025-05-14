import { NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";
import db from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = searchParams.get("page");
    let returnData = {};

    // const xmlDictionaryData = await fs.readFile(
    //   path.join(process.cwd(), `data/luc-van-tien/Luc_Van_Tien.xml`),
    //   "utf-8"
    // );

    const [data]: any = await db.query(
      `SELECT * FROM luc_van_tien WHERE (textNo = ?)`,
      [page]
    );

    // count the number of rows in the database
    // const count = await db.query(`SELECT COUNT(*) as count FROM luc_van_tien`);
    const jsonLVTRawText = await parseStringPromise(data[0].text);
    const jsonLVTText = await parseStringPromise(
      data[0].text.replace(/<seg[^>]*>(.*?)<\/seg>/g, "$1")
    );

    returnData = {
      // count: count[0][0].count,
      count: 104,
      rawText: jsonLVTRawText,
      text: jsonLVTText,
    };

    return NextResponse.json(returnData);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
