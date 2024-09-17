import { createSharedPathnamesNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["en", "vi"],

  // Used when no locale matches
  defaultLocale: "en",
  // pathnames: {
  //   "/": "/",
  //   "/about-us": {
  //     en: "/about-us",
  //     vi: "/ve-chung-toi",
  //   },
  //   "/our-collections": {
  //     en: "/our-collections",
  //     vi: "/bo-suu-tap",
  //   },
  //   "/blogs": {
  //     en: "/blogs",
  //     vi: "/blogs",
  //   },
  // },
});

// export type Pathnames = keyof typeof routing.pathnames;
// export type Locale = typeof routing.locales[number];

// export const { Link, getPathname, redirect, usePathname, useRouter } =
//   createLocalizedPathnamesNavigation(routing);

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation(routing);
