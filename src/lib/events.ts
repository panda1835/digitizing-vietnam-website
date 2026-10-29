export const EVENT_TIME_ZONE = "Asia/Ho_Chi_Minh";

export function normalizeTimeZone(timeZone: string): string {
  return timeZone === "Asia/Saigon" ? EVENT_TIME_ZONE : timeZone;
}

/** Call after mounting so browser detection cannot cause an SSR hydration mismatch. */
export function detectBrowserTimeZone(): string {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone) return EVENT_TIME_ZONE;
    new Intl.DateTimeFormat("en-US", { timeZone });
    return normalizeTimeZone(timeZone);
  } catch {
    return EVENT_TIME_ZONE;
  }
}

export interface CalendarEvent {
  documentId: string;
  title: string;
  description: string | null;
  // UTC instants after converting the CMS's local date/time fields once at fetch time.
  start_date_time: string;
  end_date_time: string | null;
  location: string | null;
  meeting_link: string | null;
  participation_mode: string | null;
  updatedAt: string;
  timezone?: { name: string; identifier: string } | null;
  thumbnail?: {
    url: string;
    alternativeText?: string | null;
    width?: number;
    height?: number;
    formats?: Record<string, { url: string; width: number; height: number }>;
  } | null;
}

export type CmsEvent = Omit<
  CalendarEvent,
  "start_date_time" | "end_date_time"
> & {
  start_date: string;
  start_time: string;
  end_date: string | null;
  end_time: string | null;
};

export function getEventTimeZone(event: Pick<CalendarEvent, "timezone">) {
  const zone = event.timezone;
  if (!zone?.identifier) return null;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone.identifier });
    return { ...zone, identifier: normalizeTimeZone(zone.identifier) };
  } catch {
    return null;
  }
}

/** Resolve an offset-free local date/time using the event's IANA timezone. */
export function cmsLocalTimeToUtc(value: string, timeZone: string): string {
  const match =
    /^(\d{4}-\d{2}-\d{2})T((?:[01]\d|2[0-3]):[0-5]\d):([0-5]\d)(\.\d{1,3})?$/.exec(
      value
    );
  if (!match) throw new RangeError("Invalid CMS event time");
  const local = Date.parse(
    `${match[1]}T${match[2]}:${match[3] ?? "00"}${match[4] ?? ""}Z`
  );
  if (
    !Number.isFinite(local) ||
    new Date(local).toISOString().slice(0, 10) !== match[1]
  )
    throw new RangeError("Invalid CMS event time");
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const offsetAt = (instant: number) => {
    const parts = formatter.formatToParts(new Date(instant));
    const part = (name: string) =>
      Number(parts.find((item) => item.type === name)?.value);
    return (
      Date.UTC(
        part("year"),
        part("month") - 1,
        part("day"),
        part("hour"),
        part("minute"),
        part("second")
      ) -
      Math.floor(instant / 1000) * 1000
    );
  };
  // Check offsets on both sides of a possible DST transition. For a repeated
  // clock time choose the first occurrence; reject times skipped by the clock.
  const offsets = Array.from(
    new Set([-1, 0, 1].map((day) => offsetAt(local + day * 86400000)))
  );
  const candidates = offsets
    .map((offset) => local - offset)
    .filter((instant) => instant + offsetAt(instant) === local)
    .sort((a, b) => a - b);
  if (!candidates.length)
    throw new RangeError("CMS event time does not exist in its timezone");
  return new Date(candidates[0]).toISOString();
}

/** Convert the CMS's separate date/time fields once, before display or export. */
export function normalizeCmsEvent(event: CmsEvent): CalendarEvent | null {
  try {
    if (
      !event.documentId ||
      !event.title ||
      !Number.isFinite(Date.parse(event.updatedAt))
    )
      return null;
    const zone = getEventTimeZone(event);
    if (!zone || !event.start_date || !event.start_time) return null;
    if (Boolean(event.end_date) !== Boolean(event.end_time)) return null;
    const start = cmsLocalTimeToUtc(
      `${event.start_date}T${event.start_time}`,
      zone.identifier
    );
    const end =
      event.end_date && event.end_time
        ? cmsLocalTimeToUtc(
            `${event.end_date}T${event.end_time}`,
            zone.identifier
          )
        : null;
    if (end && Date.parse(end) <= Date.parse(start)) return null;
    return { ...event, start_date_time: start, end_date_time: end };
  } catch {
    return null;
  }
}

