import * as OpenCC from "opencc-js";

type Conv = (s: string) => string;

let s2tFn: Conv | null = null;
let t2sFn: Conv | null = null;

function getConverters(): { s2t: Conv; t2s: Conv } {
  const s2t: Conv =
    s2tFn ?? (s2tFn = OpenCC.Converter({ from: "cn", to: "tw" }));
  const t2s: Conv =
    t2sFn ?? (t2sFn = OpenCC.Converter({ from: "tw", to: "cn" }));
  return { s2t, t2s };
}

// BMP CJK Unified + Ext A + Compatibility Ideographs. Covers the range we care
// about for S↔T conversion; SIP ideographs pass through unchanged anyway.
const CJK_RE = new RegExp("[\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff]");

export function hasCJK(s: string): boolean {
  return !!s && CJK_RE.test(s);
}

/**
 * Returns the original query plus its simplified-Chinese and traditional-Chinese
 * counterparts (deduplicated). Non-CJK queries pass through as [query].
 *
 * Nôm-only characters outside the OpenCC dictionary pass through unchanged and
 * collapse back into the original variant during dedup.
 */
export function hanVariants(query: string): string[] {
  if (!hasCJK(query)) return [query];
  const { s2t, t2s } = getConverters();
  const set = new Set<string>([query]);
  try {
    set.add(s2t(query));
  } catch {}
  try {
    set.add(t2s(query));
  } catch {}
  return Array.from(set);
}
