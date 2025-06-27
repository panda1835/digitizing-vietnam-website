import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const [data] = await db.query(`SELECT * FROM nt_qatd_index`);

    const list = await Promise.all(
      (data as Array<any>).map(async (row) => {
        return {
          item: row.item,
          location: row.location_ids.split(",").map((id) => parseInt(id, 10)),
        };
      })
    );

    // Order the results by first letter of item
    list.sort((a, b) => {
      const aFirstLetter = a.item.charAt(0).toLowerCase();
      const bFirstLetter = b.item.charAt(0).toLowerCase();
      return aFirstLetter.localeCompare(bFirstLetter);
    });

    return NextResponse.json(list, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
