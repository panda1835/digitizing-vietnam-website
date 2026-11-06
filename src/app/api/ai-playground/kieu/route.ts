import { NextResponse } from "next/server";
import { dataRequestSchema } from "@/lib/ai-playground/contracts";
import { executeDataRequest, getSnapshot } from "@/lib/ai-playground/kieu";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  try {
    if (params.get("method") === "snapshot") {
      return NextResponse.json(await getSnapshot());
    }
    const method = params.get("method");
    const input =
      method === "listVersions"
        ? { method }
        : method === "getPage"
        ? {
            method,
            version: params.get("version"),
            page: Number(params.get("page")),
          }
        : {
            method,
            version: params.get("version"),
            query: params.get("query"),
          };
    const parsed = dataRequestSchema.safeParse(input);
    if (!parsed.success)
      return NextResponse.json(
        { error: "invalid-data-request" },
        { status: 400 }
      );
    return NextResponse.json(await executeDataRequest(parsed.data));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof RangeError ? "invalid-page" : "data-unavailable",
      },
      { status: error instanceof RangeError ? 400 : 503 }
    );
  }
}
