import { listEditions } from "@/lib/kieu/research";
import { researchResponse } from "@/lib/kieu/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  return researchResponse(listEditions);
}
