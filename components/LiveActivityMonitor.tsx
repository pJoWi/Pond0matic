"use client";
import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useSwapperContext } from "@/contexts/SwapperContext";

interface LiveActivityMonitorProps {
  maxItems?: number;
  autoScroll?: boolean;
}

export function LiveActivityMonitor({
  maxItems = 10,
  autoScroll = true
}: LiveActivityMonitorProps) {
  const ctx = useSwapperContext();
  const [isLive, setIsLive] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new activities arrive
  useEffect(() => {
    if (autoScroll && isLive && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [ctx.activities, autoScroll, isLive]);

  // Get recent activities
  const recentActivities = ctx.activities.slice(-maxItems).reverse();

  // Determine activity type and styling
  const getActivityStyle = (line: string) => {
    const isError = /error|failed/i.test(line);
    const isSuccess = /confirmed|success/i.test(line);
    const isSent = /sent/i.test(line);
    const hasSignature = /https:\/\/(?:orb\.helius\.dev|solscan\.io|explorer\.orb\.land)\/tx\//.test(line);

    if (isError) return {
      color: "red",
      icon: "❌",
      dotClass: "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]"
    };
    if (isSuccess) return {
      color: "green",
      icon: "✅",
      dotClass: "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.9)] animate-pulse"
    };
    if (isSent) return {
      color: "blue",
      icon: "🚀",
      dotClass: "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.7)] animate-pulse"
    };
    return {
      color: "gray",
      icon: "ℹ️",
      dotClass: "bg-gray-500"
    };
  };

  return (
    <div className="relative bg-gradient-to-br from-pond-water/40 via-pond-deep/30 to-pond-water/40 backdrop-blur-xl border-2 border-lily-green/40 rounded-2xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
      {/* Header */}
      <div className="relative px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              {/* Live indicator pulse */}
              <div className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                isLive
                  ? "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.9)]"
                  : "bg-gray-500"
              )}>
                {isLive && (
                  <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                )}
              </div>
            </div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-lily-bright via-gold-light to-lily-bright bg-clip-text text-transparent">
              Live Activity
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLive(!isLive)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-300 hover:scale-105 active:scale-95",
                isLive
                  ? "bg-green-500/20 border border-green-500/40 text-green-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                  : "bg-gray-500/20 border border-gray-500/40 text-gray-400 hover:shadow-[0_0_15px_rgba(156,163,175,0.3)]"
              )}
            >
              {isLive ? "🟢 Live" : "⏸ Paused"}
            </button>
            <button
              onClick={ctx.clearLog}
              disabled={ctx.activities.length === 0}
              className="px-3 py-1 bg-red-500/20 border border-red-500/40 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 transition-all"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Activity count badge */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-text-muted">
            {ctx.activities.length} total activities
          </span>
          {recentActivities.length > 0 && (
            <span className="text-xs px-2 py-0.5 bg-lily-green/20 border border-lily-green/30 rounded-full text-lily-bright">
              {recentActivities.length} recent
            </span>
          )}
        </div>
      </div>

      {/* Activity Feed */}
      <div
        ref={scrollRef}
        className="max-h-96 overflow-y-auto p-4 space-y-2 bg-black/20"
      >
        {recentActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-lily-green/10 border-2 border-lily-green/30 flex items-center justify-center animate-pulse">
              <span className="text-3xl">🤝</span>
            </div>
            <div className="text-lg font-semibold text-text-muted mb-1">
              Waiting for activity...
            </div>
            <div className="text-sm text-text-secondary">
              Swap transactions will appear here in real-time
            </div>
          </div>
        ) : (
          recentActivities.map((line, i) => {
            const style = getActivityStyle(line);
            const signatureMatch = line.match(/https:\/\/(?:orb\.helius\.dev|solscan\.io)\/tx\/([^\s?]+)/i);
            const signature = signatureMatch ? signatureMatch[1] : null;

            return (
              <div
                key={ctx.activities.length - i}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] animate-in slide-in-from-right-2",
                  style.color === "red" && "bg-red-500/10 border-red-500/30 hover:border-red-500/50",
                  style.color === "green" && "bg-green-500/10 border-green-500/30 hover:border-green-500/50",
                  style.color === "blue" && "bg-blue-400/10 border-blue-400/30 hover:border-blue-400/50",
                  style.color === "gray" && "bg-white/5 border-white/10 hover:border-white/20"
                )}
              >
                {/* Status indicator dot */}
                <div className={cn("w-3 h-3 rounded-full mt-1 flex-shrink-0", style.dotClass)} />

                {/* Activity message */}
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-gray-200 break-words leading-relaxed">
                    {line}
                  </div>

                  {/* Quick action for transaction signatures */}
                  {signature && (
                    <div className="mt-2 flex gap-2">
                      <a
                        href={`https://solscan.io/tx/${signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-[10px] font-semibold text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/50 transition-all"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        </svg>
                        Solscan
                      </a>
                    </div>
                    
                  )}
                   {signature && (
                    <div className="mt-2 flex gap-2">
                      <a
                        href={`https://orb.helius.dev/tx/${signature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 border border-red-500/30 rounded text-[10px] font-semibold text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        </svg>
                        Orb
                      </a>
                    </div>
                    
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer stats */}
      <div className="px-6 py-3 border-t border-white/10 bg-black/20">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-xs text-text-muted uppercase tracking-wider">Success</div>
            <div className="text-lg font-bold text-green-400">
              {ctx.activities.filter(a => /confirmed|success/i.test(a)).length}
            </div>
          </div>
          <div>
            <div className="text-xs text-text-muted uppercase tracking-wider">Failed</div>
            <div className="text-lg font-bold text-red-400">
              {ctx.activities.filter(a => /error|failed/i.test(a)).length}
            </div>
          </div>
          <div>
            <div className="text-xs text-text-muted uppercase tracking-wider">Pending</div>
            <div className="text-lg font-bold text-blue-400">
              {ctx.activities.filter(a => /sent/i.test(a) && !/confirmed|success|error|failed/i.test(a)).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
