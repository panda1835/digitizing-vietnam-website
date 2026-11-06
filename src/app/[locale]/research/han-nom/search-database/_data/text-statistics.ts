/** Text-only counting shared by search, snippets and library statistics. */
const hanCharacter = new RegExp("\\p{Script=Han}", "u");
const privateUseCharacter = new RegExp(
  "[\\uE000-\\uF8FF\\u{F0000}-\\u{FFFFD}\\u{100000}-\\u{10FFFD}]",
  "u"
);
export function plainText(source: string): string {
  return (source || "")
    .replace(/<!--[^]*?-->/g, "")
    .replace(/<(note|teiHeader|figDesc)\b[^>]*>[^]*?<\/\1>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&#(x[0-9a-f]+|[0-9]+);/gi, (_, code) =>
      String.fromCodePoint(
        code[0].toLowerCase() === "x"
          ? parseInt(code.slice(1), 16)
          : Number(code)
      )
    )
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/[@|]/g, " ")
    .normalize("NFC")
    .replace(/\s+/g, " ")
    .trim();
}

export function textLines(
  source: string,
  type: "han" | "nom" | "qn"
): string[] {
  let body = (source || "").replace(
    /<(note|teiHeader|figDesc)\b[^>]*>[^]*?<\/\1>/gi,
    ""
  );
  const divisions = Array.from(body.matchAll(/<div\b([^>]*)>([^]*?)<\/div>/gi));
  if (divisions.length) {
    body = divisions
      .filter(([, attributes]) => {
        const kind = /\btype=["']([^"']+)["']/i.exec(attributes)?.[1];
        return type === "qn" ? kind === "transliteration" : kind === "text";
      })
      .map(([, , content]) => content)
      .join("\n");
  }
  const lines = Array.from(body.matchAll(/<l\b[^>]*>([^]*?)<\/l>/gi));
  return (lines.length ? lines.map((m) => m[1]) : body.split(/@|[\r\n]+/))
    .map(plainText)
    .filter(Boolean);
}

export function countHanNom(source: string): number {
  const text = textLines(source, "nom").join("\n");
  // Include legacy private-use Nôm glyphs; exclude variation selectors and punctuation.
  return Array.from(text).filter(
    (ch) => hanCharacter.test(ch) || privateUseCharacter.test(ch)
  ).length;
}

export function countOccurrences(
  text: string,
  query: string,
  type: "han" | "nom" | "qn"
): number {
  const needle = plainText(query);
  if (!needle) return 0;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern =
    type === "qn"
      ? `(?:^|[^\\p{L}\\p{M}\\p{N}_])${escaped}(?=$|[^\\p{L}\\p{M}\\p{N}_])`
      : escaped;
  return Array.from(plainText(text).matchAll(new RegExp(pattern, "giu")))
    .length;
}

export function searchText(
  source: string,
  query: string,
  type: "han" | "nom" | "qn"
) {
  const lines = textLines(source, type);
  return {
    occurrences: lines.reduce(
      (total, line) => total + countOccurrences(line, query, type),
      0
    ),
    // Only matching body lines may be used for excerpts, never notes or fallback lines.
    text: lines
      .filter((line) => countOccurrences(line, query, type) > 0)
      .join(" @ "),
  };
}
