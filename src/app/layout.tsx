import { ReactNode } from "react";
import { Metadata } from "next";

import { SITE_URL as BASE_URL } from "@/utils/seo";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/favicon.png",
  },
  title: {
    default: "Digitizing Việt Nam",
    template: "%s",
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
  },
  category: "education",
};

type Props = {
  children: ReactNode;
};

// The locale layout owns the document so its route param can set <html lang>
// without reading request headers and forcing every route to render dynamically.
// The global not-found page supplies its own document for unmatched requests.
export default function RootLayout({ children }: Props) {
  return children;
}
