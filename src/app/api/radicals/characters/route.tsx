import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const radicalURN = searchParams.get("radical");

    if (!radicalURN) {
      return NextResponse.json(
        { error: "Missing radical parameter" },
        { status: 400 }
      );
    }

    // Format radical number as 3 digits (e.g., "001", "002", "030")
    const formattedRadical = radicalURN.padStart(3, "0");

    // Get characters that use this radical, grouped by stroke count
    // Join with tdcndg table to only get characters that exist in the dictionary
    // Use CAST to compare as numbers to handle both "1" and "001" formats
    const [characters] = await db.query(
      `SELECT n.nom, n.kSUnicode as strokes, n.kDefinition as definition
       FROM nom n
       INNER JOIN tdcndg t ON n.nom = t.hn
       WHERE CAST(n.kRUnicode AS UNSIGNED) = ? OR CAST(n.kRKangxi AS UNSIGNED) = ?
       ORDER BY CAST(n.kSUnicode AS UNSIGNED), n.nom`,
      [parseInt(radicalURN), parseInt(radicalURN)]
    );

    // Group by stroke count and remove duplicates
    const groupedByStrokes: Record<string, any[]> = {};
    (characters as Array<any>).forEach((char) => {
      const strokes = char.strokes || "0";
      if (!groupedByStrokes[strokes]) {
        groupedByStrokes[strokes] = [];
      }
      // Check if character already exists in this stroke group
      const exists = groupedByStrokes[strokes].some((c) => c.nom === char.nom);
      if (!exists) {
        groupedByStrokes[strokes].push(char);
      }
    });

    return NextResponse.json(groupedByStrokes, { status: 200 });
  } catch (error) {
    console.error("Error fetching characters:", error);
    return NextResponse.json(
      { error: "Failed to fetch characters" },
      { status: 500 }
    );
  }
}
