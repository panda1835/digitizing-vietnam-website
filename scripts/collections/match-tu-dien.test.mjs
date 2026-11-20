// Run with: node --test scripts/collections/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { matchTuDien } from "./match-tu-dien.mjs";

/** A Proverb Entry with only the fields matching reads. */
function proverbEntry(anchor, proverb, citations, variants = []) {
  return {
    anchor,
    proverb,
    citations: citations.map((abbreviation) => ({ abbreviation, pages: "1" })),
    variants: variants.map(([text, cites]) => ({
      label: "Bản khác",
      text: [{ text }],
      citations: cites.map((abbreviation) => ({ abbreviation, pages: "1" })),
    })),
  };
}

test("matches the whole Từ điển Entry text, ignoring diacritics, case and punctuation", () => {
  const kho = [proverbEntry("T-1", "Tầm gửi lấn cành.", ["VC II"])];
  const tuDien = { T: [{ id: "td-1", poem: "TẦM GỬI LẤN CÀNH!" }] };

  assert.deepEqual(matchTuDien(kho, tuDien), {
    "T-1": [{ id: "td-1", kind: "exact", letter: "T" }],
  });
});

test("matches one line of a multi-line Từ điển Entry", () => {
  const kho = [
    proverbEntry("A-10", "Ai biết ma ăn cỗ ở đâu.", ["VC I"]),
    proverbEntry("A-11", "Ai biết ma ăn cỗ", ["VC I"]),
  ];
  const tuDien = {
    A: [{ id: "td-1", poem: "Ai biết ma ăn cỗ ở đâu.\n(Ai biết ma ăn cỗ.)" }],
  };

  assert.deepEqual(matchTuDien(kho, tuDien), {
    "A-10": [{ id: "td-1", kind: "exact", letter: "A" }],
    "A-11": [{ id: "td-1", kind: "exact", letter: "A" }],
  });
});

test("matches a Từ điển Entry with or without its parenthesised words", () => {
  const kho = [
    proverbEntry("A-45", "Ai dám thi đua với giải.", ["VC I"]),
    proverbEntry("A-46", "Ai dám thi đua bơi với giải.", ["VC I"]),
  ];
  const tuDien = { A: [{ id: "td-1", poem: "Ai dám thi đua (bơi) với giải." }] };

  assert.deepEqual(matchTuDien(kho, tuDien), {
    "A-45": [{ id: "td-1", kind: "exact", letter: "A" }],
    "A-46": [{ id: "td-1", kind: "exact", letter: "A" }],
  });
});

test("gives one match per Từ điển Entry when several carry the saying", () => {
  const kho = [proverbEntry("C-7", "Có công mài sắt, có ngày nên kim.", ["VC I"])];
  const tuDien = {
    C: [
      { id: "td-tuc-ngu", poem: "Có công mài sắt có ngày nên kim." },
      { id: "td-unrelated", poem: "Có chí thì nên." },
      { id: "td-ca-dao", poem: "Có công mài sắt, có ngày nên kim!" },
    ],
  };

  assert.deepEqual(matchTuDien(kho, tuDien), {
    "C-7": [
      { id: "td-tuc-ngu", kind: "exact", letter: "C" },
      { id: "td-ca-dao", kind: "exact", letter: "C" },
    ],
  });
});

test("looks for a Đ-initial saying in the D file before the others", () => {
  const kho = [proverbEntry("Đ-3", "Đi một ngày đàng, học một sàng khôn.", ["VC I"])];
  const tuDien = {
    D: [{ id: "td-d", poem: "Đi một ngày đàng học một sàng khôn." }],
    H: [{ id: "td-misfiled", poem: "Đi một ngày đàng, học một sàng khôn." }],
  };

  assert.deepEqual(matchTuDien(kho, tuDien), {
    "Đ-3": [{ id: "td-d", kind: "exact", letter: "D" }],
  });
});

