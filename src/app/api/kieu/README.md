# Truyện Kiều research API

Read-only access to the five repository XML editions: `1866`, `1870`, `1871`, `1872`, `1902`. No provider credentials or AI calls are needed. Existing searchable-text and playground reading APIs remain compatible.

## Endpoints

| Method | Path | Input |
| --- | --- | --- |
| GET | `/api/kieu/editions` | None |
| GET | `/api/kieu/editions/{edition}/verses` | `from=100&to=120` |
| POST | `/api/kieu/concordance` | Concordance object below |
| GET | `/api/kieu/editions/{edition}/frequencies` | Frequency query parameters below |
| POST | `/api/kieu/nom-variants` | `{"left":"1866","right":"1902"}` |
| POST | `/api/kieu/compare` | `{"from":1,"to":20,"editions":["1866","1870"],"script":"nom"}` |
| POST | `/api/kieu/exports` | Export object below |

All POST bodies are JSON, limited to 16 KiB. Unknown fields, unsupported editions, duplicate query parameters, invalid ranges, and malformed JSON are rejected. Errors return `{error, issues?}`: 400 invalid input/cursor, 413 oversized input/export, 503 unavailable corpus. Requests do not accept file paths, URLs, or arbitrary regular expressions.

## Editions, passages, and provenance

Edition metadata includes the original TEI title/date, available scripts, page/verse counts, and source links. Attribution and license fields are `null` when absent from the header; they are not inferred.

Passages return `verses`, `pageNotes`, `settings`, and `provenance`. Each verse includes:

- `id`: `kieu:1866:page:1:verse:1`, identifying the edition, physical page position, and original verse label.
- `number`: the original string label, including labels such as `534b`.
- `numericNumber`: numeric portion of the label, used for ranges. `from=534&to=534` includes `534`, `534b`, and `534c` where present.
- `nom`, `quocNgu`: original transcription strings with annotation markup flattened in order, retaining text and internal spacing. Outer whitespace is trimmed; source normalization is not rewritten.
- `annotations`: source segment IDs, linked note IDs, text, and start/end offsets in each script.
- `notes`: notes linked to the verse's segments. `pageNotes` also preserves notes without resolvable verse links.
- `page`, `pageLabel`, `sourceUrl`, `scanUrl`: one-based physical page position, original page label, collection link, and image URL derived from the source scan filename. Missing/`NA` scans produce `null`. Links follow the existing reader's image mapping; the API does not fetch or verify remote image availability.

Ranges are ascending and contain at most 500 integer verse numbers. Gaps are preserved, not filled with reconstructed text; an empty range returns an empty array. The 1866 Nôm transcription in this repository has missing lines; available coverage differs by edition and script. Counts describe the available transcription, not a claim of historical completeness.

Every structured response identifies `schemaVersion`, an aggregate `corpusRevision`, and SHA-256 revisions of the exact XML bytes used per edition. Pair verse IDs with the corpus revision when citing results. References address pages, not precise image regions. The API does not yet provide region coordinates or independently verified bibliographic records.

## Concordance

```json
{
  "query": "trăm năm",
  "variants": [],
  "editions": ["1866", "1870", "1871", "1872", "1902"],
  "script": "quocNgu",
  "match": "exact_phrase",
  "caseSensitive": false,
  "diacriticSensitive": true,
  "contextVerses": 2,
  "pageSize": 50,
  "cursor": null
}
```

Only `query` is required. Defaults are shown except `contextVerses`, which defaults to 1. `query` and each of up to 20 `variants` contain 1–100 characters. Edition selections must be nonempty and unique. Scripts are `nom` and `quocNgu`.

- `substring` finds literal substrings, including within tokens.
- `exact_phrase` finds a literal string with Unicode letter/mark/number boundaries on both sides. Internal whitespace and punctuation must match exactly.
- `token` uses the same boundaries and accepts only a single contiguous letter/mark/number token. This is not Vietnamese linguistic word segmentation or Nôm character segmentation. Use substring queries for individual Nôm characters inside a line.

Matching uses NFC normalization. Optional quốc ngữ accent folding removes combining marks and maps `đ/Đ` to `d/D`; this option does not modify Nôm. Returned text remains original, including original accents. Matching does not span verse boundaries. Overlapping occurrences count separately; variant queries producing the same span count once.

The response includes exhaustive `totalOccurrences`, `totalMatchingVerses`, and `byEdition` counts even on the first page. `results` contains one entry per occurrence: verse/source data, `match` offsets and exact text, `kwic` left/keyword/right fields, and surrounding `context.before/after` verses. Context is 0–5 verses per side and can cross page boundaries. All offsets use UTF-16 code units in the returned original text; end is exclusive.

Results follow selected edition order, source verse order, then match position. `pageSize` is 1–200. Repeat the same settings with `nextCursor` until it is `null`. Cursors are bound to query settings (including page size) and corpus revision; mismatched or malformed cursors return 400. Counts across editions count separate witnesses, not unique aligned passages.

## Frequencies

Example: `/api/kieu/editions/1866/frequencies?script=nom&unit=character&pageSize=50`

Supported parameters:

- `script`: `quocNgu` (default) or `nom`.
- `unit`: `syllable` (default) or `character`. Nôm requires explicit `unit=character`.
- `caseSensitive=false`, `diacriticSensitive=true`, `minCount=1`, `pageSize=50`, optional `cursor`. Boolean query values must be exactly `true` or `false`.

