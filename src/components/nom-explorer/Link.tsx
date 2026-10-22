import { Link as LocaleLink } from "@/i18n/routing";

// The explorer's pages link with paths relative to the tool ("/component/巴");
// this adds the tool's base path, and the site's Link adds the locale.
export const EXPLORER_BASE = "/tools/han-nom-tools/nom-component-explorer";

export function explorerHref(href: string): string {
  if (!href.startsWith("/")) return href;
  return EXPLORER_BASE + (href === "/" ? "" : href);
}

export default function Link({
  href,
  ...rest
}: Omit<React.ComponentProps<typeof LocaleLink>, "href"> & { href: string }) {
  return <LocaleLink href={explorerHref(href)} {...rest} />;
}
