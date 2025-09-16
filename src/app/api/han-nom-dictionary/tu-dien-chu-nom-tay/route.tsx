import { NextResponse } from "next/server";
import db from "@/lib/db";
import { parseStringPromise } from "xml2js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q");

    let data;
    if (query) {
      const lowerQuery = query.toLowerCase();
      try {
        [data] = await db.query(
          `SELECT * FROM tdcnt WHERE 
            (LOWER(hdwd_tay) = ? OR LOWER(hdwd_tay) REGEXP CONCAT('(^|[[:space:]])', ?, '([[:space:]]|$)')) OR 
            (LOWER(hdwd_nom) = CONVERT(? USING utf8mb4) OR LOWER(hdwd_nom) REGEXP CONCAT('(^|[[:space:]])', CONVERT(? USING utf8mb4), '([[:space:]]|$)'))`,
          [lowerQuery, lowerQuery, lowerQuery, lowerQuery]
        );
      } catch (error) {
        [data] = await db.query(
          `SELECT * FROM tdcnt WHERE 
            (LOWER(hdwd_tay) = CONVERT(? USING utf8mb4) OR LOWER(hdwd_tay) REGEXP CONCAT('(^|[[:space:]])', CONVERT(? USING utf8mb4), '([[:space:]]|$)')) OR 
            (LOWER(hdwd_nom) = CONVERT(? USING utf8mb4) OR LOWER(hdwd_nom) REGEXP CONCAT('(^|[[:space:]])', CONVERT(? USING utf8mb4), '([[:space:]]|$)'))`,
          [lowerQuery, lowerQuery, lowerQuery, lowerQuery]
        );
      }
    } else {
      return NextResponse.json({ error: "Missing query" }, { status: 400 });
    }

    const meaning = await Promise.all(
      (data as Array<any>).map(async (row) => {
        const parsedCitations = await parseStringPromise(row.citations);
        return {
          tay: row.hdwd_tay,
          nom: row.hdwd_nom,
          sense: row.sense,
          citations: parsedCitations,
          indexedWords: row.indexedWords,
          note: row.note,
        };
      })
    );

    return NextResponse.json(meaning, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
