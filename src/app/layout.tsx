import { ReactNode } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Metadata } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://digitizingvietnam.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Digitizing Việt Nam",
    template: "%s | Digitizing Việt Nam",
  },
  description:
    "A cutting-edge digital hub for Vietnam Studies, offering Hán-Nôm manuscripts and other digitized collections, pedagogical resources, and research tools for scholars, educators and the public.",
  keywords: [
    "Vietnam Studies",
    "Hán-Nôm",
    "digitized collections",
    "Vietnamese history",
    "Vietnamese culture",
    "digital humanities",
    "Vietnam archives",
    "Chữ Nôm",
    "Vietnamese manuscripts",
    "Vietnam research",
    "Columbia University",
    "Fulbright Vietnam",
    "Vietnamese heritage",
    "Vietnam education",
    "Truyện Kiều",
    "Vietnamese literature",
  ],
  authors: [{ name: "Digitizing Việt Nam" }],
  creator: "Digitizing Việt Nam",
  publisher: "Digitizing Việt Nam",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "vi_VN",
    url: BASE_URL,
    siteName: "Digitizing Việt Nam",
    title: "Digitizing Việt Nam",
    description:
      "A cutting-edge digital hub for Vietnam Studies, offering Hán-Nôm manuscripts and other digitized collections, pedagogical resources, and research tools for scholars, educators and the public.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Digitizing Việt Nam",
    description:
      "A cutting-edge digital hub for Vietnam Studies, offering Hán-Nôm manuscripts and other digitized collections, pedagogical resources, and research tools for scholars, educators and the public.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when you have them
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      en: `${BASE_URL}/en`,
      vi: `${BASE_URL}/vi`,
    },
  },
  category: "education",
};

type Props = {
  children: ReactNode;
};

// Since we have a `not-found.tsx` page on the root, a layout file
// is required, even if it's just passing children through.
export default function RootLayout({ children }: Props) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      <body>{children}</body>
      <GoogleAnalytics gaId="G-05TY9EP7K7" />
    </html>
  );
}
