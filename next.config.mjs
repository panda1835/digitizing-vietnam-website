import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["res.cloudinary.com", "developers.elementor.com"],
  },
  experimental: {
    // The App Router keeps a client-side cache of RSC payloads. In 14.2
    // the default "fresh" window for dynamically-rendered routes is 30s,
    // so soft-navigating back into an admin OCR page within 30s of a save
    // replayed the stale (pre-save) payload — making just-saved
    // OCR/columns look lost even though they were persisted. 0 = always
    // refetch dynamic routes on navigation.
    staleTimes: { dynamic: 0 },
  },
};

export default withNextIntl(nextConfig);
