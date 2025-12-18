"use client";
import { useEffect, useRef } from "react";
import Mirador from "@/components/mirador/Mirador";
import MiradorURLSyncPlugin from "../../lib/mirador-plugins/MiradorURLSyncPlugin";
import { useMirador } from "@/components/mirador/MiradorContext";
import mirador from "mirador";

const MiradorViewer = ({ manifestUrl, canvasId: initialCanvasId }) => {
  const { canvasId, setCanvasId } = useMirador();
  const viewerRef = useRef<Mirador>(null);

  useEffect(() => {
    if (initialCanvasId) {
      setCanvasId(initialCanvasId);
    }
  }, [initialCanvasId, setCanvasId]);

  useEffect(() => {
    if (canvasId && viewerRef.current?.viewer?.store) {
      // Navigate to new canvas using Mirador's action creators
      const state = viewerRef.current.viewer.store.getState();
      const windowId = Object.keys(state.windows)[0];
      if (windowId) {
        // Use Mirador's setCanvas action creator
        const action = mirador.actions.setCanvas(windowId, canvasId);
        viewerRef.current.viewer.store.dispatch(action);
      }
    }
  }, [canvasId]);

  const activeCanvasId = canvasId || initialCanvasId;

  return (
    <div className="mirador ">
      {/* Mirador */}
      <Mirador
        ref={viewerRef}
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
              canvasId: activeCanvasId,
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
