import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["res.cloudinary.com", "developers.elementor.com", "triclops.library.columbia.edu"],
  },
  // pdf-to-img loads pdfjs-dist's ESM build (pdf.mjs) at module init. When
  // Next/webpack bundles it for an RSC route handler the ESM wrapper hits
  // "Object.defineProperty called on non-object". Excluding both packages
  // makes Node `require` them directly so the ESM init path runs cleanly.
  experimental: {
    serverComponentsExternalPackages: ["pdf-to-img", "pdfjs-dist"],
  },
};

export default withNextIntl(nextConfig);
