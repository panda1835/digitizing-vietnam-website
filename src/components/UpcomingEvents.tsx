"use client";

import { useEffect, useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { Link } from "@/i18n/routing";
import {
  CalendarEvent,
  EVENT_TIME_ZONE,
  eventDay,
  formatEventTime,
  detectBrowserTimeZone,
} from "@/lib/events";

export default function UpcomingEvents({
  events,
  unavailable,
  locale,
  headingClassName,
}: {
  events: CalendarEvent[];
  unavailable: boolean;
  locale: string;
  headingClassName?: string;
}) {
  const vi = locale === "vi";
  const language = vi ? "vi-VN" : "en-US";
  const [timeZone, setTimeZone] = useState(EVENT_TIME_ZONE);
  useEffect(() => setTimeZone(detectBrowserTimeZone()), []);

  return (
    <section
      aria-labelledby="upcoming-events-heading"
      className=" text-branding-black"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2
          id="upcoming-events-heading"
          className={`text-3xl font-medium ${headingClassName ?? ""}`}
        >
          {vi ? "Sự kiện sắp tới" : "Upcoming events"}
        </h2>
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm text-branding-brown hover:underline"
        >
          {vi ? "Xem lịch sự kiện" : "View events calendar"}
          <ArrowRight size={16} />
        </Link>
      </div>
      {events.length > 0 ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => {
            const date = new Date(event.start_date_time);
            return (
              <article
                key={event.documentId}
                className="flex items-start gap-4 rounded-md border border-[#dedede] p-5"
              >
                <div
                  aria-hidden="true"
                  className="flex w-14 shrink-0 flex-col items-center rounded border border-branding-brown/30 bg-branding-brown/5 py-2 text-branding-brown"
                >
                  <span className="w-full text-center text-xs uppercase">
                    {new Intl.DateTimeFormat(language, {
                      month: "short",
                      timeZone,
                    }).format(date)}
                  </span>
                  <span className="text-2xl">
                    {new Intl.DateTimeFormat(language, {
                      day: "numeric",
                      timeZone,
                    }).format(date)}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-medium leading-snug">
                    <Link
                      href={`/events?month=${eventDay(
                        event.start_date_time,
                        timeZone
                      ).slice(0, 7)}`}
                      className="hover:text-branding-brown hover:underline"
                    >
                      {event.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm">
                    <time dateTime={event.start_date_time}>
                      {formatEventTime(
                        event.start_date_time,
                        language,
                        timeZone
                      )}
                    </time>
                  </p>
                  {event.location && (
                    <p className="mt-2 flex items-start gap-2 text-sm text-branding-black/70">
                      <MapPin size={15} className="mt-0.5 shrink-0" />
                      {event.location}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="text-sm font-light">
          {unavailable
            ? vi
              ? "Hiện chưa thể tải sự kiện. Vui lòng thử lại sau."
              : "Events are temporarily unavailable. Please try again later."
            : vi
            ? "Các sự kiện mới sẽ sớm được cập nhật."
            : "New events will be announced soon."}
        </p>
      )}
    </section>
  );
}
