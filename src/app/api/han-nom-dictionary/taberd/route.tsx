import { NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";
import db from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q");

    let data;

    if (query) {
      try {
        [data] = await db.query(
          `SELECT * FROM taberd_quoc_ngu WHERE (LOWER(nom) = ? OR LOWER(qn) = ?)`,
          [query.toLowerCase(), query.toLowerCase()]
        );
      } catch (error) {
        [data] = await db.query(
          `SELECT * FROM taberd_quoc_ngu WHERE (LOWER(nom) = CONVERT(? USING utf8mb4) OR LOWER(qn) = CONVERT(? USING utf8mb4))`,
          [query.toLowerCase(), query.toLowerCase()]
        );
      }
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
