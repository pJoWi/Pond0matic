"use client";
import React from "react";
import { StatusLED } from "./StatusLED";
import { cn } from "@/lib/utils";

interface MiniActivityFeedProps {
  activities: string[];
  onClear: () => void;
}

export function MiniActivityFeed({ activities, onClear }: MiniActivityFeedProps) {
  if (activities.length === 0) {
    return null;
  }

  return (
    <div className="relative border-t-2 border-lily-green/20 bg-gradient-to-b from-lily-green/5 to-transparent">
      {/* Header */}
      <div className="relative flex items-center justify-between px-4 py-3 border-b-2 border-lily-green/20 bg-gradient-to-r from-pond-bright/10 via-lily-green/10 to-pond-bright/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 bg-pond-bright/40 rounded-full blur-md animate-pulse" />
            <div className="relative text-sm">📊</div>
          </div>
          <h3 className="text-xs uppercase tracking-widest text-lily-bright font-bold">Recent Activity</h3>
          <div className="px-2 py-0.5 bg-lily-green/20 border border-lily-green/40 rounded-full text-[9px] font-bold text-lily-bright">
            {activities.length}
          </div>
        </div>
        <button
          onClick={onClear}
          className="group relative px-2 py-1 text-gray-400 hover:text-red-400 transition-all duration-300 rounded-md hover:bg-red-500/10 border border-transparent hover:border-red-500/30"
          title="Clear activity log"
        >
          <span className="text-sm font-bold group-hover:scale-110 inline-block transition-transform">×</span>
        </button>
      </div>

      {/* Activity Feed */}
<<<<<<< HEAD
      <div className="max-h-40 overflow-y-auto custom-scrollbar backdrop-blur-sm">
=======
      <div className="max-h-40 overflow-y-auto custom-scrollbar">
>>>>>>> a0b5e4fc1862c9ff2e8fd02ba49fc6c001dc2ea1
        {[...activities].reverse().map((line, i) => {
          const isError = /error|failed/i.test(line);
          const isSuccess = /confirmed|success/i.test(line);
          const isSent = /sent/i.test(line);

          // Extract timestamp if present
          const timestampMatch = line.match(/\[([0-9:]+)\]/);
          const timestamp = timestampMatch ? timestampMatch[1] : "";
          const message = timestampMatch ? line.replace(timestampMatch[0], "").trim() : line;

          // Determine LED color
          let ledColor: "green" | "blue" | "red" | "gray" = "gray";
          let ledPulsing = false;
          if (isError) {
            ledColor = "red";
          } else if (isSuccess) {
            ledColor = "green";
            ledPulsing = true;
          } else if (isSent) {
            ledColor = "blue";
            ledPulsing = true;
          }

          // Parse message for URLs and make them clickable
          const renderMessageWithLinks = (text: string) => {
            const urlRegex = /(https?:\/\/[^\s]+)/g;
            const parts = text.split(urlRegex);

            return parts.map((part, index) => {
              if (urlRegex.test(part)) {
                // Reset regex lastIndex
                urlRegex.lastIndex = 0;
                return (
                  <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ember-orange hover:text-ember-amber underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    🔗 View Tx
                  </a>
                );
              }
              return <span key={index}>{part}</span>;
            });
          };

          return (
            <div
              key={i}
              className={cn(
                "group flex items-center gap-2.5 px-3 py-2.5 border-b border-lily-green/10",
                "transition-all duration-300 hover:bg-gradient-to-r hover:from-lily-green/10 hover:to-pond-bright/10",
                "hover:border-lily-green/30 hover:shadow-[0_2px_8px_rgba(107,157,120,0.1)]",
                "animate-in slide-in-from-left-2 fade-in duration-300",
                { "animation-delay-100": i === 0, "animation-delay-200": i === 1 }
              )}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <StatusLED color={ledColor} pulsing={ledPulsing} size="sm" />
<<<<<<< HEAD
              {timestamp && (
                <span className="text-[10px] font-mono text-pond-bright/70 group-hover:text-pond-bright w-16 flex-shrink-0 transition-colors">
                  {timestamp}
                </span>
              )}
              <span className="text-[11px] text-gray-300 group-hover:text-lily-bright truncate flex-1 transition-colors">
                {renderMessageWithLinks(message)}
              </span>
=======
              {timestamp && <span className="text-[10px] font-mono text-gray-500 w-16 flex-shrink-0">{timestamp}</span>}
              <span className="text-[11px] text-gray-300 truncate flex-1">{renderMessageWithLinks(message)}</span>
>>>>>>> a0b5e4fc1862c9ff2e8fd02ba49fc6c001dc2ea1
            </div>
          );
        })}
      </div>
    </div>
  );
}
