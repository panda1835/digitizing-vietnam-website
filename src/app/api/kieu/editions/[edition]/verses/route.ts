import { editionSchema, versesSchema } from "@/lib/kieu/schemas";
import { getVerses } from "@/lib/kieu/research";
import { queryInput, researchResponse } from "@/lib/kieu/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  { params }: { params: { edition: string } }
) {
  return researchResponse(() =>
    getVerses(
      editionSchema.parse(params.edition),
      versesSchema.parse(queryInput(request))
    )
  );
}
