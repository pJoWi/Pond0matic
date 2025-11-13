"use client";
import React from "react";
import { cn } from "@/lib/utils";

interface ActivityLogProps {
  activities: string[];
  onClear: () => void;
}

export function ActivityLog({ activities, onClear }: ActivityLogProps) {
  return (
    <section className="bg-cyber-darker/60 backdrop-blur-md border border-ember-orange/30 rounded-xl shadow-ember-orange-md overflow-hidden transition-all duration-300 hover:border-ember-orange/50">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-ember-orange/20 bg-gradient-to-br from-ember-orange/10 to-ember-amber/5">
        <h2 className="text-xl font-bold bg-gradient-to-r from-ember-orange via-ember-amber to-ember-gold bg-clip-text text-transparent">
          📜 Activity Log
        </h2>
        <button
          onClick={onClear}
          disabled={activities.length === 0}
          className="px-4 py-2 bg-red-500/20 border border-red-500/40 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-cyber-black"
          aria-label="Clear activity log"
        >
          <span aria-hidden="true">🗑️</span> Clear
        </button>
      </div>

      {/* Log Content */}
      <div className="max-h-96 overflow-y-auto p-4 bg-cyber-black/30">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="text-lg font-semibold text-gray-400 mb-1">No activity yet</div>
            <div className="text-sm text-gray-500">Swap transactions will appear here</div>
          </div>
        ) : (
          <div className="space-y-2">
            {activities.map((line, i) => {
              const isError = /error|failed/i.test(line);
              const isWetware = /wetware:/i.test(line);
              const isSuccess = /confirmed|success/i.test(line);
              const isSent = /sent/i.test(line);
              const m = line.match(/(https:\/\/solscan\.io\/tx\/[^\s]+)/i);

              return (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 rounded-lg border transition-all duration-300 hover:scale-[1.01]",
                    isError && "bg-red-500/10 border-red-500/30 hover:border-red-500/50",
                    isWetware && isSuccess && "bg-ember-gold/10 border-ember-gold/30 hover:border-ember-gold/50 shadow-ember-gold-sm",
                    isWetware && !isSuccess && "bg-ember-amber/10 border-ember-amber/30 hover:border-ember-amber/50",
                    !isWetware && isSuccess && "bg-ember-orange/10 border-ember-orange/30 hover:border-ember-orange/50",
                    !isWetware && isSent && !isSuccess && "bg-ember-amber/10 border-ember-amber/30 hover:border-ember-amber/50",
                    !isError && !isSuccess && !isSent && !isWetware && "bg-cyber-black/50 border-gray-700 hover:border-gray-600"
                  )}
                >
                  {/* Status LED Indicator */}
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full mt-1.5 flex-shrink-0 transition-all duration-300 relative",
                      isError && "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]",
                      isWetware && isSuccess && "bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.9)] animate-pulse",
                      isWetware && !isSuccess && "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.7)]",
                      !isWetware && isSuccess && "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.9)] animate-pulse",
                      !isWetware && isSent && !isSuccess && "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.7)] animate-pulse",
                      !isError && !isSuccess && !isSent && !isWetware && "bg-gray-500"
                    )}
                  >
                    {/* Inner glow for success states */}
                    {isSuccess && (
                      <div className="absolute inset-0 rounded-full bg-white opacity-40 animate-ping"></div>
                    )}
                  </div>

                  {/* Message Text */}
                  <div className="flex-1 font-mono text-xs text-gray-300 leading-relaxed break-all">
                    {!m ? (
                      line
                    ) : (
                      <>
                        {line.split(m[1])[0]}
                        <a
                          href={m[1]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-ember-orange-light underline hover:text-ember-amber transition-colors"
                        >
                          {m[1]}
                        </a>
                        {line.split(m[1])[1]}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
