import { NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";
import db from "@/lib/db";

// Cache dictionary results on the edge for 1 hour
export const revalidate = 3600;

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

    // Nguyen Trai Quoc Am Tu Dien
    let qatdData;

    const lowerQuery = query.toLowerCase();
    const regexPattern = `(^|[^\\w])${lowerQuery}([^\\w]|$)`;

    [qatdData] = await db.query(
      `SELECT * FROM nt_qatd WHERE 
            LOWER(han) = CONVERT(? USING utf8mb4) OR 
            LOWER(nom) = CONVERT(? USING utf8mb4) OR 
            LOWER(hdwd) REGEXP CONVERT(? USING utf8mb4)`,
      [lowerQuery, lowerQuery, regexPattern]
    );

    const meaning = await Promise.all(
      (qatdData as Array<any>).map(async (row) => {
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

    // Taberd Dictionary
    let taberdData;
    try {
      [taberdData] = await db.query(
        `SELECT * FROM taberd_quoc_ngu WHERE (LOWER(nom) = ? OR LOWER(qn) = ?)`,
        [query.toLowerCase(), query.toLowerCase()]
      );
    } catch (error) {
      [taberdData] = await db.query(
        `SELECT * FROM taberd_quoc_ngu WHERE (LOWER(nom) = CONVERT(? USING utf8mb4) OR LOWER(qn) = CONVERT(? USING utf8mb4))`,
        [query.toLowerCase(), query.toLowerCase()]
      );
    }

    const response = NextResponse.json(
      {
        tdcndg: { defs: defData, refs: [] },
        giupdoc: returnData,
        qatd: meaning,
        taberd: taberdData,
      },
      { status: 200 }
    );

    // Add CORS headers for Chrome extension
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    // Add cache headers for CDN/browser caching (1 hour)
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=86400"
    );

    return response;
  } catch (error) {
    const errorResponse = NextResponse.json(
      { error: error.message },
      { status: 500 }
    );

    // Add CORS headers to error response too
    errorResponse.headers.set("Access-Control-Allow-Origin", "*");
    errorResponse.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    errorResponse.headers.set("Access-Control-Allow-Headers", "Content-Type");

    return errorResponse;
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS(request) {
  const response = new NextResponse(null, { status: 200 });

  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type");

  return response;
}
