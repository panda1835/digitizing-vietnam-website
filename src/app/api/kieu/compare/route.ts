import { compareSchema } from "@/lib/kieu/schemas";
import { compare } from "@/lib/kieu/research";
import { readBody, researchResponse } from "@/lib/kieu/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  return researchResponse(async () =>
    compare(compareSchema.parse(await readBody(request)))
  );
}
