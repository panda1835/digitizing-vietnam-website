import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q");
    const index = searchParams.get("id");

    let data;
    if (query) {
      const lowerQuery = query.toLowerCase();
      const regexPattern = `(^|[^\\w])${lowerQuery}([^\\w]|$)`;
      try {
        [data] = await db.query(
          `SELECT * FROM nt_qatd WHERE 
            LOWER(han) = CONVERT(? USING utf8mb4) OR 
            LOWER(nom) = CONVERT(? USING utf8mb4) OR 
            LOWER(hdwd) REGEXP ?`,
          [lowerQuery, lowerQuery, regexPattern]
        );
      } catch (error) {
        [data] = await db.query(
          `SELECT * FROM nt_qatd WHERE 
            LOWER(han) = CONVERT(? USING utf8mb4) OR 
            LOWER(nom) = CONVERT(? USING utf8mb4) OR 
            LOWER(hdwd) REGEXP CONVERT(? USING utf8mb4)`,
          [lowerQuery, lowerQuery, regexPattern]
        );
      }
    } else if (index) {
      [data] = await db.query(
        `SELECT * FROM nt_qatd WHERE 
          id IN (?)`,
        [index.split(",")]
      );
    } else {
      return NextResponse.json(
        { error: "Missing query or index" },
        { status: 400 }
      );
    }

    const meaning = await Promise.all(
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

    // Order the results by hdwd length
    meaning.sort((a, b) => {
      const aLength = a.hdwd ? a.hdwd.length : 0;
      const bLength = b.hdwd ? b.hdwd.length : 0;
      return aLength - bLength; // Sort ascending by length
    });

    return NextResponse.json(meaning, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
