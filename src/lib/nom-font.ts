import localFont from "next/font/local";

/**
 * Nôm Na Tống — the project's Hán-Nôm display font. It covers the
 * Plane-15 Private Use Area codepoints the VNPF / Nôm databases assign to
 * unencoded characters (e.g. U+F184E `󰡎`) plus CJK Unified Ideographs &
 * extensions, so glyphs the system fonts can't draw still render.
 *
 * Exposed as a CSS variable so the `font-han-nom` Tailwind utility
 * (tailwind.config.ts → fontFamily["han-nom"]) resolves to it. Attach
 * `nomNaTong.variable` to a high-level element (the root <body>) once and
 * every `font-han-nom` consumer works — the font is only fetched on pages
 * that actually render such an element.
 *
 * `src` is relative to THIS file (src/lib → src/fonts).
 */
export const nomNaTong = localFont({
  src: "../fonts/NomNaTongLight/NomNaTong-Regular.ttf",
  variable: "--font-nom-na-tong",
  display: "swap",
});
