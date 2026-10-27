"use client";
import dynamic from "next/dynamic";
import MiradorURLSyncPlugin from "../../lib/mirador-plugins/MiradorURLSyncPlugin";

// Mirador accesses browser globals while its module is evaluated. Keeping the
// dynamic boundary in this shared component makes every document page safe to
// server-render while the viewer itself starts only after hydration.
const Mirador = dynamic(() => import("@/components/mirador/Mirador"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full rounded-md bg-gray-100 animate-pulse" />
  ),
});

const MiradorViewer = ({ manifestUrl, canvasId }) => {
  return (
    <div className="mirador ">
      {/* Mirador */}
      <Mirador
        // className=""
        config={{
          id: "mirador",
          window: {
            allowWindowSideBar: true,
            allowTopMenuButton: true,
            allowMaximize: false,
            allowClose: false,
            allowFullscreen: true,
            defaultView: "single",
            views: [
              { key: "single", behaviors: ["individuals"] },
              { key: "book", behaviors: ["paged"] },
              { key: "scroll", behaviors: ["continuous"] },
              { key: "gallery" },
            ],
          },
          workspaceControlPanel: {
            enabled: false, // Configure if the control panel should be rendered.  Useful if you want to lock the viewer down to only the configured manifests
          },
          windows: [
            {
              loadedManifest: manifestUrl,
              canvasId: canvasId,
              thumbnailNavigationPosition: "far-right",
            },
          ],
        }}
        plugins={[MiradorURLSyncPlugin]}
      />
    </div>
  );
};

export default MiradorViewer;
