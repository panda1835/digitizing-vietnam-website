"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface MiradorContextType {
  canvasId: string | null;
  setCanvasId: (id: string) => void;
}

const MiradorContext = createContext<MiradorContextType | undefined>(undefined);

export const MiradorProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [canvasId, setCanvasId] = useState<string | null>(null);

  return (
    <MiradorContext.Provider value={{ canvasId, setCanvasId }}>
      {children}
    </MiradorContext.Provider>
  );
};

export const useMirador = () => {
  const context = useContext(MiradorContext);
  if (context === undefined) {
    throw new Error("useMirador must be used within a MiradorProvider");
  }
  return context;
};
