import { NextResponse } from "next/server";

import { fetcher } from "@/lib/api";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const params = new URLSearchParams(searchParams);
  const queryString = params.toString();
  const url = `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/about-us?${queryString}`;

  const data = await fetcher(url);

  return NextResponse.json({ data: data.data }, { status: 200 });
}
