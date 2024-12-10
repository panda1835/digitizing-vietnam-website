interface MiradorProps {
  config: {
    id: string;
    window: {
      allowWindowSideBar: boolean;
      allowTopMenuButton: boolean;
      allowMaximize: boolean;
      allowClose: boolean;
      allowFullscreen: boolean;
      defaultView: string;
      views: Array<{ key: string; behaviors?: string[] }>;
    };
    workspaceControlPanel: {
      enabled: boolean;
    };
    windows: Array<{
      loadedManifest: string;
      canvasId: string;
      thumbnailNavigationPosition: string;
    }>;
  };
  plugins?: any;
}
