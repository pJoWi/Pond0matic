"use client";
import { useState } from "react";
import { SwapPanel } from "@/components/swap/SwapPanel";
import { useSession } from "@/contexts/SessionContext";

export function MobileSwapSheet() {
  const [open, setOpen] = useState(false);
  const { running } = useSession();
  return (
    <div className="xl:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-40 rounded-full bg-gradient-to-br from-accent to-accent-strong px-5 py-3 text-sm font-bold text-accent-deep shadow-lg"
      >
        {running ? "● Session running" : "⇅ Swap"}
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={() => setOpen(false)}>
          <div
            className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl bg-surface p-2 pb-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-edge" />
            <SwapPanel />
          </div>
        </div>
      ) : null}
    </div>
  );
}
