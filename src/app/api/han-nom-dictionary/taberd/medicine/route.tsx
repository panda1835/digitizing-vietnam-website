import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ma_tu = searchParams.get("ma_tu") || "";
    let data;

    try {
      if (ma_tu) {
        [data] = await db.query(
          `SELECT * FROM taberd_medicine WHERE ma_tu = ?`,
          [ma_tu]
        );
      } else {
        [data] = await db.query(`SELECT * FROM taberd_medicine`, []);
      }
    } catch (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
