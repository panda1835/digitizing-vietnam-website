import { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/common/PageHeader";
import EventsCalendar from "@/components/EventsCalendar";
import { routing } from "@/i18n/routing";
import { fetchEvents } from "@/lib/fetch-events";
import { SITE_URL } from "@/utils/seo";
import { eventDay } from "@/lib/events";

export const revalidate = 1800;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Metadata {
  return {
    title: `${locale === "vi" ? "Sự kiện" : "Events"} | Digitizing Việt Nam`,
    alternates: {
      canonical: `${SITE_URL}/${locale}/events`,
      languages: { en: `${SITE_URL}/en/events`, vi: `${SITE_URL}/vi/events` },
    },
  };
}

export default async function EventsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { month?: string };
}) {
  setRequestLocale(locale);
  const now = new Date().toISOString();
  const title = locale === "vi" ? "Sự kiện" : "Events";
  const initialMonth =
    typeof searchParams.month === "string" &&
    /^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(searchParams.month)
      ? searchParams.month
      : undefined;
  const events = await fetchEvents(locale, {
    month: initialMonth ?? eventDay(now).slice(0, 7),
  });
  return (
    <div className="max-width w-full pb-20">
      <PageHeader
        title={title}
        subtitle={
          locale === "vi"
            ? "Khám phá các buổi tọa đàm, hội thảo và sự kiện của cộng đồng Digitizing Việt Nam."
            : "Discover talks, seminars, and events from the Digitizing Vietnam community."
        }
        breadcrumbItems={[{ label: title }]}
        locale={locale}
      />
      <EventsCalendar
        events={events}
        locale={locale}
        now={now}
        initialMonth={initialMonth}
      />
    </div>
  );
}
