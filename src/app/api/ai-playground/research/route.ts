import { researchRequestSchema } from "@/lib/kieu/schemas";
import { executeResearch } from "@/lib/kieu/research";
import { readBody, researchResponse } from "@/lib/kieu/http";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return researchResponse(async () =>
    executeResearch(researchRequestSchema.parse(await readBody(request)))
  );
}
