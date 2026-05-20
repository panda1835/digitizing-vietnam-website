"use client";

import { useState } from "react";

interface RelabelCellProps {
  slug: string;
  page: number;
  offset: number;
  initialText: string;
}

export default function RelabelCell({
  slug,
  page,
  offset,
  initialText,
}: RelabelCellProps) {
  const [draft, setDraft] = useState(initialText);
  const [committed, setCommitted] = useState(initialText);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const dirty = draft !== committed;

  async function save() {
    if (!dirty) return;
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/admin/ocr/char-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, page, offset, text: draft }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      setCommitted(draft);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 1500);
    } catch (e: any) {
      setError(e?.message ?? "save failed");
      setStatus("error");
    }
  }

  return (
    <div className="flex items-center gap-1">
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
        }}
        maxLength={8}
        className={`w-14 px-1.5 py-1 text-base font-han-nom text-center border rounded focus:outline-none ${
          dirty ? "border-amber-400 bg-amber-50" : "border-gray-300"
        }`}
      />
      <button
        type="button"
        onClick={save}
        disabled={!dirty || status === "saving"}
        className="px-2 py-1 text-[10px] font-medium rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-30"
      >
        {status === "saving" ? "…" : "Save"}
      </button>
      {status === "saved" && (
        <span className="text-[10px] text-emerald-600">✓ Saved</span>
      )}
      {status === "error" && (
        <span className="text-[10px] text-red-600" title={error ?? ""}>
          ✕ {error}
        </span>
      )}
    </div>
  );
}
