import { concordanceSchema } from "@/lib/kieu/schemas";
import { concordance } from "@/lib/kieu/research";
import { readBody, researchResponse } from "@/lib/kieu/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  return researchResponse(async () =>
    concordance(concordanceSchema.parse(await readBody(request)))
  );
}
