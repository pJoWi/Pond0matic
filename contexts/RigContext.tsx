"use client";
import React, { createContext, useContext } from "react";
import { useRigTelemetry, type RigTelemetry } from "@/hooks/useRigTelemetry";

const RigContext = createContext<RigTelemetry | undefined>(undefined);

export function RigProvider({ children }: { children: React.ReactNode }) {
  return <RigContext.Provider value={useRigTelemetry()}>{children}</RigContext.Provider>;
}

export function useRig(): RigTelemetry {
  const ctx = useContext(RigContext);
  if (!ctx) throw new Error("useRig must be used within RigProvider");
  return ctx;
}
