"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import {
  DYNASTIES,
  HEAVENLY_STEMS,
  EARTHLY_BRANCHES,
  getSexagenary,
  isValidSexagenary,
  getYearsForSexagenary,
  getActiveReigns,
  type Dynasty,
  type ActiveReign,
} from "./data";
import { CHINESE_DYNASTIES } from "./dataChinese";
import {
  gregorianToLunar,
  lunarToGregorian,
  LUNAR_MONTH_NAMES,
  GREGORIAN_MONTHS,
} from "./lunarCalendar";

type Tab = "reign" | "gregorian" | "sexagenary";

function SexagenaryBadge({ year }: { year: number }) {
  const { stem, branch } = getSexagenary(year);
  return (
    <span className="inline-flex items-center gap-1 text-branding-brown font-semibold">
      {stem.vi} {branch.vi}
      <span className="text-branding-brown/60 font-normal text-sm ml-1">
        ({stem.han}{branch.han})
      </span>
    </span>
  );
}

function ReignTag({ ar }: { ar: ActiveReign }) {
  const t = useTranslations("ResearchHub.HanNomHub.DateConverter");
  return (
    <div className="rounded-xl border border-branding-brown/15 bg-white p-4 space-y-1">
      <p className="text-xs uppercase tracking-widest text-branding-brown/60 font-bold">
        {ar.dynasty.en}
      </p>
      <p className="font-semibold text-branding-black text-lg leading-tight">
        {ar.reign.name}{" "}
        <span className="text-branding-brown/70 font-normal text-base">({ar.reign.han})</span>
      </p>
      <p className="text-sm text-muted-foreground">{t("shared.ruler")} {ar.reign.ruler}</p>
      <p className="text-sm text-branding-black/80">
        <span className="font-bold">{t("shared.year-of-reign", { n: ar.yearNumber })}</span>
        &nbsp;({ar.reign.startYear}–{ar.reign.endYear})
      </p>
    </div>
  );
}

function LunarDateDisplay({
  ld,
  lm,
  ly,
  leap,
}: {
  ld: number;
  lm: number;
  ly: number;
  leap: boolean;
}) {
  const { stem, branch } = getSexagenary(ly);
  return (
    <p className="text-base text-branding-black/80">
      Ngày {ld},{" "}
      <span className="font-semibold">
        {leap ? `tháng nhuận ${lm}` : LUNAR_MONTH_NAMES[lm - 1]}
      </span>
      , năm {ly} âm lịch{" "}
      <span className="text-branding-brown/70">
        ({stem.vi} {branch.vi} · {stem.han}{branch.han})
      </span>
    </p>
  );
}

interface SearchResult {
  dynasty: Dynasty;
  reignIndex: number;
}

