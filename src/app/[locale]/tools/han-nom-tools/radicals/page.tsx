import RadicalsClient from "./RadicalsClient";
import db from "@/lib/db";

interface Radical {
  id: number;
  hn: string;
  URN: string;
  strokes: number;
  name: string;
  definition: string;
}

async function getRadicals(): Promise<Radical[]> {
  try {
    const [radicals] = await db.query(
      `SELECT id, hn, URN, strokes, name, definition 
       FROM radicals 
       ORDER BY CAST(URN AS UNSIGNED)`
    );
    return radicals as Radical[];
  } catch (error) {
    console.error("Error fetching radicals:", error);
    return [];
  }
}

export default async function RadicalsPage() {
  const radicals = await getRadicals();

  return (
    <div className="my-20">
      <RadicalsClient initialRadicals={radicals} />
    </div>
  );
}
