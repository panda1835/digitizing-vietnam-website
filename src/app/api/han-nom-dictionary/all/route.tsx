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

    // Tu Dien Chu Nom Dan Giai
    const [defsRows]: any = await db.query(
      // Convert the query using utf8mb4 encoding to prevent
      // Illegal mix of collations (utf8mb3_bin,IMPLICIT) and (utf8mb4_unicode_ci,COERCIBLE)
      `SELECT * FROM tdcndg WHERE (LOWER(qn) = CONVERT(? USING utf8mb4) OR LOWER(hn) = CONVERT(? USING utf8mb4))`,
      [query.toLowerCase(), query.toLowerCase()]
    );

    const defData = await Promise.all(
      (defsRows as Array<any>).map(async (row) => {
        // Parse the XML string in the "defs" column
        const parsedData = await parseStringPromise(row.defs);
        return {
          hn: row.hn,
          qn: row.qn,
          derivations: parsedData.derivations,
        };
      })
    );

    // let refData = [];
    // if (defData.length > 0) {
    //   const [refs]: any = await db.query(`SELECT * FROM tdcndg_refs`);

    //   refData = JSON.parse(JSON.stringify(refs));
    // }

    // Giup Doc Nom Va Han Viet
    const [data]: any = await db.query(
      `SELECT * FROM giupdoc WHERE (LOWER(qn) = CONVERT(? USING utf8mb4) OR LOWER(uni) = CONVERT(? USING utf8mb4))`,
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

    return NextResponse.json(
      { tdcndg: { defs: defData, refs: [] }, giupdoc: returnData },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
