import { NextRequest, NextResponse } from "next/server";
import { getPage, setPage } from "@/lib/ocr-store-supabase";
import { buildRawText } from "@/lib/reading-order";

/**
 * POST /api/admin/ocr/char-edit
 *
 * Patch a single character on a saved page. Atomic on the server:
 * GET → modify in-memory → setPage in one round trip. Used by the OCR
 * labels page for inline relabels, bulk relabels, and metadata edits.
 *
 * Body: { slug, page, offset, text?, uncertain?, noReadingForm?, ids?, note? }
 *
 * `text` is the only field treated specially (it re-derives `rawText`;
 * the Supabase store records the change as an append-only `text_versions`
 * row and derives `originalText` from the OCR-origin version on read).
 * The other fields are pure metadata patches: pass `null` (or omit) to
 * leave a field unchanged; pass an empty string to clear `ids`/`note`;
 * pass a boolean to set the flag.
 *
 * NOTE: `uncertain` / `noReadingForm` / `ids` persist via the in-place
 * `text_units` update in `setPage`. A `note`-only change (text unchanged
 * on an already-OCR'd glyph) is not yet persisted by the Supabase store
 * — `correction_note` only rides along a new text version. Known
 * limitation; relabel + flag edits (the primary flow) work.
 */
export async function POST(req: NextRequest) {
  let body: {
    slug?: string;
    page?: number;
    offset?: number;
    text?: string;
    uncertain?: boolean | null;
    noReadingForm?: boolean | null;
    ids?: string | null;
    note?: string | null;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "expected JSON body" }, { status: 400 });
  }
  const { slug, page, offset, text, uncertain, noReadingForm, ids, note } =
    body;
  if (
    typeof slug !== "string" ||
    typeof page !== "number" ||
    typeof offset !== "number"
  ) {
    return NextResponse.json(
      { error: "slug, page, offset required" },
      { status: 400 }
    );
  }
  // `text` is optional (a metadata-only patch can omit it), but if
  // provided it must be a string.
  if (text !== undefined && typeof text !== "string") {
    return NextResponse.json(
      { error: "text must be a string when provided" },
      { status: 400 }
    );
  }

  try {
    const data = await getPage(slug, page);
    if (!data) {
      return NextResponse.json({ error: "page not found" }, { status: 404 });
    }
    const idx = data.spatialData.findIndex((c) => c.offset === offset);
    if (idx < 0) {
      return NextResponse.json({ error: "char not found" }, { status: 404 });
    }
    const prev = data.spatialData[idx];
    const oldText = prev.text;
    const textChanged = typeof text === "string" && text !== oldText;
    const next = { ...prev };
    if (typeof text === "string") next.text = text;
    // Booleans: explicit boolean assigns; undefined/null leaves unchanged.
    // We delete the key on `false` to match how the editor stores these.
    if (uncertain === true) next.uncertain = true;
    else if (uncertain === false) delete next.uncertain;
    if (noReadingForm === true) next.noReadingForm = true;
    else if (noReadingForm === false) delete next.noReadingForm;
    // Strings: empty string clears the field.
    if (typeof ids === "string") {
      if (ids.length > 0) next.ids = ids;
      else delete next.ids;
    }
    if (typeof note === "string") {
      if (note.length > 0) next.note = note;
      else delete next.note;
    }
    data.spatialData[idx] = next;
    if (textChanged) {
      data.rawText = buildRawText(data.spatialData);
    }

    await setPage(slug, page, data);

    return NextResponse.json({
      ok: true,
      oldText,
      newText: typeof text === "string" ? text : oldText,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "char-edit failed" },
      { status: 500 }
    );
  }
}
