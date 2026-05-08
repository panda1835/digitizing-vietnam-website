import "@/app/globals.css";

import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { Metadata } from "next";

import NavigationBar from "@/components/layout/NavigationBar";
import Footer from "@/components/layout/Footer";
import BackToTopButton from "@/components/layout/BackToTopButton";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const BASE_URL = "https://digitizingvietnam.com";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const isVietnamese = locale === "vi";

  const title = "Digitizing Việt Nam";

  const description = isVietnamese
    ? "Một không gian số sáng tạo về Nghiên cứu Việt Nam, cung cấp bản thảo Hán-Nôm và các bộ sưu tập số hóa khác, cùng các tài liệu giảng dạy và công cụ nghiên cứu dành cho các học giả, giảng viên và công chúng."
    : "A cutting-edge digital hub for Vietnam Studies, offering Hán-Nôm manuscripts and other digitized collections, pedagogical resources, and research tools for scholars, educators and the public.";
  return {
    title: {
      default: title,
      template: `%s`,
    },
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: {
        en: `${BASE_URL}/en`,
        vi: `${BASE_URL}/vi`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}`,
      locale: isVietnamese ? "vi_VN" : "en_US",
      alternateLocale: isVietnamese ? "en_US" : "vi_VN",
    },
  };
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();

  // Admin subdomain (admin.digitizingvietnam.com, admin.localhost, …) gets a
  // chromeless layout — no DVN navbar, footer, textures, or max-width wrap.
  // The intl/tooltip/toaster providers stay so admin pages can still use
  // translations, tooltips, and toast notifications.
  const host = headers().get("host") ?? "";
  const isAdminHost = host.startsWith("admin.");
  if (isAdminHost) {
    return (
      <div className="min-h-screen bg-white">
        <NextIntlClientProvider messages={messages}>
          <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
          <Toaster />
        </NextIntlClientProvider>
      </div>
    );
  }

  const style = {
    backgroundImage: `url(/images/paper-textual.png)`,
    // backgroundSize: "auto 80px", // Assuming you want the "height" of the repeating image to be 80px
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f7f7]">
      <NextIntlClientProvider messages={messages}>
        <NavigationBar locale={locale} />
        <div
          className="flex-grow bg-repeat bg-opacity-90 px-[20px] md:px-[50px] relative"
          style={style}
        >
          <div
            className="absolute inset-0 bg-[url('/images/smudge-1.png')] bg-contain md:bg-auto bg-no-repeat pointer-events-none mix-blend-multiply opacity-70
              top-[161px] left-[242px] 
              md:top-[100px] md:left-[600px]
              "
          />
          <div
            className="absolute inset-0 bg-[url('/images/smudge-2.png')] bg-contain md:bg-auto bg-no-repeat pointer-events-none mix-blend-multiply opacity-70
              top-[2000px] left-[400px]
              md:top-[1500px] md:left-[1100px]
              sm:top-[1500px] sm:left-[400px]
              
              "
          />
          <div className="max-w-7xl mx-auto w-full">
            <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
          </div>
        </div>
        <Toaster />
        <BackToTopButton />
        <Footer locale={locale} />
      </NextIntlClientProvider>
    </div>
  );
}
