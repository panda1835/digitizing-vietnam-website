import { NextRequest, NextResponse } from "next/server";
import { ocrSupabase } from "@/lib/ocr-supabase";

/**
 * POST /api/admin/ocr/bulk-relabel
 *
 * Apply one relabel (glyph text → `to`) to many occurrences at once,
 * writing ONLY the affected characters — not whole pages.
 *
 * The labels page used to fire one /char-edit PER occurrence, and each
 * char-edit did getPage → setPage, a full read-modify-write of the
 * entire page (every text_unit/version/candidate reassembled and
 * shredded back). N occurrences = N whole-page rewrites, sequentially.
 *
 * A relabel is, per glyph, exactly what setPage does for a changed
 * char: append one append-only `text_versions` row (source='human')
 * and refresh the denormalized `current_text`. So here we do just that,
 * targeted and in bulk:
 *
 *   1. resolve targets → text_unit ids (slug→doc→page→unit)
 *   2. bulk-insert one human text_versions row per changed unit
 *   3. bulk-update text_units.current_text for those units
 *
 * A handful of set-based round-trips total, regardless of N. The
 * append-only audit trail is preserved (history rows are added, never
 * mutated); getPage still reconstructs the glyph from the latest
 * non-QN version, and the labels aggregate reads the denorm we update —
 * both stay consistent. (pages.ocr_status / workflow timestamps are
 * intentionally untouched: a text correction isn't a workflow change.)
 *
 * Body: { to: string, targets: {slug,page,offset}[], expect?: string }
 *   - `expect` (optional): only relabel an occurrence whose current
 *     text still equals this; others are skipped, not clobbered.
 *
 * Returns: { ok, done, failed, skipped, pages, errors }
 */

export const dynamic = "force-dynamic";

const SRC_HUMAN = "human";

interface Target {
  slug: string;
  page: number;
  offset: number;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function POST(req: NextRequest) {
  let body: { to?: string; expect?: string; targets?: Target[] } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "expected JSON body" }, { status: 400 });
  }

  const to = body.to;
  const expect = typeof body.expect === "string" ? body.expect : undefined;
  const targets = (body.targets ?? []).filter(
    (t) =>
      t &&
      typeof t.slug === "string" &&
      typeof t.page === "number" &&
      typeof t.offset === "number"
  );
  if (typeof to !== "string" || to.length === 0) {
    return NextResponse.json(
      { error: "`to` must be a non-empty string" },
      { status: 400 }
    );
  }
  if (targets.length === 0) {
    return NextResponse.json(
      { error: "`targets` must be a non-empty array" },
      { status: 400 }
    );
  }

  const db = ocrSupabase();
  let done = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    // 1a. slug → document id.
    const slugs = [...new Set(targets.map((t) => t.slug))];
    const { data: docs, error: dErr } = await db
      .from("documents")
      .select("id,slug")
      .in("slug", slugs);
    if (dErr) throw new Error(`documents: ${dErr.message}`);
    const docIdBySlug = new Map<string, string>();
    for (const d of (docs ?? []) as { id: string; slug: string }[]) {
      docIdBySlug.set(d.slug, d.id);
    }

    // 1b. (document_id, page_number) → page id.
    const docIds = [...new Set([...docIdBySlug.values()])];
    const pageIdByDocPage = new Map<string, string>();
    for (const part of chunk(docIds, 100)) {
      const { data: pgs, error: pErr } = await db
        .from("pages")
        .select("id,document_id,page_number")
        .in("document_id", part);
      if (pErr) throw new Error(`pages: ${pErr.message}`);
      for (const p of (pgs ?? []) as {
        id: string;
        document_id: string;
        page_number: number;
      }[]) {
        pageIdByDocPage.set(`${p.document_id} ${p.page_number}`, p.id);
      }
    }

    // Group the wanted offsets per resolved page id.
    const offsetsByPage = new Map<string, Set<number>>();
    for (const t of targets) {
      const docId = docIdBySlug.get(t.slug);
      if (!docId) {
        failed++;
        continue;
      }
      const pid = pageIdByDocPage.get(`${docId} ${t.page}`);
      if (!pid) {
        failed++;
        continue;
      }
      let s = offsetsByPage.get(pid);
      if (!s) {
        s = new Set();
        offsetsByPage.set(pid, s);
      }
      s.add(t.offset);
    }

    // 1c. Resolve the actual text_units (id, run, current text) for the
    // wanted (page, offset) pairs. One query per page (offsets chunked).
    interface Unit {
      id: string;
      ocr_run_id: string;
      current_text: string | null;
    }
    const changeIds: string[] = [];
    const versionRows: Array<{
      text_unit_id: string;
      ocr_run_id: string;
      text: string;
      source: string;
    }> = [];

    for (const [pid, offs] of offsetsByPage) {
      const offList = [...offs];
      for (const part of chunk(offList, 100)) {
        const { data: us, error: uErr } = await db
          .from("text_units")
          .select("id,ocr_run_id,current_text,offset")
          .eq("page_id", pid)
          .in("offset", part);
        if (uErr) throw new Error(`text_units: ${uErr.message}`);
        for (const u of (us ?? []) as (Unit & { offset: number })[]) {
          const cur = u.current_text ?? "";
          if (expect !== undefined && cur !== expect) {
            skipped++;
            continue;
          }
          if (cur === to) {
            // Already the target — no redundant history row.
            skipped++;
            continue;
          }
          versionRows.push({
            text_unit_id: u.id,
            ocr_run_id: u.ocr_run_id,
            text: to,
            source: SRC_HUMAN,
          });
          changeIds.push(u.id);
          done++;
        }
      }
    }

    // 2. Append the human correction rows (audit trail; append-only).
    for (const part of chunk(versionRows, 500)) {
      const { error } = await db.from("text_versions").insert(part);
      if (error) throw new Error(`text_versions insert: ${error.message}`);
    }

    // 3. Refresh the denormalized current_text these reads use. This is
    // exactly the value refresh_page_denorm would compute now that the
    // latest non-QN version of each unit is the row we just inserted.
    for (const part of chunk(changeIds, 100)) {
      const { error } = await db
        .from("text_units")
        .update({ current_text: to })
        .in("id", part);
      if (error) throw new Error(`text_units denorm: ${error.message}`);
    }
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        done,
        failed,
        skipped,
        pages: 0,
        errors: [e?.message ?? "bulk relabel failed"],
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: failed === 0,
    done,
    failed,
    skipped,
    pages: 0,
    errors: errors.slice(0, 20),
  });
}
