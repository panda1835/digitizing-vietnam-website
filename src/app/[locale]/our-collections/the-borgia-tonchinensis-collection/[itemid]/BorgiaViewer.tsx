"use client";

// Client-only wrapper around MiradorViewer.
//
// Mirador touches `document` while rendering, so server-rendering it throws
// `ReferenceError: document is not defined`, and React then bails out of SSR
// for the whole surrounding subtree — silently stripping the item's metadata
// from the server-rendered HTML. Loading it with `ssr: false` keeps the failure
// contained to the viewer.
//
// A near-copy of vietnamese-edicts' EdictViewer. The two are worth folding into
// one shared component, but not while that collection has a PR open.

import dynamic from "next/dynamic";

const MiradorViewer = dynamic(() => import("@/components/mirador/MiradorViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[700px] rounded-md bg-gray-100 animate-pulse" />
  ),
});

export default function BorgiaViewer({
  manifestUrl,
  canvasId = "",
}: {
  manifestUrl: string;
  canvasId?: string;
}) {
  return <MiradorViewer manifestUrl={manifestUrl} canvasId={canvasId} />;
}
