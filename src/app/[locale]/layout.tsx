import "@/components/globals.css";

import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GachBongTop from "@/components/GachBongTop";
import GachBongBottom from "@/components/GachBongBottom";
import BackToTopButton from "@/components/BackToTopButton";

export const metadata = {
  title: "Digitizing Việt Nam",
  description:
    "Digitizing Việt Nam, a central hub for resources about Vietnamese Studies.",
};

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

  return (
    <html lang={locale}>
      <body className="min-h-screen flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <Header />
          <GachBongTop />
          <div className="flex-grow mt-10">{children}</div>
          <BackToTopButton />
          <GachBongBottom />
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
