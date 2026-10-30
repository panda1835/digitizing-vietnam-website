import {
  CalendarEvent,
  CmsEvent,
  EVENT_TIME_ZONE,
  eventDay,
  normalizeCmsEvent,
} from "./events";

export interface EventMonthQuery {
  month: string;
  timeZone?: string;
}

export function eventMonthFilters(month: string): Record<string, string> {
  if (!/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(month))
    throw new RangeError("Invalid event month");
  const [year, number] = month.split("-").map(Number);
  // Source and display timezones can put an instant on different dates.
  // Fetch a two-day boundary margin, then filter exact overlap after conversion.
  const first = new Date(Date.UTC(year, number - 1, -1))
    .toISOString()
    .slice(0, 10);
  const last = new Date(Date.UTC(year, number, 2)).toISOString().slice(0, 10);
  return {
    "filters[$and][0][start_date][$lte]": last,
    "filters[$and][1][$or][0][end_date][$gte]": first,
    "filters[$and][1][$or][1][$and][0][end_date][$null]": "true",
    "filters[$and][1][$or][1][$and][1][start_date][$gte]": first,
  };
}

export async function fetchEvents(
  locale: string,
  monthQuery?: EventMonthQuery
): Promise<CalendarEvent[] | null> {
  const events: CalendarEvent[] = [];
  try {
    let page = 1;
    let pageCount = 1;
    do {
      const query = new URLSearchParams({
        locale,
        "sort[0]": "start_date:asc",
        "sort[1]": "start_time:asc",
        "populate[timezone][fields][0]": "name",
        "populate[timezone][fields][1]": "identifier",
        "populate[thumbnail]": "true",
        "pagination[page]": String(page),
        "pagination[pageSize]": "100",
        ...(monthQuery ? eventMonthFilters(monthQuery.month) : {}),
      });
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_STRAPI_API_URL}/api/events?${query}`,
        { next: { revalidate: 1800 } }
      );
      if (!response.ok)
        throw new Error(`Events CMS returned ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data.data)) throw new Error("Invalid events response");
      events.push(
        ...data.data
          .map((event: CmsEvent) => normalizeCmsEvent(event))
          .filter(
            (event: CalendarEvent | null): event is CalendarEvent =>
              event !== null
          )
      );
      pageCount = data.meta?.pagination?.pageCount ?? 1;
      page += 1;
    } while (page <= pageCount);
    const filteredEvents = monthQuery
      ? events.filter((event) => {
          const zone = monthQuery.timeZone ?? EVENT_TIME_ZONE;
          const lastDay = new Date(
            Date.UTC(
              Number(monthQuery.month.slice(0, 4)),
              Number(monthQuery.month.slice(5)),
              0
            )
          ).getUTCDate();
          return (
            eventDay(event.start_date_time, zone) <=
              `${monthQuery.month}-${lastDay}` &&
            eventDay(
              event.end_date_time
                ? new Date(Date.parse(event.end_date_time) - 1)
                : event.start_date_time,
              zone
            ) >= `${monthQuery.month}-01`
          );
        })
      : events;
    return filteredEvents.sort(
      (a, b) => Date.parse(a.start_date_time) - Date.parse(b.start_date_time)
    );
  } catch (error) {
    console.error("Unable to load homepage events", error);
    return null;
  }
}
