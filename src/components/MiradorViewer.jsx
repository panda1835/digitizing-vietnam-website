"use client";
import Mirador from "./Mirador";
import MiradorURLSyncPlugin from "../lib/mirador-plugins/MiradorURLSyncPlugin";

const MiradorViewer = ({ manifestUrl, canvasId }) => {
  return (
    <div className="mirador ">
      {/* Mirador */}
      <Mirador
        className=""
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