test("falls back to every Từ điển Entry when the saying's letter has no match", () => {
  const kho = [proverbEntry("E-12", "Em thương anh cuốn gói cho tròn.", ["VC I"])];
  const tuDien = {
    A: [{ id: "td-a", poem: "- Em thương anh cuốn gói cho tròn." }],
    E: [{ id: "td-e", poem: "Em ơi." }],
  };

  assert.deepEqual(matchTuDien(kho, tuDien), {
    "E-12": [{ id: "td-a", kind: "exact", letter: "A" }],
  });
});

test("never matches a Proverb Entry that doesn't cite VC I or VC II", () => {
  const kho = [
    proverbEntry("T-1", "Tầm gửi lấn cành.", ["NASL II", "VCVN I"]),
  ];
  const tuDien = { T: [{ id: "td-1", poem: "Tầm gửi lấn cành." }] };

  assert.deepEqual(matchTuDien(kho, tuDien), {});
});

test("matches a Variant whose citations include VC, when the entry's own don't", () => {
  const kho = [
    proverbEntry(
      "A-50",
      "Ai ăn trầu nấy đỏ môi.",
      ["NL"],
      [
        ["Ai ăn trầu người ấy đỏ môi.", ["VC I", "VD"]],
        ["Ai ăn cau nấy đỏ môi.", ["NL"]],
      ]
    ),
  ];
  const tuDien = {
    A: [
      { id: "td-main", poem: "Ai ăn trầu nấy đỏ môi." },
      { id: "td-variant", poem: "Ai ăn trầu người ấy đỏ môi." },
      { id: "td-other", poem: "Ai ăn cau nấy đỏ môi." },
    ],
  };

  assert.deepEqual(matchTuDien(kho, tuDien), {
    "A-50": [{ id: "td-variant", kind: "exact", letter: "A" }],
  });
});

test("falls back to an approximate match when the wording differs by a little", () => {
  const kho = [proverbEntry("T-1", "Tầm gửi lấn cành.", ["VC II"])];
  const tuDien = {
    T: [
      { id: "td-unrelated", poem: "Tham thì thâm." },
      { id: "td-1", poem: "Tầm gửi lấn ngành." },
    ],
  };

  assert.deepEqual(matchTuDien(kho, tuDien), {
    "T-1": [{ id: "td-1", kind: "approximate", letter: "T" }],
  });
});

test("leaves a wording unmatched when it differs by too much", () => {
  const kho = [proverbEntry("T-1", "Tầm gửi lấn cành.", ["VC II"])];
  const tuDien = { T: [{ id: "td-1", poem: "Tầm gửi lấn thân." }] };

  assert.deepEqual(matchTuDien(kho, tuDien), {});
});

test("gives only the exact match when an approximate one is also close", () => {
  const kho = [proverbEntry("T-1", "Tầm gửi lấn cành.", ["VC II"])];
  const tuDien = {
    T: [
      { id: "td-near", poem: "Tầm gửi lấn ngành." },
      { id: "td-exact", poem: "Tầm gửi lấn cành!" },
    ],
  };

  assert.deepEqual(matchTuDien(kho, tuDien), {
    "T-1": [{ id: "td-exact", kind: "exact", letter: "T" }],
  });
});

test("names the letter file each matched Từ điển Entry is filed under", () => {
  const kho = [
    proverbEntry("Đ-3", "Đi một ngày đàng, học một sàng khôn.", ["VC I"]),
    proverbEntry("E-12", "Em thương anh cuốn gói cho tròn.", ["VC I"]),
  ];
  const tuDien = {
    A: [{ id: "td-a", poem: "- Em thương anh cuốn gói cho tròn." }],
    D: [{ id: "td-d", poem: "Đi một ngày đàng học một sàng khôn." }],
  };

  const matches = matchTuDien(kho, tuDien);
  assert.equal(matches["Đ-3"][0].letter, "D");
  assert.equal(matches["E-12"][0].letter, "A");
});
