"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const IDS_OPERATORS = [
  "⿰", "⿱", "⿲", "⿳", "⿴", "⿵", "⿶", "⿷",
  "⿸", "⿹", "⿺", "⿻",
];

interface MetadataEditPopoverProps {
  slug: string;
  page: number;
  offset: number;
  initialUncertain: boolean;
  initialNoReadingForm: boolean;
  initialIds: string;
  initialNote: string;
}

/**
 * Per-result metadata editor: uncertain / no-reading-form flags, IDS, note.
 * Renders a small ✎ trigger that opens a popover anchored to the bottom-
 * right of the parent card. Save dispatches only the changed fields to
 * /api/admin/ocr/char-edit so unedited fields are not overwritten.
 *
 * NOTE: the Supabase store persists uncertain / no-reading-form / IDS via
 * its in-place text_units update. A note-only change on an already-OCR'd
 * glyph is not yet persisted by the store (correction_note only rides a
 * new text version) — a known store-level limitation.
 */
export default function MetadataEditPopover({
  slug,
  page,
  offset,
  initialUncertain,
  initialNoReadingForm,
  initialIds,
  initialNote,
}: MetadataEditPopoverProps) {
  const [open, setOpen] = useState(false);
  const [uncertain, setUncertain] = useState(initialUncertain);
  const [noReadingForm, setNoReadingForm] = useState(initialNoReadingForm);
  const [ids, setIds] = useState(initialIds);
  const [note, setNote] = useState(initialNote);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const idsInputRef = useRef<HTMLInputElement>(null);
  // Anchor coords for the portalled popover. We track the trigger button's
  // viewport rect because the popover renders at document.body via portal
  // (so it escapes the result card's stacking context — sibling cards are
  // their own stacking contexts and were painting on top of an in-card
  // popover, making it look transparent).
  const [anchor, setAnchor] = useState<{
    top: number;
    right: number;
  } | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    function update() {
      const t = triggerRef.current;
      if (!t) return;
      const r = t.getBoundingClientRect();
      // Popover sits above the trigger, with its right edge aligned to the
      // trigger's right edge.
      setAnchor({ top: r.top, right: window.innerWidth - r.right });
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  // The "committed" snapshot is what's currently saved. We start from the
  // props but advance it after every successful save so re-opening the
  // popover later in the same session shows accurate baselines.
  const [committed, setCommitted] = useState({
    uncertain: initialUncertain,
    noReadingForm: initialNoReadingForm,
    ids: initialIds,
    note: initialNote,
  });
  const dirty =
    uncertain !== committed.uncertain ||
    noReadingForm !== committed.noReadingForm ||
    ids !== committed.ids ||
    note !== committed.note;

  // Click-outside / Esc to close. Save state isn't lost — fields are
  // controlled by useState so closing then reopening keeps user input
  // until they explicitly save or hit Reset.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      // The popover is portalled to document.body, so neither the trigger
      // nor the panel are descendants of any single ref. Treat both as
      // "inside" so clicks on either don't close.
      const inPanel = !!popoverRef.current?.contains(t);
      const inTrigger = !!triggerRef.current?.contains(t);
      if (!inPanel && !inTrigger) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function insertIdsOperator(op: string) {
    const input = idsInputRef.current;
    const start = input?.selectionStart ?? ids.length;
    const end = input?.selectionEnd ?? ids.length;
    const next = ids.slice(0, start) + op + ids.slice(end);
    setIds(next);
    requestAnimationFrame(() => {
      input?.focus();
      const caret = start + op.length;
      input?.setSelectionRange(caret, caret);
    });
  }

  async function save() {
    if (!dirty) return;
    setStatus("saving");
    setError(null);
    // Only send fields that actually changed so the API doesn't clobber
    // unrelated metadata that may have been edited elsewhere.
    const patch: Record<string, unknown> = { slug, page, offset };
    if (uncertain !== committed.uncertain) patch.uncertain = uncertain;
    if (noReadingForm !== committed.noReadingForm)
      patch.noReadingForm = noReadingForm;
    if (ids !== committed.ids) patch.ids = ids;
    if (note !== committed.note) patch.note = note;
    try {
      const res = await fetch("/api/admin/ocr/char-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setCommitted({ uncertain, noReadingForm, ids, note });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    } catch (e: any) {
      setError(e?.message ?? "save failed");
      setStatus("error");
    }
  }

  function reset() {
    setUncertain(committed.uncertain);
    setNoReadingForm(committed.noReadingForm);
    setIds(committed.ids);
    setNote(committed.note);
  }

  // Visual cue on the trigger when the cell already has any metadata set,
  // so the user can scan a results page for chars that have been touched.
  const hasMetadata =
    committed.uncertain ||
    committed.noReadingForm ||
    committed.ids.length > 0 ||
    committed.note.length > 0;

  return (
    <div className="absolute bottom-1.5 right-1.5 z-10">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Edit metadata (uncertain, no reading form, IDS, note)"
        aria-label="Edit metadata"
        className={`inline-flex items-center justify-center w-6 h-6 rounded border text-[11px] leading-none shadow-sm ${
          hasMetadata
            ? "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
            : "bg-white border-gray-300 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300"
        }`}
      >
        ✎
      </button>
      {open && anchor && typeof document !== "undefined" &&
        createPortal(
          <div
            ref={popoverRef}
            style={{
              position: "fixed",
              top: anchor.top - 8,
              right: anchor.right,
              transform: "translateY(-100%)",
              zIndex: 1000,
            }}
            className="w-72 bg-white border border-gray-300 rounded-lg shadow-xl p-3 text-xs space-y-2"
            // Stop click-outside from firing on internal clicks (the
            // document mousedown handler still closes on outside clicks).
            onMouseDown={(e) => e.stopPropagation()}
          >
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={uncertain}
                onChange={(e) => setUncertain(e.target.checked)}
              />
              <span>Uncertain</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={noReadingForm}
                onChange={(e) => setNoReadingForm(e.target.checked)}
              />
              <span>No reading form</span>
            </label>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                IDS
              </div>
              <div className="flex flex-wrap gap-0.5 mb-1">
                {IDS_OPERATORS.map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => insertIdsOperator(op)}
                    className="px-1.5 py-0.5 text-base font-han-nom border border-gray-300 rounded hover:bg-indigo-50 hover:border-indigo-400 leading-none"
                  >
                    {op}
                  </button>
                ))}
              </div>
              <input
                ref={idsInputRef}
                type="text"
                value={ids}
                onChange={(e) => setIds(e.target.value)}
                placeholder="e.g. ⿰口巴"
                className="w-full px-2 py-1 text-sm font-han-nom border border-gray-300 rounded focus:outline-none focus:border-indigo-400"
              />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">
                Note
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-indigo-400 resize-y"
              />
            </div>
            <div className="flex items-center gap-1 pt-1">
              <button
                type="button"
                onClick={save}
                disabled={!dirty || status === "saving"}
                className="px-2 py-1 text-[11px] font-medium rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-30"
              >
                {status === "saving" ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={reset}
                disabled={!dirty}
                className="px-2 py-1 text-[11px] rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-30"
              >
                Reset
              </button>
              {status === "saved" && (
                <span className="text-[10px] text-emerald-600 ml-1">
                  ✓ Saved
                </span>
              )}
              {status === "error" && (
                <span
                  className="text-[10px] text-red-600 ml-1"
                  title={error ?? ""}
                >
                  ✕ {error}
                </span>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto text-[11px] text-gray-400 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
