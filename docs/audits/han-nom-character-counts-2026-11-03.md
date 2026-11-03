# Hán Nôm character-count audit — 3 November 2026

Twelve saved totals match an independent recount. Ngoại kỷ is overstated. Bản kỷ Toàn thư is understated and its final total remains unverified because source chapters are not all accessible through the public reader. Application constants were not changed by this audit.

| Text | Saved | Independent recount | Result |
| --- | ---: | ---: | --- |
| Truyện Kiều 1866 | 16,715 | 16,715 | match |
| Truyện Kiều 1870 | 22,820 | 22,820 | match |
| Truyện Kiều 1871 | 22,770 | 22,770 | match |
| Truyện Kiều 1872 | 22,802 | 22,802 | match |
| Truyện Kiều 1902 | 22,786 | 22,786 | match |
| ĐVSKTT — Quyển Thủ | 12,052 | 12,052 | match |
| ĐVSKTT — Ngoại kỷ | 65,019 | 28,575 | mismatch |
| ĐVSKTT — Bản kỷ Toàn thư | 116,714 | At least 128,496 | incomplete source coverage |
| ĐVSKTT — Bản kỷ Thực lục | 120,934 | 120,934 | match |
| ĐVSKTT — Bản kỷ Tục biên | 69,910 | 69,910 | match |
| Chinh phụ ngâm khúc | 6,005 | 6,005 | match |
| Quốc âm Thi tập | 12,467 | 12,467 | match |
| Tinh hoa Mùa xuân | 2,293 | 2,293 | match |
| Lục Vân Tiên | 14,409 | 14,409 | match |

## Method and evidence

- Parsed the five local Kiều XML files independently with xml2js, without calling the application counting helper. Source SHA-256 hashes are recorded in the JSON report.
- Recounted remaining originals from the live site’s public text APIs. The audit uses the original body fields only, not the duplicated rawText/text copies, transliterations, separate title metadata, or notes. Headings embedded in an original body field remain part of that transcription.
- Counts include repeated Han-script characters and legacy private-use glyphs. Spaces, punctuation, markup, and variation selectors do not count.
- Enumerated API page counts and poem/topic inventories. Intentional history-reader aliases were counted once. Distinct chapters sharing an erroneous mapping were flagged instead of silently counted twice.
- Direct database access timed out. Public API totals cannot establish whether additional database rows exist outside the exposed chapter inventories.
- API responses were downloaded during this audit and cached under /tmp/han-nom-character-audit for reproducibility and resuming requests. The script supports --refresh for a fresh download.

## Findings

1. **Ngoại kỷ: 65,019 saved vs 28,575 recounted** across its 14 reader chapters (178 API records). The old grouping helper maps unrecognized IDs to book 1, which is Ngoại kỷ. Confirmed examples are IDs 24, 26, 40, 54 and 56; these belong to Bản kỷ Toàn thư. The exact 36,444-character overstatement cannot be fully allocated without the inaccessible source records.
2. **Bản kỷ Toàn thư: 116,714 saved vs at least 128,496 observed** in 25 distinct accessible chapters (795 API records). IDs 24, 26, 54 and 56 contribute 11,782 characters, exactly explaining the difference between the saved count and the accessible subtotal. The Trần Nhân Tông selector incorrectly points at ID 32, already used for Lý Nhân Tông, rather than exposing its own chapter; it was not counted twice. The Thiếu Đế selector returns no source rows. Do not replace the constant with the partial 128,496 subtotal.
3. **Bản kỷ Thực lục: 120,934 confirmed.** The collection reader has a spacing mismatch in the two Thánh Tông Thuần Hoàng Đế chapter names. The alternate research reader exposes those originals: 24,833 characters in the upper section and 25,561 in the lower section. Adding those to the other nine chapters confirms the saved total.
4. **Kiều 1866: 16,715 confirmed for the encoded transcription.** It contains 2,390 encoded verse lines; 36 XML pages have no original verse. This is a coverage limitation, not evidence that the complete manuscript contains only 16,715 characters. The page labels are preserved in the JSON report.
5. **Chinh phụ ngâm khúc: 6,005 = 2,878 Nôm + 3,127 Hán.** Both original language layers are counted, each once.

## Reproduce

```sh
node scripts/audits/han-nom-character-counts.cjs /tmp/han-nom-character-audit.json --refresh
```

The command exits with status 1 when it finds mismatches, incomplete coverage, or failed requests. No runtime counting or database writes are introduced. Detailed per-topic totals are in [the JSON report](han-nom-character-counts-2026-11-03.json).
