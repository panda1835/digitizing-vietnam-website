import { NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";
import db from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const [data]: any = await db.query(
      `SELECT * FROM giupdoc WHERE (LOWER(qn) = ? OR LOWER(uni) = ?)`,
      [query.toLowerCase(), query.toLowerCase()]
    );

    const returnData = await Promise.all(
      (data as Array<any>).map(async (row) => {
        // Parse the XML string
        const parsedPinyin = await parseStringPromise(row.pinyin);
        const parsedText = await parseStringPromise(row.text);
        return {
          qn: row.qn,
          uni: row.uni,
          pinyin: parsedPinyin,
          text: parsedText,
        };
      })
    );

    return NextResponse.json(returnData, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
