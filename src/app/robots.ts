import { MetadataRoute } from "next";

import { SITE_URL as BASE_URL } from "@/utils/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/", "/private/"],
      },
      {
        // Googlebot specific rules
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        // Bingbot specific rules
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
