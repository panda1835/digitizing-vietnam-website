import { nomVariantsSchema } from "@/lib/kieu/schemas";
import { nomVariants } from "@/lib/kieu/research";
import { readBody, researchResponse } from "@/lib/kieu/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  return researchResponse(async () =>
    nomVariants(nomVariantsSchema.parse(await readBody(request)))
  );
}
