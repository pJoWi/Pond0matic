"use client";
import React, { createContext, useContext, useMemo, useRef, useState } from "react";

interface SessionValue {
  running: boolean;
  paused: boolean;
  stopping: boolean;
  currentSwapIndex: number;
  currentRound: number;
  setRunning: (v: boolean) => void;
  setPaused: (v: boolean) => void;
  setStopping: (v: boolean) => void;
  setCurrentSwapIndex: (n: number) => void;
  setCurrentRound: (n: number) => void;
  /**
   * Shared run/pause flags for the engine. They live here (not inside
   * useSwapEngine) so every engine instance — the desktop SwapPanel and the
   * mobile sheet mount their own — controls the SAME session.
   */
  runRef: React.MutableRefObject<boolean>;
  pauseRef: React.MutableRefObject<boolean>;
}

const SessionContext = createContext<SessionValue | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [currentSwapIndex, setCurrentSwapIndex] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const runRef = useRef(false);
  const pauseRef = useRef(false);

  const value = useMemo(
    () => ({ running, paused, stopping, currentSwapIndex, currentRound,
             setRunning, setPaused, setStopping, setCurrentSwapIndex, setCurrentRound,
             runRef, pauseRef }),
    [running, paused, stopping, currentSwapIndex, currentRound]
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
