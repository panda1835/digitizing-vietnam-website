"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Download, MapPin } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarEvent,
  EVENT_TIME_ZONE,
  createEventIcs,
  eventDay,
  eventOccursOn,
  formatEventTime,
  getEventTimeZone,
  safeEventUrl,
  isPastEvent,
  sortCalendarEvents,
} from "@/lib/events";

export default function EventsCalendar({
  events: initialEvents,
  locale,
  now,
  initialMonth,
}: {
  events: CalendarEvent[] | null;
  locale: string;
  now: string;
  initialMonth?: string;
}) {
  const vi = locale === "vi";
  const language = vi ? "vi-VN" : "en-US";
  const [currentTime, setCurrentTime] = useState(now);
  useEffect(() => {
    setCurrentTime(new Date().toISOString());
    const timer = setInterval(
      () => setCurrentTime(new Date().toISOString()),
      60000
    );
    return () => clearInterval(timer);
  }, []);
  const [timeZone, setTimeZone] = useState(EVENT_TIME_ZONE);
  const initialDisplayMonth = initialMonth ?? eventDay(now).slice(0, 7);
  const [month, setMonth] = useState(initialDisplayMonth);
  const requestKey = `${locale}/${month}/${timeZone}`;
  const [result, setResult] = useState({
    key: `${locale}/${initialDisplayMonth}/${EVENT_TIME_ZONE}`,
    events: initialEvents,
    pending: false,
  });
  const events = useMemo(
    () => (result.key === requestKey ? result.events : []),
    [result, requestKey]
  );
  const loading = result.key !== requestKey || result.pending;
  const firstRequest = useRef(true);
  useEffect(() => {
    if (firstRequest.current) {
      firstRequest.current = false;
      return;
    }
    const controller = new AbortController();
    const key = `${locale}/${month}/${timeZone}`;
    setResult({ key, events: [], pending: true });
    const query = new URLSearchParams({ locale, month, timezone: timeZone });
    fetch(`/api/events?${query}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load events");
        const data = await response.json();
        if (!Array.isArray(data.events))
          throw new Error("Invalid events response");
        if (!controller.signal.aborted)
          setResult({ key, events: data.events, pending: false });
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setResult({ key, events: null, pending: false });
      });
    return () => controller.abort();
  }, [locale, month, timeZone]);
  const [timeZones, setTimeZones] = useState([
    EVENT_TIME_ZONE,
    "UTC",
    "America/New_York",
    "America/Los_Angeles",
    "Europe/London",
    "Asia/Tokyo",
    "Australia/Sydney",
  ]);
  const today = eventDay(currentTime, timeZone);
  const cmsTimeZones = useMemo(
    () =>
      new Map(
        (events ?? []).flatMap((event) => {
          const zone = getEventTimeZone(event);
          return zone ? [[zone.identifier, zone.name] as const] : [];
        })
      ),
    [events]
  );
  const availableTimeZones = Array.from(
    new Set([EVENT_TIME_ZONE, ...Array.from(cmsTimeZones.keys()), ...timeZones])
  );
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  useEffect(() => {
    if (typeof Intl.supportedValuesOf === "function") {
      setTimeZones([
        EVENT_TIME_ZONE,
        "UTC",
        ...Intl.supportedValuesOf("timeZone").filter(
          (zone) => zone !== EVENT_TIME_ZONE && zone !== "UTC"
        ),
      ]);
    }
  }, []);
  const [year, monthNumber] = month.split("-").map(Number);
  const monthDate = new Date(Date.UTC(year, monthNumber - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const offset = (monthDate.getUTCDay() + 6) % 7;
  const monthLabel = new Intl.DateTimeFormat(language, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(monthDate);
  const monthEvents = useMemo(
    () =>
      (events ?? []).filter(
        (event) =>
          eventDay(event.start_date_time, timeZone) <=
            `${month}-${daysInMonth}` &&
          eventDay(
            event.end_date_time
              ? new Date(new Date(event.end_date_time).getTime() - 1)
              : event.start_date_time,
            timeZone
          ) >= `${month}-01`
      ),
    [events, month, daysInMonth, timeZone]
  );
  const visibleEvents = selectedDay
    ? monthEvents.filter((event) => eventOccursOn(event, selectedDay, timeZone))
    : monthEvents;
  const orderedEvents = sortCalendarEvents(
    visibleEvents,
    new Date(currentTime)
  );

  function moveMonth(delta: number) {
    setMonth(
      new Date(Date.UTC(year, monthNumber - 1 + delta, 1))
        .toISOString()
        .slice(0, 7)
    );
    setSelectedDay(null);
  }

  function download(event: CalendarEvent) {
    const html = DOMPurify.sanitize(event.description ?? "");
    const document = new DOMParser().parseFromString(
      html.replace(/<br\s*\/?\s*>|<\/(?:p|li|div|h[1-6])>/gi, "\n"),
      "text/html"
    );
    const text = document.body.textContent?.trim() ?? "";
    const url = URL.createObjectURL(
      new Blob([createEventIcs(event, text)], {
        type: "text/calendar;charset=utf-8",
      })
    );
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = `digitizing-vietnam-${event.documentId}.ics`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const formatTime = (value: string) =>
    formatEventTime(value, language, timeZone);

  return (
    <section
      aria-label={vi ? "Lịch sự kiện" : "Events calendar"}
      className="mt-8 text-branding-black"
    >
      <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
        <div className="min-w-0 lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100dvh-3rem)] lg:overflow-y-auto">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h3 aria-live="polite" className="text-xl capitalize">
              {monthLabel}
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => moveMonth(-1)}
                aria-label={vi ? "Tháng trước" : "Previous month"}
                className="rounded border p-2 hover:bg-branding-gray"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setMonth(today.slice(0, 7));
                  setSelectedDay(null);
                }}
                className="rounded border px-3 py-2 text-sm hover:bg-branding-gray"
              >
                {vi ? "Hôm nay" : "Today"}
              </button>
              <button
                type="button"
                onClick={() => moveMonth(1)}
                aria-label={vi ? "Tháng sau" : "Next month"}
                className="rounded border p-2 hover:bg-branding-gray"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 text-center text-xs sm:text-sm">
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index} className="py-3 font-medium">
                {new Intl.DateTimeFormat(language, {
                  weekday: "short",
                  timeZone: "UTC",
                }).format(new Date(Date.UTC(2026, 0, 5 + index)))}
              </div>
            ))}
            {Array.from(
              { length: Math.ceil((offset + daysInMonth) / 7) * 7 },
              (_, index) => {
                const dayNumber = index - offset + 1;
                if (dayNumber < 1 || dayNumber > daysInMonth)
                  return (
                    <div
                      key={index}
                      className="min-h-16 border border-branding-gray bg-branding-gray/40 sm:min-h-24"
                    />
                  );
                const day = `${month}-${String(dayNumber).padStart(2, "0")}`;
                const dayEvents = monthEvents.filter((event) =>
                  eventOccursOn(event, day, timeZone)
                );
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() =>
                      setSelectedDay(day === selectedDay ? null : day)
                    }
                    aria-pressed={selectedDay === day}
                    aria-current={day === today ? "date" : undefined}
                    aria-label={`${day}, ${dayEvents.length} ${
                      vi ? "sự kiện" : "events"
                    }`}
                    className={`flex min-h-16 min-w-0 flex-col items-center gap-1 border p-1 sm:min-h-24 sm:p-2 ${
                      selectedDay === day
                        ? "border-branding-brown bg-branding-brown/10"
                        : "border-branding-gray hover:bg-branding-gray"
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full ${
                        day === today ? "bg-branding-brown text-white" : ""
                      }`}
                    >
                      {dayNumber}
                    </span>
                    {dayEvents.length > 0 && (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-branding-brown" />
                        <span className="hidden w-full truncate text-[11px] text-branding-brown sm:block">
                          {dayEvents[0].title}
                        </span>
                        {dayEvents.length > 1 && (
                          <span className="text-[10px]">
                            +{dayEvents.length - 1}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                );
              }
            )}
          </div>
        </div>
        <div className="min-w-0" aria-live="polite">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xl">
              {selectedDay
                ? new Intl.DateTimeFormat(language, {
                    dateStyle: "long",
                    timeZone: "UTC",
                  }).format(new Date(`${selectedDay}T12:00:00Z`))
                : vi
                ? "Sự kiện trong tháng"
                : "This month’s events"}
            </h3>
            {selectedDay && (
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="text-sm text-branding-brown underline"
              >
                {vi ? "Xem cả tháng" : "Show month"}
              </button>
            )}
          </div>
          <div className="mb-6 flex items-center gap-3">
            <label
              htmlFor="events-timezone"
              className="shrink-0 text-sm font-medium"
            >
              {vi ? "Chuyển sang múi giờ của bạn" : "Convert to your timezone"}
            </label>
            <Select
              value={timeZone}
              onValueChange={(value) => {
                setTimeZone(value);
                setSelectedDay(null);
              }}
            >
              <SelectTrigger id="events-timezone" className="min-w-0 flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTimeZones.map((zone) => (
                  <SelectItem key={zone} value={zone}>
                    {zone === EVENT_TIME_ZONE
                      ? vi
                        ? "Việt Nam (UTC+7)"
                        : "Vietnam (UTC+7)"
                      : cmsTimeZones.get(zone) ?? zone.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {loading && (
            <p role="status" className="py-4 text-sm">
              {vi ? "Đang tải sự kiện…" : "Loading events…"}
            </p>
          )}
          {!loading && events === null && (
            <div role="status" className="py-4 text-sm">
              <p>
                {vi
                  ? "Hiện chưa thể tải sự kiện. Vui lòng thử lại sau."
                  : "Events are temporarily unavailable. Please try again later."}
              </p>
            </div>
          )}
          {!loading && events !== null && visibleEvents.length === 0 && (
            <p className="pt-4 text-sm text-muted-foreground">
              {vi
                ? "Không có sự kiện trong giai đoạn này."
                : "No events scheduled for this period."}
            </p>
          )}
          <div className="space-y-4">
            {orderedEvents.map((event, index) => {
              const past = isPastEvent(event, new Date(currentTime));
              const showGroupHeading =
                index === 0 ||
                past !==
                  isPastEvent(orderedEvents[index - 1], new Date(currentTime));
              const thumbnail =
                event.thumbnail?.formats?.medium ??
                event.thumbnail?.formats?.small ??
                event.thumbnail;
              const thumbnailUrl = thumbnail?.url?.startsWith("/")
                ? `${process.env.NEXT_PUBLIC_STRAPI_API_URL}${thumbnail.url}`
                : thumbnail?.url;
              return (
                <Fragment key={event.documentId}>
                  {showGroupHeading && (
                    <h4 className="pt-2 text-lg font-medium text-branding-brown">
                      {past
                        ? vi
                          ? "Sự kiện đã qua"
                          : "Past events"
                        : vi
                        ? "Sự kiện sắp diễn ra và đang diễn ra"
                        : "Upcoming & ongoing events"}
                    </h4>
                  )}
                  <article className="rounded-md border border-[#dedede] p-5">
                    {thumbnailUrl && (
                      <Image
                        unoptimized
                        src={thumbnailUrl}
                        alt={event.thumbnail?.alternativeText || event.title}
                        width={thumbnail?.width || 750}
                        height={thumbnail?.height || 500}
                        className="mb-4 max-h-64 w-full rounded bg-transparent object-contain"
                      />
                    )}
                    <p className="mb-2 text-xs uppercase tracking-wide text-branding-brown">
                      {event.participation_mode === "Online"
                        ? vi
                          ? "Trực tuyến"
                          : "Online"
                        : event.participation_mode === "Hybrid"
                        ? vi
                          ? "Trực tiếp và trực tuyến"
                          : "Hybrid"
                        : event.participation_mode}
                    </p>
                    <h5 className="text-lg font-medium leading-snug">
                      {event.title}
                    </h5>
                    <p className="mt-3 text-sm">
                      <time dateTime={event.start_date_time}>
                        {formatTime(event.start_date_time)}
                      </time>
                      {event.end_date_time && (
                        <>
                          {" "}
                          –{" "}
                          <time dateTime={event.end_date_time}>
                            {formatTime(event.end_date_time)}
                          </time>
                        </>
                      )}
                    </p>
                    {event.location && (
                      <p className="mt-2 flex items-start gap-2 text-sm">
                        <MapPin size={16} className="mt-0.5 shrink-0" />
                        {event.location}
                      </p>
                    )}
                    {event.description && (
                      <details className="mt-3 text-sm">
                        <summary className="cursor-pointer text-branding-brown">
                          {vi ? "Chi tiết sự kiện" : "Event details"}
                        </summary>
                        <div
                          className="mt-3 break-words [&_a]:text-branding-brown [&_a]:underline [&_p]:mb-2 [&_ul]:list-inside [&_ul]:list-disc"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(event.description),
                          }}
                        />
                      </details>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        onClick={() => download(event)}
                        className="inline-flex items-center gap-2 rounded border  px-3 py-2 text-sm  hover:bg-branding-brown/10"
                        aria-label={`${
                          vi ? "Tải lịch cho" : "Download calendar for"
                        } ${event.title}`}
                      >
                        <Download size={16} />
                        {vi ? "Tải tệp .ics" : "Download .ics"}
                      </button>
                      {safeEventUrl(event.meeting_link) && (
                        <a
                          href={safeEventUrl(event.meeting_link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm  underline"
                        >
                          {vi ? "Liên kết sự kiện" : "Event link"}
                        </a>
                      )}
                    </div>
                  </article>
                </Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