export default function DateCalculatorClient() {
  const t = useTranslations("ResearchHub.HanNomHub.DateConverter");
  const [activeTab, setActiveTab] = useState<Tab>("gregorian");
  const [includeChinese, setIncludeChinese] = useState(false);

  // All available dynasties based on toggle
  const allDynasties: Dynasty[] = useMemo(
    () => (includeChinese ? [...DYNASTIES, ...CHINESE_DYNASTIES] : DYNASTIES),
    [includeChinese]
  );

  // ── Tab 1: Reign → Date ────────────────────────────────────────────────
  const [dynastyId, setDynastyId] = useState("");
  const [reignIndex, setReignIndex] = useState(0);
  const [reignYearNum, setReignYearNum] = useState(1);
  const [lunarMonthStr, setLunarMonthStr] = useState("");
  const [lunarDayStr, setLunarDayStr] = useState("");
  const [lunarIsLeap, setLunarIsLeap] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [reignResult, setReignResult] = useState<{
    ceYear: number;
    gregorianDate?: { day: number; month: number; year: number };
    lunarDay?: number;
    lunarMonth?: number;
    lunarYear?: number;
    lunarLeap?: boolean;
    error?: string;
  } | null>(null);

  const selectedDynasty = allDynasties.find((d) => d.id === dynastyId) ?? null;
  const selectedReign = selectedDynasty?.reigns[reignIndex] ?? null;
  const maxYear = selectedReign ? selectedReign.endYear - selectedReign.startYear + 1 : 1;

  // Search across all dynasties and reigns
  const searchResults: SearchResult[] = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: SearchResult[] = [];
    for (const dynasty of allDynasties) {
      dynasty.reigns.forEach((reign, i) => {
        if (
          reign.name.toLowerCase().includes(q) ||
          reign.han.includes(searchQuery.trim()) ||
          reign.ruler.toLowerCase().includes(q) ||
          dynasty.name.toLowerCase().includes(q) ||
          dynasty.han.includes(searchQuery.trim())
        ) {
          results.push({ dynasty, reignIndex: i });
        }
      });
    }
    return results.slice(0, 12);
  }, [searchQuery, allDynasties]);

  function selectFromSearch(result: SearchResult) {
    setDynastyId(result.dynasty.id);
    setReignIndex(result.reignIndex);
    setSearchQuery("");
    setShowSearchResults(false);
    setReignResult(null);
  }

  function calcFromReign() {
    if (!selectedReign) return;
    if (reignYearNum < 1 || reignYearNum > maxYear) {
      setReignResult({ ceYear: 0, error: t("reign-tab.invalid-year", { max: maxYear }) });
      return;
    }
    const ceYear = selectedReign.startYear + reignYearNum - 1;
    const lm = lunarMonthStr ? parseInt(lunarMonthStr) : null;
    const ld = lunarDayStr ? parseInt(lunarDayStr) : null;

    if (lm !== null && ld !== null && !isNaN(lm) && !isNaN(ld) && lm >= 1 && lm <= 12 && ld >= 1 && ld <= 30) {
      const gDate = lunarToGregorian(ld, lm, ceYear, lunarIsLeap);
      if (!gDate) {
        setReignResult({ ceYear, error: t("reign-tab.invalid-lunar") });
      } else {
        setReignResult({ ceYear, gregorianDate: gDate, lunarDay: ld, lunarMonth: lm, lunarYear: ceYear, lunarLeap: lunarIsLeap });
      }
    } else {
      setReignResult({ ceYear });
    }
  }

  // ── Tab 2: Gregorian → Vietnamese ─────────────────────────────────────
  const [ceDayStr, setCeDayStr] = useState("");
  const [ceMonthStr, setCeMonthStr] = useState("");
  const [ceYearStr, setCeYearStr] = useState("");
  const [gregorianResults, setGregorianResults] = useState<ActiveReign[] | null>(null);
  const [gregorianCeYear, setGregorianCeYear] = useState<number | null>(null);
  const [lunarDateOutput, setLunarDateOutput] = useState<{
    lunarDay: number; lunarMonth: number; lunarYear: number; isLeapMonth: boolean;
  } | null>(null);

  function calcFromGregorian() {
    const y = parseInt(ceYearStr);
    if (isNaN(y)) return;
    const d = parseInt(ceDayStr);
    const m = parseInt(ceMonthStr);
    setGregorianCeYear(y);

    // For reign lookup, filter by active reigns — include Chinese if toggled
    const allResults: ActiveReign[] = [];
    for (const dynasty of allDynasties) {
      for (const reign of dynasty.reigns) {
        if (y >= reign.startYear && y <= reign.endYear) {
          allResults.push({ dynasty, reign, yearNumber: y - reign.startYear + 1 });
        }
      }
    }
    setGregorianResults(allResults);

    if (!isNaN(d) && !isNaN(m) && d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      try {
        const lunar = gregorianToLunar(d, m, y);
        setLunarDateOutput(lunar);
      } catch {
        setLunarDateOutput(null);
      }
    } else {
      setLunarDateOutput(null);
    }
  }

  // ── Tab 3: Sexagenary → CE Years ───────────────────────────────────────
  const [stemIdx, setStemIdx] = useState(0);
  const [branchIdx, setBranchIdx] = useState(0);
  const [fromYear, setFromYear] = useState(618);
  const [toYear, setToYear] = useState(1945);
  const [sexResults, setSexResults] = useState<number[] | null>(null);
  const sexValid = isValidSexagenary(stemIdx, branchIdx);

  function calcSexagenary() {
    if (!sexValid) return;
    setSexResults(getYearsForSexagenary(stemIdx, branchIdx, fromYear, toYear));
  }

  function getActiveReignsForYear(year: number): ActiveReign[] {
    const results: ActiveReign[] = [];
    for (const dynasty of allDynasties) {
      for (const reign of dynasty.reigns) {
        if (year >= reign.startYear && year <= reign.endYear) {
          results.push({ dynasty, reign, yearNumber: year - reign.startYear + 1 });
        }
      }
    }
    return results;
  }

  // ── Shared styles ──────────────────────────────────────────────────────
  const tabClass = (t: Tab) =>
    `px-4 py-2 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
      activeTab === t ? "bg-branding-black text-white" : "text-branding-black/60 hover:text-branding-black"
    }`;
  const inputClass =
    "w-full h-11 px-4 rounded-xl border border-branding-brown/20 bg-white shadow-sm text-base focus:outline-none focus:ring-2 focus:ring-branding-brown/30";
  const labelClass = "block text-sm font-semibold text-branding-black/70 mb-1";
  const btnClass =
    "h-11 px-6 rounded-xl bg-branding-black text-white font-semibold text-sm hover:bg-branding-black/85 transition-colors cursor-pointer";

  return (
    <div className="space-y-8">
      {/* Chinese dynasty toggle */}
      <div className="flex items-center gap-3">
        <button
          role="switch"
          aria-checked={includeChinese}
          onClick={() => { setIncludeChinese(!includeChinese); setDynastyId(""); setReignIndex(0); setReignResult(null); setGregorianResults(null); setSexResults(null); }}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${includeChinese ? "bg-branding-black" : "bg-branding-brown/20"}`}
        >
          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${includeChinese ? "translate-x-6" : "translate-x-1"}`} />
        </button>
        <span className="text-sm font-medium text-branding-black/70">
          {t("toggle-chinese")}
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 p-1 bg-branding-brown/5 rounded-2xl w-fit">
        <button className={tabClass("gregorian")} onClick={() => setActiveTab("gregorian")}>
          {t("tabs.gregorian")}
        </button>
        <button className={tabClass("reign")} onClick={() => setActiveTab("reign")}>
          {t("tabs.reign")}
        </button>
        <button className={tabClass("sexagenary")} onClick={() => setActiveTab("sexagenary")}>
          {t("tabs.sexagenary")}
        </button>
      </div>

      {/* ── Tab 2: CE → Vietnamese ── */}
      {activeTab === "gregorian" && (
        <div className="space-y-6">
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
            {t("gregorian-tab.description")}
          </p>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-24">
              <label className={labelClass}>{t("gregorian-tab.day")}</label>
              <input type="number" min={1} max={31} className={inputClass} value={ceDayStr}
                onChange={(e) => setCeDayStr(e.target.value)} placeholder="DD" />
            </div>
            <div className="w-32">
              <label className={labelClass}>{t("gregorian-tab.month")}</label>
              <select className={inputClass} value={ceMonthStr}
                onChange={(e) => setCeMonthStr(e.target.value)}>
                <option value="">—</option>
                {GREGORIAN_MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
            </div>
            <div className="w-36">
              <label className={labelClass}>{t("gregorian-tab.year-ce")}</label>
              <input type="number" className={inputClass} value={ceYearStr}
                onChange={(e) => setCeYearStr(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && calcFromGregorian()}
                placeholder="e.g. 1802" />
            </div>
            <button className={btnClass} onClick={calcFromGregorian}>{t("calculate")}</button>
          </div>

          {gregorianResults !== null && gregorianCeYear !== null && (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <h3 className="text-xl font-bold text-branding-black">
                    {ceDayStr && ceMonthStr
                      ? `${ceDayStr} ${GREGORIAN_MONTHS[parseInt(ceMonthStr) - 1]} ${gregorianCeYear} CE`
                      : `${gregorianCeYear} CE`}
                  </h3>
                  <span className="text-muted-foreground text-sm">{t("gregorian-tab.sexagenary-year")}</span>
                  <SexagenaryBadge year={gregorianCeYear} />
                </div>
                {lunarDateOutput && (
                  <LunarDateDisplay
                    ld={lunarDateOutput.lunarDay}
                    lm={lunarDateOutput.lunarMonth}
                    ly={lunarDateOutput.lunarYear}
                    leap={lunarDateOutput.isLeapMonth}
                  />
                )}
              </div>

              {gregorianResults.length === 0 ? (
                <p className="text-muted-foreground italic text-sm">
                  {t("gregorian-tab.no-reign-found")}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {gregorianResults.map((ar, i) => <ReignTag key={i} ar={ar} />)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 1: Reign → Date ── */}
      {activeTab === "reign" && (
        <div className="space-y-6">
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
            {t("reign-tab.description")}
          </p>

          {/* Reign name search */}
          <div className="relative max-w-sm">
            <label className={labelClass}>{t("reign-tab.search-label")}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                className={inputClass + " pl-9"}
                placeholder={t("reign-tab.search-placeholder")}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
                onFocus={() => setShowSearchResults(true)}
                onBlur={() => setTimeout(() => setShowSearchResults(false), 150)}
              />
            </div>
            {showSearchResults && searchResults.length > 0 && (
              <ul className="absolute z-20 top-full mt-1 w-full max-h-64 overflow-y-auto bg-white border border-branding-brown/20 rounded-xl shadow-xl">
                {searchResults.map((r, i) => (
                  <li key={i}>
                    <button
                      className="w-full text-left px-4 py-2.5 hover:bg-branding-brown/5 flex items-baseline gap-2"
                      onMouseDown={() => selectFromSearch(r)}
                    >
                      <span className="font-semibold text-branding-black text-sm">
                        {r.dynasty.reigns[r.reignIndex].name}
                      </span>
                      <span className="text-branding-brown/70 text-sm">
                        {r.dynasty.reigns[r.reignIndex].han}
                      </span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {r.dynasty.name} · {r.dynasty.reigns[r.reignIndex].startYear}–{r.dynasty.reigns[r.reignIndex].endYear}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Dynasty / reign dropdowns */}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[200px]">
              <label className={labelClass}>{t("reign-tab.dynasty")}</label>
              <select className={inputClass} value={dynastyId}
                onChange={(e) => { setDynastyId(e.target.value); setReignIndex(0); setReignResult(null); }}>
                <option value="">{t("reign-tab.select-dynasty")}</option>
                {allDynasties.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.en})</option>
                ))}
              </select>
            </div>

            {selectedDynasty && (
              <div className="min-w-[250px]">
                <label className={labelClass}>{t("reign-tab.reign-name")}</label>
                <select className={inputClass} value={reignIndex}
                  onChange={(e) => { setReignIndex(Number(e.target.value)); setReignResult(null); }}>
                  {selectedDynasty.reigns.map((r, i) => (
                    <option key={i} value={i}>
                      {r.name} {r.han} ({r.startYear}–{r.endYear})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedReign && (
              <div className="w-36">
                <label className={labelClass}>{t("reign-tab.year-label", { max: maxYear })}</label>
                <input type="number" min={1} max={maxYear} className={inputClass}
                  value={reignYearNum}
                  onChange={(e) => setReignYearNum(Number(e.target.value))} />
              </div>
            )}
          </div>

          {/* Lunar month + day (optional) */}
          {selectedReign && (
            <div className="space-y-2">
              <p className={labelClass}>{t("reign-tab.lunar-section")}</p>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="w-44">
                  <label className={labelClass + " text-xs"}>{t("reign-tab.lunar-month")}</label>
                  <select className={inputClass} value={lunarMonthStr}
                    onChange={(e) => { setLunarMonthStr(e.target.value); setLunarIsLeap(false); }}>
                    <option value="">{t("reign-tab.lunar-not-specified")}</option>
                    {LUNAR_MONTH_NAMES.map((name, i) => (
                      <option key={i} value={i + 1}>{name}</option>
                    ))}
                  </select>
                </div>
                {lunarMonthStr && (
                  <label className="flex items-center gap-2 text-sm text-branding-black/70 cursor-pointer">
                    <input type="checkbox" checked={lunarIsLeap}
                      onChange={(e) => setLunarIsLeap(e.target.checked)}
                      className="rounded" />
                    {t("reign-tab.intercalary")}
                  </label>
                )}
                <div className="w-28">
                  <label className={labelClass + " text-xs"}>{t("reign-tab.lunar-day")}</label>
                  <input type="number" min={1} max={30} className={inputClass}
                    value={lunarDayStr} placeholder="1–30"
                    onChange={(e) => setLunarDayStr(e.target.value)} />
                </div>
                <button className={btnClass} onClick={calcFromReign}>{t("calculate")}</button>
              </div>
            </div>
          )}

          {!selectedReign && (
            <button className={btnClass + " opacity-40 cursor-not-allowed"} disabled>
              {t("calculate")}
            </button>
          )}

          {reignResult && (
            <div className="rounded-2xl border border-branding-brown/15 bg-white p-6 space-y-3 max-w-lg">
              {reignResult.error ? (
                <p className="text-red-600 text-sm">{reignResult.error}</p>
              ) : (
                <>
                  <p className="text-xs text-branding-brown/60 uppercase tracking-widest font-bold">{t("shared.result")}</p>
                  {reignResult.gregorianDate ? (
                    <p className="text-3xl font-bold text-branding-black">
                      {reignResult.gregorianDate.day}{" "}
                      {GREGORIAN_MONTHS[reignResult.gregorianDate.month - 1]}{" "}
                      {reignResult.gregorianDate.year} CE
                    </p>
                  ) : (
                    <p className="text-3xl font-bold text-branding-black">{reignResult.ceYear} CE</p>
                  )}
                  <p className="text-base text-branding-black/80 leading-relaxed">
                    {t("shared.year-of-reign", { n: reignYearNum })} ·{" "}
                    <span className="font-semibold">{selectedReign!.name}</span>{" "}
                    <span className="text-branding-brown/70">({selectedReign!.han})</span>{" "}
                    — {selectedDynasty!.en}
                  </p>
                  <p className="text-sm text-muted-foreground">{t("shared.ruler")} {selectedReign!.ruler}</p>
                  {reignResult.lunarDay !== undefined && reignResult.lunarMonth !== undefined && reignResult.lunarYear !== undefined && (
                    <LunarDateDisplay
                      ld={reignResult.lunarDay}
                      lm={reignResult.lunarMonth}
                      ly={reignResult.lunarYear}
                      leap={reignResult.lunarLeap ?? false}
                    />
                  )}
                  <div className="pt-1 border-t border-branding-brown/10 flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">{t("shared.sexagenary-year")}</span>
                    <SexagenaryBadge year={reignResult.gregorianDate?.year ?? reignResult.ceYear} />
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Sexagenary → CE Years ── */}
      {activeTab === "sexagenary" && (
        <div className="space-y-6">
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
            {t("sexagenary-tab.description")}
          </p>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className={labelClass}>{t("sexagenary-tab.stem")}</label>
              <select className={inputClass + " w-40"} value={stemIdx}
                onChange={(e) => { setStemIdx(Number(e.target.value)); setSexResults(null); }}>
                {HEAVENLY_STEMS.map((s, i) => (
                  <option key={i} value={i}>{s.vi} {s.han}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t("sexagenary-tab.branch")}</label>
              <select className={inputClass + " w-44"} value={branchIdx}
                onChange={(e) => { setBranchIdx(Number(e.target.value)); setSexResults(null); }}>
                {EARTHLY_BRANCHES.map((b, i) => (
                  <option key={i} value={i} disabled={!isValidSexagenary(stemIdx, i)}>
                    {b.vi} {b.han} ({b.en}){!isValidSexagenary(stemIdx, i) ? " ✗" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-28">
              <label className={labelClass}>{t("sexagenary-tab.from-year")}</label>
              <input type="number" className={inputClass} value={fromYear}
                onChange={(e) => setFromYear(Number(e.target.value))} />
            </div>
            <div className="w-28">
              <label className={labelClass}>{t("sexagenary-tab.to-year")}</label>
              <input type="number" className={inputClass} value={toYear}
                onChange={(e) => setToYear(Number(e.target.value))} />
            </div>
            <button className={btnClass + (!sexValid ? " opacity-40 cursor-not-allowed" : "")}
              onClick={calcSexagenary} disabled={!sexValid}>
              {t("calculate")}
            </button>
          </div>

          {!sexValid && (
            <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm">
              {t("sexagenary-tab.invalid-combo")}
            </p>
          )}

          {sexValid && sexResults !== null && (
            <div className="space-y-4">
              <p className="font-semibold text-branding-black">
                {t("sexagenary-tab.results-heading", {
                  name: `${HEAVENLY_STEMS[stemIdx].vi} ${EARTHLY_BRANCHES[branchIdx].vi} (${HEAVENLY_STEMS[stemIdx].han}${EARTHLY_BRANCHES[branchIdx].han})`,
                  from: fromYear,
                  to: toYear
                })}
              </p>
              {sexResults.length === 0 ? (
                <p className="text-muted-foreground italic text-sm">{t("sexagenary-tab.no-occurrences")}</p>
              ) : (
                <div className="space-y-3">
                  {sexResults.map((y) => {
                    const actives = getActiveReignsForYear(y);
                    return (
                      <div key={y} className="rounded-xl border border-branding-brown/15 bg-white p-4">
                        <p className="font-bold text-branding-black text-lg mb-2">{y} CE</p>
                        {actives.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">{t("sexagenary-tab.no-reign")}</p>
                        ) : (
                          <ul className="space-y-1">
                            {actives.map((ar, i) => (
                              <li key={i} className="text-sm text-branding-black/80">
                                <span className="font-semibold">{ar.reign.name}</span>{" "}
                                <span className="text-branding-brown/70">{ar.reign.han}</span>{" "}
                                {t("shared.year-of-reign", { n: ar.yearNumber })} — {ar.dynasty.name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <details className="rounded-xl border border-branding-brown/15 bg-branding-brown/5">
        <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-branding-black/70 select-none">
          {t("notes.title")}
        </summary>
        <div className="px-5 pb-5 text-sm text-muted-foreground space-y-2 leading-relaxed">
          <p>
            <strong className="text-branding-black">{t("notes.reign-numbering-title")}</strong>{" "}{t("notes.reign-numbering")}
          </p>
          <p>
            <strong className="text-branding-black">{t("notes.lunisolar-title")}</strong>{" "}{t("notes.lunisolar")}
          </p>
          <p>
            <strong className="text-branding-black">{t("notes.new-year-title")}</strong>{" "}{t("notes.new-year")}
          </p>
          <p>
            <strong className="text-branding-black">{t("notes.overlapping-title")}</strong>{" "}{t("notes.overlapping")}
          </p>
          <p>
            <strong className="text-branding-black">{t("notes.intercalary-title")}</strong>{" "}{t("notes.intercalary")}
          </p>
          <p>
            <strong className="text-branding-black">{t("notes.sexagenary-title")}</strong>{" "}{t("notes.sexagenary")}
          </p>
        </div>
      </details>
    </div>
  );
}
