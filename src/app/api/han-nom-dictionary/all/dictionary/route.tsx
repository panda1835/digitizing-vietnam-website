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
    let defsRows: any = [];
    try {
      [defsRows] = await db.query(
        `SELECT * FROM tdcndg WHERE (LOWER(qn) = ? OR LOWER(hn) = ?)`,
        [query.toLowerCase(), query.toLowerCase()]
      );
    } catch (error) {
      [defsRows] = await db.query(
        // Convert the query using utf8mb4 encoding to prevent
        // Illegal mix of collations (utf8mb3_bin,IMPLICIT) and (utf8mb4_unicode_ci,COERCIBLE)
        `SELECT * FROM tdcndg WHERE (LOWER(qn) = CONVERT(? USING utf8mb4) OR LOWER(hn) = CONVERT(? USING utf8mb4))`,
        [query.toLowerCase(), query.toLowerCase()]
      );
    }

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
    let data: any = [];
    try {
      [data] = await db.query(
        `SELECT * FROM giupdoc WHERE (LOWER(qn) = ? OR LOWER(uni) = ?)`,
        [query.toLowerCase(), query.toLowerCase()]
      );
    } catch (error) {
      [data] = await db.query(
        `SELECT * FROM giupdoc WHERE (LOWER(qn) = CONVERT(? USING utf8mb4) OR LOWER(uni) = CONVERT(? USING utf8mb4))`,
        [query.toLowerCase(), query.toLowerCase()]
      );
    }

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
    let qatdData: any = [];
    const lowerQuery = query.toLowerCase();
    const regexPattern = `(^|[^\\w])${lowerQuery}([^\\w]|$)`;

    try {
      [qatdData] = await db.query(
        `SELECT * FROM nt_qatd WHERE 
              LOWER(han) = ? OR 
              LOWER(nom) = ? OR 
              LOWER(hdwd) REGEXP ?`,
        [lowerQuery, lowerQuery, regexPattern]
      );
    } catch (error) {
      [qatdData] = await db.query(
        `SELECT * FROM nt_qatd WHERE 
              LOWER(han) = CONVERT(? USING utf8mb4) OR 
              LOWER(nom) = CONVERT(? USING utf8mb4) OR 
              LOWER(hdwd) REGEXP CONVERT(? USING utf8mb4)`,
        [lowerQuery, lowerQuery, regexPattern]
      );
    }

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
    let taberdData: any = [];
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

    // Nhat Dung Thuong Dam Dictionary
    let ndtdData: any = [];
    try {
      [ndtdData] = await db.query(
        `SELECT * FROM ndtd_dic WHERE (LOWER(han_nom) = ? OR LOWER(han_viet) = ? OR LOWER(quoc_ngu) REGEXP ?)`,
        [
          query.toLowerCase(),
          query.toLowerCase(),
          `(^|[^a-zA-Z])${query.toLowerCase()}([^a-zA-Z]|$)`,
        ]
      );
    } catch (error) {
      [ndtdData] = await db.query(
        `SELECT * FROM ndtd_dic WHERE (LOWER(han_nom) = CONVERT(? USING utf8mb4) OR LOWER(han_viet) = CONVERT(? USING utf8mb4))`,
        [query.toLowerCase(), query.toLowerCase()]
      );
    }

    return NextResponse.json(
      {
        tdcndg: { defs: defData || [], refs: [] },
        giupdoc: returnData || [],
        qatd: meaning || [],
        taberd: taberdData || [],
        ndtd: ndtdData || [],
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
