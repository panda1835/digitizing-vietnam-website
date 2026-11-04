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
  const isVietnamese = locale === "vi";
  const title = `${isVietnamese ? "Sự kiện" : "Events"} | Digitizing Việt Nam`;
  const description = isVietnamese
    ? "Khám phá các buổi tọa đàm, hội thảo và sự kiện liên quan đến lĩnh vực Việt Nam học và Nhân văn số trong bối cảnh khu vực và quốc tế."
    : "Explore talks, conferences, and events related to Vietnamese Studies and Digital Humanities in regional and international contexts.";
  const url = `${SITE_URL}/${locale}/events`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { en: `${SITE_URL}/en/events`, vi: `${SITE_URL}/vi/events` },
    },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: "Digitizing Việt Nam",
      locale: isVietnamese ? "vi_VN" : "en_US",
      alternateLocale: isVietnamese ? "en_US" : "vi_VN",
    },
    twitter: {
      card: "summary",
      title,
      description,
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
            ? "Khám phá các buổi tọa đàm, hội thảo và sự kiện liên quan đến lĩnh vực Việt Nam học và Nhân văn số trong bối cảnh khu vực và quốc tế."
            : "Explore talks, conferences, and events related to Vietnamese Studies and Digital Humanities in regional and international contexts."
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