export function getUpcomingEvent(
  events: CalendarEvent[],
  now: Date
): CalendarEvent | null {
  return (
    events
      .filter((event) => Date.parse(event.start_date_time) >= now.getTime())
      .sort(
        (a, b) => Date.parse(a.start_date_time) - Date.parse(b.start_date_time)
      )[0] ?? null
  );
}

export function getUpcomingEvents(
  events: CalendarEvent[],
  now: Date
): CalendarEvent[] {
  return events
    .filter((event) => Date.parse(event.start_date_time) >= now.getTime())
    .sort(
      (a, b) => Date.parse(a.start_date_time) - Date.parse(b.start_date_time)
    )
    .slice(0, 3);
}

export function isPastEvent(event: CalendarEvent, now: Date): boolean {
  return (
    Date.parse(event.end_date_time ?? event.start_date_time) <= now.getTime()
  );
}

export function sortCalendarEvents(
  events: CalendarEvent[],
  now: Date
): CalendarEvent[] {
  return [...events].sort((a, b) => {
    const aPast = isPastEvent(a, now);
    const bPast = isPastEvent(b, now);
    if (aPast !== bPast) return aPast ? 1 : -1;
    const difference =
      Date.parse(a.start_date_time) - Date.parse(b.start_date_time);
    return aPast ? -difference : difference;
  });
}

export function eventDay(
  value: string | Date,
  timeZone = EVENT_TIME_ZONE
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  return ["year", "month", "day"]
    .map((type) => parts.find((part) => part.type === type)?.value)
    .join("-");
}

export function eventOccursOn(
  event: CalendarEvent,
  day: string,
  timeZone = EVENT_TIME_ZONE
): boolean {
  // DTEND is exclusive, including when an event ends exactly at midnight.
  const end = event.end_date_time && new Date(event.end_date_time).getTime();
  return (
    eventDay(event.start_date_time, timeZone) <= day &&
    eventDay(end ? new Date(end - 1) : event.start_date_time, timeZone) >= day
  );
}

export function formatEventTime(
  value: string,
  language: string,
  timeZone = EVENT_TIME_ZONE
): string {
  const date = new Date(value);
  const offset = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
  })
    .formatToParts(date)
    .find((part) => part.type === "timeZoneName")
    ?.value.replace("GMT", "UTC");
  return (
    new Intl.DateTimeFormat(language, {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone,
    }).format(date) + ` (${offset})`
  );
}

export function safeEventUrl(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

const icsDate = (value: string | Date) =>
  new Date(value)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");

const icsText = (value: string) =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");

// RFC 5545 limits content lines to 75 octets, including continuation spaces.
function foldLine(line: string): string {
  const encoder = new TextEncoder();
  let result = "";
  let size = 0;
  for (const character of line) {
    const bytes = encoder.encode(character).length;
    if (size + bytes > 75) {
      result += "\r\n ";
      size = 1;
    }
    result += character;
    size += bytes;
  }
  return result;
}

/** description is plain text, converted from the CMS HTML by the caller. */
export function createEventIcs(
  event: CalendarEvent,
  description: string
): string {
  const url = safeEventUrl(event.meeting_link);
  const details = [description, url].filter(Boolean).join("\n\n");
  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Digitizing Vietnam//Events//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${icsText(event.documentId)}@digitizingvietnam.com`,
      `DTSTAMP:${icsDate(event.updatedAt)}`,
      `DTSTART:${icsDate(event.start_date_time)}`,
      ...(event.end_date_time ? [`DTEND:${icsDate(event.end_date_time)}`] : []),
      `SUMMARY:${icsText(event.title)}`,
      ...(details ? [`DESCRIPTION:${icsText(details)}`] : []),
      ...(event.location ? [`LOCATION:${icsText(event.location)}`] : []),
      ...(url ? [`URL:${icsText(url)}`] : []),
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .map(foldLine)
      .join("\r\n") + "\r\n"
  );
}
