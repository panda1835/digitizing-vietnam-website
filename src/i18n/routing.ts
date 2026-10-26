import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["en", "vi"],

  // Used when no locale matches
  defaultLocale: "en",

  // Page metadata validates CMS availability; middleware cannot assume every
  // path has a translation or that its translated slug is identical.
  alternateLinks: false,
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
