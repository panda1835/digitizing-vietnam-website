import { NextRequest, NextResponse } from "next/server";
import { fetchEvents } from "@/lib/fetch-events";
import { EVENT_TIME_ZONE } from "@/lib/events";

export const revalidate = 1800;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const locale = params.get("locale") ?? "en";
  const month = params.get("month") ?? "";
  const timeZone = params.get("timezone") ?? EVENT_TIME_ZONE;
  if (
    !["en", "vi"].includes(locale) ||
    !/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(month)
  ) {
    return NextResponse.json(
      { error: "Invalid locale or month" },
      { status: 400 }
    );
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
  } catch {
    return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
  }
  const events = await fetchEvents(locale, { month, timeZone });
  return NextResponse.json(
    { events },
    {
      status: events === null ? 502 : 200,
      headers: {
        "Cache-Control":
          events === null ? "no-store" : "public, max-age=1800, s-maxage=1800",
      },
    }
  );
}
