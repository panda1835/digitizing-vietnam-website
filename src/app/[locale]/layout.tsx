import "@/app/globals.css";

import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

import NavigationBar from "@/components/layout/NavigationBar";
import Footer from "@/components/layout/Footer";
import GachBongTop from "@/components/SearchBar";
import BackToTopButton from "@/components/layout/BackToTopButton";
import SearchBar from "@/components/SearchBar";

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
  const style = {
    backgroundImage: `url(/images/paper-textual.png)`,
    // backgroundSize: "auto 80px", // Assuming you want the "height" of the repeating image to be 80px
  };
  return (
    <html lang={locale}>
      <body className="min-h-screen flex flex-col  bg-[#f7f7f7]">
        <NextIntlClientProvider messages={messages}>
          <NavigationBar />
          <div
            className="flex-grow bg-repeat px-[20px] md:px-[50px]"
            style={style}
          >
            <div className="flex justify-center items-center h-full">
              <SearchBar locale={locale} />
            </div>
            {children}
          </div>
          <BackToTopButton />
          <Footer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
