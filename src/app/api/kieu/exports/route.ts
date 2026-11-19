import { exportSchema } from "@/lib/kieu/schemas";
import { exportResearch } from "@/lib/kieu/exports";
import { readBody, researchResponse } from "@/lib/kieu/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  return researchResponse(async () =>
    exportResearch(exportSchema.parse(await readBody(request)))
  );
}
