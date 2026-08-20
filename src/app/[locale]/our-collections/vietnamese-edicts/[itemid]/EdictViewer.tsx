"use client";

// Client-only wrapper around MiradorViewer.
//
// Mirador touches `document` while rendering, so server-rendering it throws
// `ReferenceError: document is not defined`. React then bails out of SSR for
// the entire surrounding subtree, which silently strips the item's metadata and
// transcript from the server-rendered HTML — bad for search engines and for
// anyone without JS, and hard to notice because the page still looks right in a
// browser. (The Hán-Nôm item page has this same flaw; worth fixing there too.)
//
// Loading it with `ssr: false` keeps the failure contained to the viewer, so
// everything around it server-renders normally.

import dynamic from "next/dynamic";

const MiradorViewer = dynamic(() => import("@/components/mirador/MiradorViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] rounded-md bg-gray-100 animate-pulse" />
  ),
});

export default function EdictViewer({
  manifestUrl,
  canvasId = "",
}: {
  manifestUrl: string;
  canvasId?: string;
}) {
  return <MiradorViewer manifestUrl={manifestUrl} canvasId={canvasId} />;
}
