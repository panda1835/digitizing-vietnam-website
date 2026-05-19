// Shared DVN-styled OCR editor chrome classes (text-search `.btn` /
// `.btn.primary` structure, primary-blue accent). Single source of truth
// so the per-page editor and the single-page tester stay visually in
// sync. Pairs with <StepBar /> for the numbered stage indicator.

export const BTN_PRIMARY =
  "px-4 py-1.5 text-sm font-halyard rounded bg-primary-blue text-white font-medium hover:bg-[#00124f] disabled:opacity-50";
export const BTN_NEUTRAL =
  "px-3 py-1.5 text-sm font-halyard rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50";
export const BTN_BACK =
  "px-3 py-1.5 text-sm font-halyard rounded text-gray-600 hover:bg-gray-100 disabled:opacity-50";
export const BTN_NAV =
  "px-2 py-1.5 text-xs font-halyard rounded border border-gray-300 text-gray-700 hover:bg-gray-50";
