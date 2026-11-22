// Run with: node --test "src/app/[[]locale]/research/ca-dao-tuc-ngu/tu-dien-nghe-thu-cong/*.test.mjs"
// (--test reads paths as globs, so "[locale]" must be escaped as "[[]locale]".)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseBook } from "./parseBook.ts";

const FIXTURE = `# TỪ ĐIỂN BÁCH KHOA

## Mục lục

- LỜI NÓI ĐẦU — 13

# LỜI NÓI ĐẦU

<!-- p. 13 -->

Lời mở đầu.

# PHẦN A. KHÁI QUÁT

## Làng nghề

<!-- p. 14 -->

**LÀNG NGHỀ** là nơi làm nghề.

# PHẦN B. NGHỀ, LÀNG NGHỀ

## Áo dài

**ÁO DÀI** là trang phục.

## Đồ gốm

**ĐỒ GỐM** làm từ đất.
`;

test("ignores front matter and groups Entries under their Phần, in book order", () => {
  const book = parseBook(FIXTURE);

  assert.equal(book.preface.title, "LỜI NÓI ĐẦU");
  assert.equal(book.preface.kind, "preface");
  assert.deepEqual(
    book.parts.map((part) => [
      part.title,
      part.entries.map((entry) => [entry.title, entry.kind]),
    ]),
    [
      ["PHẦN A. KHÁI QUÁT", [["Làng nghề", "overview-article"]]],
      [
        "PHẦN B. NGHỀ, LÀNG NGHỀ",
        [
          ["Áo dài", "headword-entry"],
          ["Đồ gốm", "headword-entry"],
        ],
      ],
    ]
  );
  assert.deepEqual(
    book.entries.map((entry) => entry.title),
    ["LỜI NÓI ĐẦU", "Làng nghề", "Áo dài", "Đồ gốm"]
  );
});

test("slugs drop diacritics (đ → d) and number repeated titles in book order", () => {
  const book = parseBook(`# LỜI NÓI ĐẦU

Lời mở đầu.

# PHẦN B. NGHỀ

## Làng tương Cự Đà

Một.

## Trống paranưng, đàn đá

Hai.

## Làng tương Cự Đà

Ba.

## Làng tương Cự Đà

Bốn.
`);

  assert.deepEqual(
    book.entries.map((entry) => entry.slug),
    [
      "loi-noi-dau",
      "lang-tuong-cu-da",
      "trong-paranung-dan-da",
      "lang-tuong-cu-da-2",
      "lang-tuong-cu-da-3",
    ]
  );
});

const pageRanges = (book) =>
  Object.fromEntries(
    book.entries.map((entry) => [entry.slug, [entry.startPage, entry.endPage]])
  );

test("Page Range starts at the page after a marker that comes before the first text", () => {
  const book = parseBook(`# LỜI NÓI ĐẦU

<!-- p. 13 -->

Lời mở đầu.

# PHẦN A. KHÁI QUÁT

<!-- p. 17 -->

## Làng nghề

<!-- p. 18 -->

**LÀNG NGHỀ** trọn một trang.

## Tổ nghề

**TỔ NGHỀ** cũng ở trang 18.
`);

  assert.deepEqual(pageRanges(book), {
    "loi-noi-dau": [13, 13],
    "lang-nghe": [18, 18],
    "to-nghe": [18, 18],
  });
});

test("Page Range follows mid-line markers across several pages", () => {
  const book = parseBook(`# LỜI NÓI ĐẦU

<!-- p. 43 -->

Lời mở đầu.

# PHẦN B. NGHỀ

## Áo dài

**ÁO DÀI** bắt đầu ở trang 43, <!-- p. 44 --> sang trang 44,

rồi <!-- p. 45 --> trang 45 và <!-- p. 46 --> kết thúc ở trang 46.

## Âu Cơ

<!-- p. 47 -->
**ÂU CƠ** ở trang 47. <!-- p. 48 -->

## Bà ba

**BÀ BA** bắt đầu ở trang 48.
`);

  assert.deepEqual(pageRanges(book), {
    "loi-noi-dau": [43, 43],
    "ao-dai": [43, 46],
    "au-co": [47, 47],
    "ba-ba": [48, 48],
  });
});

test("display markdown drops the heading and every page marker", () => {
  const book = parseBook(`# LỜI NÓI ĐẦU

Lời mở đầu.

# PHẦN B. NGHỀ

## Áo dài

<!-- p. 44 -->

**ÁO DÀI** là trang phục <!-- p. 45 --> truyền thống.

<!-- p. 46 -->

<!-- p. 47 -->

Đoạn cuối. <!-- p. 48 -->
`);

  assert.equal(
    book.entries[1].markdown,
    "**ÁO DÀI** là trang phục truyền thống.\n\nĐoạn cuối."
  );
});

test("verse runs keep hard line breaks; wrapped prose lines are left to join", () => {
  const book = parseBook(`# LỜI NÓI ĐẦU

Người xưa có câu:
*Rủ nhau chơi khắp Long thành*
*Băm mươi sáu phố rành rành chẳng sai*
Hết câu.

Sách gồm 2 phần:
Phần A: các mục chung.

*Một dòng nghiêng*

**THAY MẶT CÁC TÁC GIẢ**
**TẠ VĂN THÔNG**
`);

  assert.equal(
    book.preface.markdown,
    [
      "Người xưa có câu:",
      "*Rủ nhau chơi khắp Long thành*\\",
      "*Băm mươi sáu phố rành rành chẳng sai*",
      "Hết câu.",
      "",
      "Sách gồm 2 phần:",
      "Phần A: các mục chung.",
      "",
      "*Một dòng nghiêng*",
      "",
      "**THAY MẶT CÁC TÁC GIẢ**",
      "**TẠ VĂN THÔNG**",
    ].join("\n")
  );
});

test("the real book.md matches its own printed Mục lục", () => {
  const text = readFileSync(
    new URL(
      "../../../../../../public/data/tu-dien-nghe-thu-cong/book.md",
      import.meta.url
    ),
    "utf8"
  );
  const mucLuc = text
    .slice(text.indexOf("## Mục lục"), text.indexOf("# LỜI NÓI ĐẦU"))
    .split("\n")
    .map((line) => line.match(/^\s*- (.+) [—-] (\d+)$/))
    .filter(Boolean)
    .map(([, title, page]) => ({ title, page: Number(page) }));
  const book = parseBook(text);

  assert.equal(mucLuc.length, 304);
  assert.deepEqual(
    [
      book.preface.title,
      ...book.parts.flatMap((part) => [
        part.title,
        ...part.entries.map((entry) => entry.title),
      ]),
    ],
    mucLuc.map((row) => row.title)
  );
  // 10 Overview Articles and 291 Headword Entries, after the Preface.
  assert.equal(book.entries.length, 1 + 301);
  assert.deepEqual(
    book.entries.map((entry) => [entry.title, entry.startPage]),
    mucLuc
      .filter((row) => !row.title.startsWith("PHẦN "))
      .map((row) => [row.title, row.page])
  );
});
