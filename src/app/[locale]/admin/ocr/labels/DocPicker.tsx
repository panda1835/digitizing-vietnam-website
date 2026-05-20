"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

/**
 * Document filter for the labels page. Setting a document scopes both the
 * frequent-corrections sidebar and the search-results grid to that one
 * manuscript, so the user can spot per-document recurring OCR errors and
 * drill into them without corpus-wide noise. Choosing the blank option
 * clears the param and restores the corpus-wide view.
 */
export default function DocPicker({
  docs,
  current,
}: {
  docs: Array<{ slug: string; title: string }>;
  current: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(params.toString());
    const value = e.target.value;
    if (value) next.set("doc", value);
    else next.delete("doc");
    // Changing scope resets paging — an old page number is meaningless
    // against a different result set.
    next.delete("p");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  return (
    <label className="flex items-center gap-2 text-xs text-gray-500">
      <span className="shrink-0">Document:</span>
      <select
        value={current}
        onChange={onChange}
        className="flex-1 min-w-0 px-2 py-1 text-sm border border-gray-300 rounded bg-white focus:outline-none focus:border-indigo-400"
      >
        <option value="">All documents</option>
        {docs.map((d) => (
          <option key={d.slug} value={d.slug}>
            {d.title}
          </option>
        ))}
      </select>
    </label>
  );
}
