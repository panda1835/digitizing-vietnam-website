/**
 * parseRssFeed.js
 * Fetches and parses an RSS feed, returning a list of articles with text content.
 * Used by the Phase 2 automated daily pipeline.
 */

import { parseStringPromise } from "xml2js";

/**
 * Fetch an RSS feed and return a normalized list of articles.
 * @param {string} feedUrl
 * @returns {Promise<Array<{title, url, pubDate, description}>>}
 */
export async function fetchRssFeed(feedUrl) {
  const res = await fetch(feedUrl, {
    headers: { "User-Agent": "DigitizingVietnam-LanguageLab/1.0" },
    next: { revalidate: 3600 }, // cache for 1 hour in Next.js
  });

  if (!res.ok) throw new Error(`Failed to fetch RSS: ${feedUrl} (${res.status})`);

  const xml = await res.text();
  const parsed = await parseStringPromise(xml, { explicitArray: false });

  const channel = parsed?.rss?.channel;
  if (!channel) throw new Error(`Unexpected RSS structure from ${feedUrl}`);

  const items = Array.isArray(channel.item) ? channel.item : [channel.item];

  return items
    .filter(Boolean)
    .map((item) => ({
      title: item.title ?? "",
      url: item.link ?? item.guid ?? "",
      pubDate: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
      description: stripHtml(item.description ?? ""),
    }))
    .filter((item) => item.url); // discard items without a URL
}

/**
 * Fetch the full article text from a URL by scraping the page.
 * Returns the visible text content, stripped of nav/footer boilerplate.
 * @param {string} url
 * @returns {Promise<string>}
 */
export async function fetchArticleText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "DigitizingVietnam-LanguageLab/1.0" },
  });

  if (!res.ok) throw new Error(`Failed to fetch article: ${url} (${res.status})`);

  let html = await res.text();

  // Strip blocks whose text content is never article prose
  html = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "");

  // Extract text from <p> tags — covers most Vietnamese news sites
  const paragraphs = Array.from(html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi))
    .map(([, inner]) => stripHtml(inner).trim())
    .filter((p) => {
      if (p.length < 40) return false;
      // Discard CSS/JS fragments: too many brace/semicolon characters
      const codeChars = (p.match(/[{}();]/g) ?? []).length;
      if (codeChars / p.length > 0.02) return false;
      return true;
    });

  return paragraphs.join("\n\n");
}

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
