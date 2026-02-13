import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Validate the revalidation secret
  const secret = request.headers.get("x-revalidation-secret");

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json(
      { message: "Invalid revalidation secret" },
      { status: 401 }
    );
  }

  try {
    // Parse the request body for logging purposes
    const body = await request.json().catch(() => ({}));
    const { model, entry } = body as { model?: string; entry?: { id?: number } };

    // Revalidate the entire site layout — this purges all cached pages
    revalidatePath("/", "layout");

    console.log(
      `[Revalidation] Triggered by Strapi webhook — model: ${model || "unknown"}, entry ID: ${entry?.id || "unknown"}`
    );

    return NextResponse.json({
      revalidated: true,
      message: `Revalidation triggered successfully`,
      model: model || "unknown",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Revalidation] Error:", error);
    return NextResponse.json(
      { message: "Error revalidating", error: String(error) },
      { status: 500 }
    );
  }
}
