"use client";
import React, { createContext, useContext } from "react";
import { useActivityLog } from "@/hooks/useActivityLog";

type ActivityValue = ReturnType<typeof useActivityLog>;

const ActivityContext = createContext<ActivityValue | undefined>(undefined);

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const value = useActivityLog();
  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivity(): ActivityValue {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error("useActivity must be used within ActivityProvider");
  return ctx;
}
