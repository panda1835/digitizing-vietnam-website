import { editionSchema, frequenciesSchema } from "@/lib/kieu/schemas";
import { frequencies } from "@/lib/kieu/research";
import { queryInput, researchResponse } from "@/lib/kieu/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: { edition: string } }
) {
  return researchResponse(() =>
    frequencies(
      editionSchema.parse(params.edition),
      frequenciesSchema.parse(queryInput(request))
    )
  );
}
