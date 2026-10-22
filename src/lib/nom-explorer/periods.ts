// Dating helpers shared by server pages and client charts (no file access).

export type DateMode = "copy" | "composed";

export const PERIODS = ["before 1500", "1500–1699", "1700–1799", "1800–1849", "1850–1899", "1900 on", "undated"] as const;

export function periodOf(year: number | null | undefined): (typeof PERIODS)[number] {
  if (year == null) return "undated";
  if (year < 1500) return "before 1500";
  if (year < 1700) return "1500–1699";
  if (year < 1800) return "1700–1799";
  if (year < 1850) return "1800–1849";
  if (year < 1900) return "1850–1899";
  return "1900 on";
}

export interface SourceCount {
  short: string;
  cites: number;
  chars: number;
  composed: number | null;
  copy: number | null;
}

