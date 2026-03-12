"use client";

import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface JumpItem {
  id: string;
  label: string;
}

function scrollToSource(event: MouseEvent<HTMLAnchorElement>, id: string) {
  event.preventDefault();
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
}

export default function JumpToSourceMenu({ locale }: { locale: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<JumpItem[]>([]);

  useEffect(() => {
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-general-source-id]")
    );

    const nextItems = sections
      .map((section) => ({
        id: section.dataset.generalSourceId || "",
        label: section.dataset.generalSourceLabel || "",
      }))
      .filter((item) => item.id && item.label);

    setItems(nextItems);
  }, [pathname, searchParams]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="text-lg font-normal text-branding-brown">
          {locale === "en" ? "Jump to source" : "Đến nguồn"}
        </div>
      </div>
      <nav className="flex flex-col">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(event) => scrollToSource(event, item.id)}
            className="py-3 px-6 border-b border-gray-100 hover:bg-gray-50 hover:border-l-branding-brown hover:border-l-4 transition-colors relative group"
          >
            <span className="text-gray-800">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
