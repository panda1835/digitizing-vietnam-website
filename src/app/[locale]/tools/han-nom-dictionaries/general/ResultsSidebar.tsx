"use client";

import type { MouseEvent } from "react";
import { Merriweather } from "next/font/google";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";

// Match the page's title typography.
const merriweather = Merriweather({ weight: "300", subsets: ["vietnamese"] });

function scrollToSource(event: MouseEvent<HTMLAnchorElement>, id: string) {
  event.preventDefault();
  const target = document.getElementById(id);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
  window.history.replaceState(null, "", `#${id}`);
}

type Section = { id: string; label: string };

export default function ResultsSidebar({
  sections,
  jumpTitle,
  filterTitle,
  allLabel,
  values,
  selected,
  onSelect,
  isCharChip,
  nomClass,
  bare = false,
}: {
  sections: Section[];
  jumpTitle: string;
  filterTitle: string;
  allLabel: string;
  values: string[];
  selected: string | null;
  onSelect: (value: string | null) => void;
  isCharChip: boolean;
  nomClass: string;
  // When true, render just the tabs/list without the bordered card wrapper —
  // used inside the mobile accordion, which already provides the container.
  bare?: boolean;
}) {
  const hasFilter = values.length > 1;
  const hasJump = sections.length > 0;
  if (!hasFilter && !hasJump) return null;

  const jumpList = (
    <nav className="flex flex-col">
      {sections.map((section) => (
        <a
          key={section.id}
          href={`#${section.id}`}
          onClick={(event) => scrollToSource(event, section.id)}
          className="group py-3 px-4 border-b border-gray-100 last:border-b-0 border-l-4 border-l-transparent hover:bg-branding-gray hover:border-l-branding-brown transition-colors"
        >
          <span
            className={`text-branding-black group-hover:text-branding-brown transition-colors ${merriweather.className}`}
          >
            {section.label}
          </span>
        </a>
      ))}
    </nav>
  );

  const chipClass = (active: boolean) =>
    `px-3 py-1 rounded-full border transition-colors ${
      active
        ? "bg-branding-brown text-white border-branding-brown shadow-sm"
        : "bg-white text-branding-black border-gray-300 hover:border-branding-brown hover:text-branding-brown"
    }`;

  const filterList = (
    <div className="flex flex-wrap gap-2 p-4">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className={chipClass(selected === null)}
      >
        {allLabel}
      </button>
      {values.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelect(selected === value ? null : value)}
          className={`${chipClass(selected === value)} ${
            isCharChip ? `text-2xl leading-none ${nomClass}` : ""
          }`}
        >
          {value}
        </button>
      ))}
    </div>
  );

  const triggerClass =
    "flex-1 rounded-none whitespace-nowrap text-xs px-2 py-2.5 " +
    "border-b-2 border-transparent bg-transparent text-gray-500 shadow-none " +
    "data-[state=active]:border-branding-brown data-[state=active]:text-branding-brown " +
    "data-[state=active]:bg-transparent data-[state=active]:shadow-none " +
    merriweather.className;

  // Only a jump list (no character/reading variety to filter on) — no tabs.
  const inner = !hasFilter ? (
    <>
      <div
        className={`p-4 border-b border-gray-200 text-lg text-branding-brown ${merriweather.className}`}
      >
        {jumpTitle}
      </div>
      {jumpList}
    </>
  ) : (
    <Tabs defaultValue={hasJump ? "jump" : "filter"} className="w-full">
      <TabsList className="w-full h-auto rounded-none bg-transparent border-b border-gray-200 p-0">
        {hasJump && (
          <TabsTrigger value="jump" className={triggerClass}>
            {jumpTitle}
          </TabsTrigger>
        )}
        <TabsTrigger value="filter" className={triggerClass}>
          {filterTitle}
        </TabsTrigger>
      </TabsList>
      {hasJump && (
        <TabsContent value="jump" className="mt-0">
          {jumpList}
        </TabsContent>
      )}
      <TabsContent value="filter" className="mt-0">
        {filterList}
      </TabsContent>
    </Tabs>
  );

  if (bare) return inner;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {inner}
    </div>
  );
}
