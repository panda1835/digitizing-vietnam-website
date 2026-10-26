// Production SEO URLs must agree with the site's preferred redirect host.
export const SITE_URL = "https://www.digitizingvietnam.com";

/** Build a collection canonical from route params, excluding viewer/filter state. */
export function getCollectionCanonical(
  locale: string,
  collectionSlug?: string,
  itemSlug?: string,
  page?: string
): string {
  const segments = [locale, "our-collections", collectionSlug, itemSlug].filter(
    (segment): segment is string => segment !== undefined
  );
  const url = new URL(
    segments.map(encodeURIComponent).join("/"),
    `${SITE_URL}/`
  );
  // Listing pages have distinct sets of items; viewer pages share one canonical.
  if (collectionSlug && !itemSlug && page && /^[1-9]\d*$/.test(page)) {
    const pageNumber = Number(page);
    if (Number.isSafeInteger(pageNumber) && pageNumber > 1) {
      url.searchParams.set("page", String(pageNumber));
    }
  }
  return url.toString();
}

/**
 * Strips HTML tags from a string and returns plain text.
 * Truncates to maxLength characters and appends "…" if needed.
 */
export function stripHtmlTags(html: string, maxLength = 160): string {
  if (!html) return "";

  // Remove HTML tags
  const plainText = html.replace(/<[^>]*>/g, "").trim();

  if (plainText.length <= maxLength) return plainText;

  // Truncate at the last space before maxLength to avoid cutting words
  const truncated = plainText.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + "…";
}

/**
 * Builds the Strapi thumbnail URL, ensuring it is absolute.
 */
export function getStrapiImageUrl(
  thumbnailUrl: string | undefined
): string | undefined {
  if (!thumbnailUrl) return undefined;

  // If the URL is already absolute, return as-is
  if (thumbnailUrl.startsWith("http")) return thumbnailUrl;

  // Otherwise, prepend the Strapi base URL
  return `${process.env.NEXT_PUBLIC_STRAPI_API_URL}${thumbnailUrl}`;
}