Character units are Unicode grapheme clusters containing letters or numbers, excluding punctuation and whitespace. Syllable units are contiguous Unicode letters, marks, and numbers separated by punctuation or whitespace. They are orthographic units, not a linguistic word-segmentation model.

Responses include `totalUnits` before filtering, `totalForms` after `minCount` filtering, and paginated `results`: normalized `form`, occurrence `count`, `matchingVerses`, and original forms/counts. Forms sort by descending count, then deterministic lexical order. Original spellings are preserved even when normalization groups them.

## Comparison

Comparison returns rows keyed by exact source verse labels, original verse objects for each edition, and code-point differences against the first selected edition. Differences use `equal`, `delete`, and `insert` operations and preserve whitespace and supplementary Nôm characters.

`alignment.method` is `source-verse-label` and `alignment.verified` is **false**. Missing readings are `null`; statuses distinguish `missing`, `no-baseline`, `identical`, and `different`. This provides provisional comparison, not editorially established alignment. Renumbered, split, reordered, or omitted passages require scholarly review; the API does not silently infer correspondences. It does not implement curated alignment editing or automatic linguistic variant equivalence.

## Automatic Nôm spelling candidates

`POST /api/kieu/nom-variants` runs an aggregate comparison across the two selected editions without requiring individual search words:

```json
{"left":"1866","right":"1902","from":1,"to":10000,"term":null,"minOccurrences":1,"examplesPerVariant":2,"pageSize":30,"cursor":null}
```

Only `left` and `right` are required; they must differ. The default range covers all available source numbers, unlike the 500-number passage retrieval limit. `term` optionally restricts the comparison to one case/NFC-normalized Vietnamese syllable. `pageSize` is 1–100, `examplesPerVariant` 1–5. Cursors bind settings and revisions as for concordance. `minOccurrences` filters groups, while coverage counts still describe the whole selected analysis.

The method pairs exact source verse labels, requires identical case/NFC-normalized quốc ngữ syllable sequences, then pairs by position only when each Nôm line has the same number of letter/number grapheme clusters as Vietnamese syllables. Different Unicode graphemes are grouped by `(syllable, leftNom, rightNom)` with occurrence counts and sampled original verse pairs. Punctuation is excluded; unusual or missing encodings can make a verse ineligible. It does not force alignments across omissions, transcription changes, or incompatible unit counts.

The result includes exhaustive counts for this conservative method, paginated `results`, `totalVariantGroups`, `totalSyllablesWithVariants`, and `method.verified:false`. Coverage explicitly reports missing labels, differing transcriptions, incompatible glyph counts, eligible verse pairs, compared syllable positions, and differing Nôm positions. Results are candidate orthographic syllable correspondences, not verified semantic word readings or proof of historical visual glyph differences. Inspect source scans before scholarly interpretation.

## Exports

```json
{
  "kind": "concordance",
  "input": {"query":"trăm năm","editions":["1866"],"contextVerses":2},
  "format": "csv"
}
```

Other forms:

```json
{"kind":"verses","edition":"1866","input":{"from":1,"to":20},"format":"json"}
{"kind":"frequencies","edition":"1866","input":{"script":"nom","unit":"character"},"format":"csv"}
{"kind":"compare","input":{"from":1,"to":20,"editions":["1866","1870"]},"format":"json"}
{"kind":"edition","edition":"1866","format":"tei"}
{"kind":"edition","edition":"1866","format":"json"}
```

Verse, concordance, frequency, and comparison exports support `json` and `csv`. Whole-edition exports additionally support `tei`, returning the exact original XML with annotations and header. JSON/CSV whole-edition exports contain all available verses.

Exports contain complete matching results independently of `pageSize`; non-null cursors are rejected. Concordance exports are limited to 10,000 occurrences and all files to 20 MiB; narrow the query if the server returns 413. Complete research metadata is included in JSON and repeated in CSV metadata columns. CSV includes quoted cells, a UTF-8 BOM, and JSON cells for nested structures. Formula-leading cells receive an apostrophe for spreadsheet safety; use JSON/TEI for exact source text. Empty CSV results include a metadata-only row with empty result cells.

## Playground

The model has a `research_kieu` tool taking `{request: operationObject}`. Generated live previews receive:

```js
await kieu.research({
  operation: "concordance",
  input: { query: "trăm năm", editions: ["1866"], contextVerses: 2 }
});
```

Operations are `editions`, `verses`, `concordance`, `frequencies`, `compare`, and `nom_variants`. Pass `edition` for verse/frequency operations and `input` matching the relevant endpoint. The host validates requests and uses the existing source/channel, concurrency, rate, and cache controls; no provider key enters the preview.

The sandbox cannot navigate to source links, show external scan images, or directly download research exports; references can be displayed as text. Research requests require the live playground. Offline HTML retains basic `listVersions`, `getPage`, and capped `search`, and rejects `research` with an explicit error. Export research data through the public endpoints separately.

## Validation

```sh
node --test tests/kieu-research.test.cjs tests/ai-playground.test.cjs tests/ai-playground-catalog.test.cjs tests/playground-agent.test.cjs tests/ai-playground-ui.test.cjs
npx tsc --noEmit --incremental false
```

No AI provider calls or credentials are needed for these tests.
