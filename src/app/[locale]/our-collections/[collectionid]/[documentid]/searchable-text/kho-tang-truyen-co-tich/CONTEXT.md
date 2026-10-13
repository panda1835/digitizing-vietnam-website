# Digitizing Việt Nam — Domain Glossary

## Collections

- **Collection** — a Strapi `collections` record grouping related items, addressed by its slug at `/our-collections/<collection>` (e.g. `vietnamese-folk-literature`, "Văn học Dân gian Việt Nam").
- **Collection Item** — a Strapi `collection-items` record inside one or more Collections, addressed at `/our-collections/<collection>/<item>`. Its title, abstract and metadata always come from Strapi.
- **Item Viewer** — what renders a Collection Item's content: Mirador (IIIF images, the default), a media embed, or a custom reader for a digitized text.

## Kho Tàng Truyện Cổ Tích Việt Nam

The Collection Item `truyen-co-tich-viet-nam` in `vietnamese-folk-literature`: Nguyễn Đổng Chi's book, shown in full as digitized text by a custom reader instead of Mirador.

- **Book** — the whole digitized work, made of three Parts.
- **Part** (Phần) — a top-level division: Phần thứ nhất (research essays), Phần thứ hai (the story treasury), Phần thứ ba (general assessment essays).
- **Section** (Mục) — a numbered division of a Part, identified by a Roman numeral. Numerals are only unique within a Part: Phần thứ ba continues Phần thứ nhất's numbering (IV, V), so it collides with Phần thứ hai's IV and V.
- **Story** (Truyện) — a numbered folktale in a Phần thứ hai Section. Story numbers are unique across the Book.
- **Essay** (Bài) — a numbered scholarly text in a Phần thứ nhất or Phần thứ ba Section. Essay numbers restart in every Section.
- **Part Introduction** (Lời dẫn) — the unnumbered text that opens a Part before its first Section.
- **Preface** (Lời nói đầu) — the author's 1957 preface to the whole Book. It belongs to no Part and is not a Part Introduction, but is shown as the first Entry under Phần thứ nhất.
- **Entry** (Mục đọc) — any single readable unit of the Book: the Preface, a Story, an Essay or a Part Introduction. Entries have one book order (Preface, then each Part: Part Introduction, then Sections in order, then number), which previous/next follows and in which the Book opens at the Preface.
- **Khảo dị** — the variant-versions appendix at the end of some Stories.
- **Footnote** (Chú thích) — a source note on a Story, Essay or Part Introduction. Footnotes are numbered per printed page, so one label can repeat within a single text.
- **Story Name Index** (Bảng tra cứu tên truyện) — the book's alphabetical list of every tale name in Phần thứ hai, including tales named only inside a Khảo dị or a Footnote. It is searchable, not browsable.
- **Index Name** — one name in the Story Name Index, pointing to one or more Stories and to where in each the name occurs: the Story itself, its Khảo dị, or a Footnote. The printed index is the guide, the Story text is the authority: when the two spell a name differently (index *A-đao dũng cảm*, text *A-dao dũng cảm*), the text's spelling is what gets highlighted. A qualifier such as *truyện Pháp* in *Ba anh em, truyện Pháp* tells same-named tales apart and is not part of the name. A *Xem X* line is an alias of the Index Name X.
