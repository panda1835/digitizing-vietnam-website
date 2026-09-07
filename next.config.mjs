import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["res.cloudinary.com", "developers.elementor.com"],
    // digi.vatlib.it sends no Cache-Control, ETag or Last-Modified at all, so
    // the optimiser would fall back to its 60-second minimum and re-fetch from
    // Rome all day. These are scans of 17th-century manuscripts: they do not
    // change. Cache them for 30 days.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        // The Vatican's IIIF image server. Their TLS handshake takes ~3.7s and
        // they serve concurrent requests one at a time (~150–300ms each), so a
        // grid of 20 thumbnails fetched straight from them sits blank for
        // seconds. Routing these through Next's image optimiser means DVN
        // fetches each derivative once and serves it cached thereafter.
        protocol: "https",
        hostname: "digi.vatlib.it",
        // /pub/ serves the curated cover images the grid uses; /iiifimage/ the
        // derivatives it falls back to.
        pathname: "/pub/**",
      },
      {
        protocol: "https",
        hostname: "digi.vatlib.it",
        pathname: "/iiifimage/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
