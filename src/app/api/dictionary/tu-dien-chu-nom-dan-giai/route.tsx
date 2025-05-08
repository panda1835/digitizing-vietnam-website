import { NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";
import db from "@/lib/db";
import { json } from "stream/consumers";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const [defsRows]: any = await db.query(
      `SELECT * FROM tdcndg WHERE (LOWER(hn) LIKE ? OR LOWER(qn) LIKE ?)`,
      [`%${query.toLowerCase()}%`, `%${query.toLowerCase()}%`]
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

    const [refs]: any = await db.query(`SELECT * FROM tdcndg_refs`);

    const refData = JSON.parse(JSON.stringify(refs));

    return NextResponse.json({ defs: defData, refs: refData }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
