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
    <div className="border-t border-ember-orange/20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-ember-orange/20">
        <h3 className="text-xs uppercase tracking-widest text-gray-400 font-semibold">Recent Activity</h3>
        <button
          onClick={onClear}
          className="text-gray-500 hover:text-red-400 transition-colors text-sm"
          title="Clear activity log"
        >
          ×
        </button>
      </div>

      {/* Activity Feed */}
      <div className="max-h-40 overflow-y-auto custom-scrollbar">
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
              className={cn("flex items-center gap-2 px-3 py-2 border-b border-cyber-black/50 transition-all hover:bg-cyber-black/20 hover:scale-[1.01]")}
            >
              <StatusLED color={ledColor} pulsing={ledPulsing} size="sm" />
              {timestamp && <span className="text-[10px] font-mono text-gray-500 w-16 flex-shrink-0">{timestamp}</span>}
              <span className="text-[11px] text-gray-300 truncate flex-1">{renderMessageWithLinks(message)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
