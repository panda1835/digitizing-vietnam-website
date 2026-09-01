import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["res.cloudinary.com", "developers.elementor.com", "iiif.digitizingvietnam.com"],
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default withNextIntl(nextConfig);
