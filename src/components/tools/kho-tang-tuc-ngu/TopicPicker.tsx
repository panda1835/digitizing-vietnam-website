"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChuDe, TieuChuDe, foldDiacritics } from "./data";

const focusClass =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-branding-brown";

/** The book prints Chủ đề titles in capitals; shown in sentence case. */
function sentenceCase(title: string): string {
  return title
    .toLocaleLowerCase("vi")
    .split(". ")
    .map((s) => s.charAt(0).toLocaleUpperCase("vi") + s.slice(1))
    .join(". ");
}

/**
 * A searchable dropdown of the Tiểu chủ đề, grouped under their Chủ đề.
 * Typing matches either title, ignoring diacritics; a Chủ đề that matches
 * shows all of its Tiểu chủ đề.
 */
export function TopicPicker({
  topics,
  selected,
  onSelect,
}: {
  topics: ChuDe[];
  selected: TieuChuDe | null;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("Tools.ca-dao-tuc-ngu.kho-tang");
  const locale = useLocale();
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const parent = selected
    ? topics.find((chuDe) => chuDe.subtopics.includes(selected))
    : undefined;

  const groups = useMemo(() => {
    const needle = foldDiacritics(query.trim());
    return topics
      .map((chuDe) => ({
        chuDe,
        subtopics:
          !needle || foldDiacritics(chuDe.title).includes(needle)
            ? chuDe.subtopics
            : chuDe.subtopics.filter((s) =>
                foldDiacritics(s.title).includes(needle)
              ),
      }))
      .filter((g) => g.subtopics.length > 0);
  }, [topics, query]);
  const flat = useMemo(() => groups.flatMap((g) => g.subtopics), [groups]);

  // Opening starts at the chosen Tiểu chủ đề; typing starts at the top.
  useEffect(() => {
    if (!open) return;
    setActive(Math.max(0, query ? 0 : flat.findIndex((s) => s === selected)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const choose = (s: TieuChuDe) => {
    onSelect(s.id);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flat[active]) {
      e.preventDefault();
      choose(flat[active]);
    }
  };

  return (
    <div className="relative">
      <Popover
        modal
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <PopoverTrigger
          className={`w-full min-h-11 flex items-center gap-2 rounded-lg border bg-white py-2 pl-3 text-left text-sm transition-colors hover:border-branding-brown ${
            selected
              ? "pr-11 border-branding-brown"
              : "pr-3 border-branding-black/20"
          } ${focusClass}`}
        >
          {selected ? (
            <span className="flex-1 min-w-0">
              {parent && (
                <span className="block text-xs text-branding-black/65 truncate">
                  {parent.id}. {sentenceCase(parent.title)}
                </span>
              )}
              <span className="block font-medium text-branding-black leading-snug line-clamp-2">
                {selected.title}
              </span>
            </span>
          ) : (
            <>
              <span className="flex-1 text-branding-black/65">
                {t("all-topics")}
              </span>
              <ChevronsUpDown
                className="h-4 w-4 shrink-0 text-branding-black/50"
                aria-hidden
              />
            </>
          )}
        </PopoverTrigger>
        <PopoverContent
          aria-label={t("topic")}
          align="start"
          className="w-[min(26rem,calc(100vw-2rem))] p-0 bg-white overflow-hidden"
        >
          <div className="flex items-center gap-2 border-b border-branding-black/10 px-3">
            <Search
              className="h-4 w-4 shrink-0 text-branding-black/50"
              aria-hidden
            />
            <input
              autoFocus
              role="combobox"
              aria-expanded
              aria-controls={listId}
              aria-activedescendant={
                flat[active] ? `${listId}-${flat[active].id}` : undefined
              }
              aria-label={t("topic-search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={t("topic-search")}
              className="h-12 w-full bg-transparent text-base sm:text-sm text-branding-black placeholder:text-branding-black/60 focus:outline-none"
            />
          </div>
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={t("topic")}
            className="max-h-[min(24rem,55vh)] overflow-y-auto overscroll-contain pb-1"
          >
            {groups.map(({ chuDe, subtopics }) => (
              <div key={chuDe.id} role="group" aria-label={chuDe.title}>
                <div className="sticky top-0 z-10 border-b border-branding-brown/15 bg-white px-3 pb-1.5 pt-3 text-xs font-semibold leading-relaxed text-[#805516]">
                  {chuDe.id}. {sentenceCase(chuDe.title)}
                </div>
                {subtopics.map((s) => {
                  const index = flat.indexOf(s);
                  const isSelected = s === selected;
                  return (
                    <div
                      key={s.id}
                      id={`${listId}-${s.id}`}
                      data-index={index}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => choose(s)}
                      onMouseMove={() => setActive(index)}
                      className={`flex cursor-pointer items-start gap-2 px-3 py-2.5 text-sm leading-snug ${
                        index === active ? "bg-branding-brown/10" : ""
                      }`}
                    >
                      <Check
                        className={`mt-0.5 h-4 w-4 shrink-0 text-[#956319] ${
                          isSelected ? "" : "invisible"
                        }`}
                        aria-hidden
                      />
                      <span
                        className={`flex-1 min-w-0 ${
                          isSelected
                            ? "font-semibold text-[#805516]"
                            : "text-branding-black"
                        }`}
                      >
                        {s.title}
                      </span>
                      <span className="text-xs tabular-nums text-branding-black/70">
                        {s.entries.length.toLocaleString(locale)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
            {groups.length === 0 && (
              <p className="px-3 py-6 text-center text-sm text-branding-black/65">
                {t("topic-empty")}
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {selected && (
        <button
          type="button"
          onClick={() => onSelect("")}
          aria-label={t("clear-topic")}
          className={`absolute right-1 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-md text-branding-black/60 hover:bg-branding-brown/10 hover:text-[#956319] ${focusClass}`}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}
