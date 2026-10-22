"use client";
import { useRouter } from "@/i18n/routing";
import { explorerHref } from "./Link";
import { useState } from "react";

export default function SearchBox({ initial = "", autoFocus = false }: { initial?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  return (
    <form
      className="flex gap-3 w-full"
      onSubmit={(e) => {
        e.preventDefault();
        const v = q.trim();
        if (v) router.push(explorerHref(`/search?q=${encodeURIComponent(v)}`));
      }}
    >
      <label className="flex-1 flex items-center gap-3 bg-white rounded-full border border-primary-gray px-5 h-12 shadow-sm focus-within:border-branding-brown">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--ink-3)] shrink-0" aria-hidden>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus={autoFocus}
          placeholder="A component (可, 氵, 堯) or a Sino-Vietnamese reading (khả)"
          className="han flex-1 bg-transparent outline-none text-lg placeholder:font-sans placeholder:text-base placeholder:text-[var(--ink-3)]"
          aria-label="Component or reading"
        />
      </label>
      <button className="h-12 px-6 rounded-xl bg-branding-black text-white text-[15px] hover:bg-black">Search</button>
    </form>
  );
}
