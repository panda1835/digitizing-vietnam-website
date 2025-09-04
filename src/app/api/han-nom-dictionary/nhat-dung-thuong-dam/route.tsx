import { NextResponse } from "next/server";
import { parseStringPromise } from "xml2js";
import db from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const query = searchParams.get("q");
    const tocId = searchParams.get("toc");

    if (!query && !tocId) {
      return NextResponse.json(
        { error: "Missing query or toc" },
        { status: 400 }
      );
    }

    if (tocId) {
      if (Number(tocId) < 1 || Number(tocId) > 32) {
        return NextResponse.json({ error: "Invalid content" }, { status: 400 });
      }
      const tocData = await db.query(
        `SELECT * FROM ndtd_dic WHERE ma_loai = ?`,
        [tocId]
      );
      return NextResponse.json(tocData[0], { status: 200 });
    }
    let data;

    if (query) {
      try {
        [data] = await db.query(
          `SELECT * FROM ndtd_dic WHERE (LOWER(han_nom) = ? OR LOWER(han_viet) = ? OR LOWER(quoc_ngu) REGEXP ?)`,
          [
            query.toLowerCase(),
            query.toLowerCase(),
            `(^|[^a-zA-Z])${query.toLowerCase()}([^a-zA-Z]|$)`,
          ]
        );
      } catch (error) {
        [data] = await db.query(
          `SELECT * FROM ndtd_dic WHERE (LOWER(han_nom) = CONVERT(? USING utf8mb4) OR LOWER(han_viet) = CONVERT(? USING utf8mb4))`,
          [query.toLowerCase(), query.toLowerCase()]
        );
      }
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
