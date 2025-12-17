import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  try {
    const [radicals] = await db.query(
      `SELECT id, hn, URN, strokes, name, definition 
       FROM radicals 
       ORDER BY CAST(URN AS UNSIGNED)`
    );

    return NextResponse.json(radicals, { status: 200 });
  } catch (error) {
    console.error("Error fetching radicals:", error);
    return NextResponse.json(
      { error: "Failed to fetch radicals" },
      { status: 500 }
    );
  }
}
