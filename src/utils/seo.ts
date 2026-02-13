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
