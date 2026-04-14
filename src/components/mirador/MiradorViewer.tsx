"use client";
import { useEffect, useRef } from "react";
import Mirador from "@/components/mirador/Mirador";
import MiradorURLSyncPlugin from "../../lib/mirador-plugins/MiradorURLSyncPlugin";
import { useMirador } from "@/components/mirador/MiradorContext";
import mirador from "mirador";
import { getCanvases } from "mirador/dist/es/src/state/selectors";

type MiradorViewerProps = {
  manifestUrl: string;
  canvasId?: string;
  canvasIndex?: number;
};

const MiradorViewer = ({
  manifestUrl,
  canvasId: initialCanvasId = "",
  canvasIndex = undefined,
}: MiradorViewerProps) => {
  const { canvasId, setCanvasId } = useMirador();
  const viewerRef = useRef<any>(null);

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

  useEffect(() => {
    if (!canvasIndex || initialCanvasId) {
      return;
    }

    let attempts = 0;
    const maxAttempts = 600; // ~120s at 200ms interval for large manifests/slow networks
    const timer = window.setInterval(() => {
      const store = viewerRef.current?.viewer?.store;
      if (!store) {
        return;
      }

      const state = store.getState();
      const windowId = Object.keys(state.windows || {})[0];
      if (!windowId) {
        return;
      }

      const canvases = getCanvases(state, { windowId }) || [];
      if (!canvases.length) {
        attempts += 1;
        if (attempts >= maxAttempts) {
          window.clearInterval(timer);
        }
        return;
      }

      const targetCanvas = canvases[canvasIndex - 1];
      if (targetCanvas?.id) {
        const action = mirador.actions.setCanvas(windowId, targetCanvas.id);
        store.dispatch(action);
        window.clearInterval(timer);
        return;
      }

      // If requested index is out of range, stop retrying.
      if (canvasIndex > canvases.length) {
        window.clearInterval(timer);
        return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        window.clearInterval(timer);
      }
    }, 200);

    return () => window.clearInterval(timer);
  }, [canvasIndex, initialCanvasId, manifestUrl]);

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
