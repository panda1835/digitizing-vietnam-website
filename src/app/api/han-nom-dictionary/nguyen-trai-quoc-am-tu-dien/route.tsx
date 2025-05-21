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
      `SELECT * FROM nt_qatd WHERE 
      (LOWER(han) = CONVERT(? USING utf8mb4) OR 
      LOWER(nom) = CONVERT(? USING utf8mb4) OR 
      LOWER(hdwd) = CONVERT(? USING utf8mb4))`,
      [query.toLowerCase(), query.toLowerCase(), query.toLowerCase()]
    );

    const returnData = await Promise.all(
      (data as Array<any>).map(async (row) => {
        // Parse the XML string
        // const parsedEtym = await parseStringPromise(row.etym);
        // const parsedText = await parseStringPromise(row.sense_area);
        return {
          han: row.han,
          nom: row.nom,
          hdwd: row.hdwd,
          etym: row.etym,
          text: row.sense_area,
        };
      })
    );

    return NextResponse.json(returnData, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
