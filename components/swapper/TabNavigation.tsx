"use client";
import React from "react";
import { cn } from "@/lib/utils";

type AppTab = "autobot" | "void";

interface TabNavigationProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <section
      className="bg-cyber-darker/60 backdrop-blur-md border border-ember-orange/30 rounded-xl shadow-ember-orange-md overflow-hidden"
      role="tablist"
      aria-label="Main navigation"
    >
      <div className="flex items-center">
        {/* Autobot Tab */}
        <button
          role="tab"
          aria-selected={activeTab === "autobot"}
          aria-controls="autobot-panel"
          onClick={() => onTabChange("autobot")}
          className={cn(
            "flex-1 px-6 py-4 text-center font-bold text-sm uppercase tracking-wider transition-all duration-300 relative",
            activeTab === "autobot"
              ? "bg-gradient-to-br from-ember-orange/30 to-ember-amber/20 text-ember-orange-light border-b-2 border-ember-orange shadow-ember-orange-sm"
              : "bg-cyber-black/30 text-gray-400 hover:text-gray-300 hover:bg-cyber-black/50 border-b-2 border-transparent",
            "focus:outline-none focus:ring-2 focus:ring-ember-orange focus:ring-inset"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <span aria-hidden="true">⚙️</span>
            <span>Pond0x Mining Rig</span>
          </span>
          {activeTab === "autobot" && (
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-ember-orange via-ember-amber to-ember-gold animate-gradient-shift"
              style={{ backgroundSize: "200% 200%" }}
            ></div>
          )}
        </button>

        {/* Void Tab */}
        <button
          role="tab"
          aria-selected={activeTab === "void"}
          aria-controls="void-panel"
          onClick={() => onTabChange("void")}
          className={cn(
            "flex-1 px-6 py-4 text-center font-bold text-sm uppercase tracking-wider transition-all duration-300 relative",
            activeTab === "void"
              ? "bg-gradient-to-br from-ember-gold/30 to-ember-orange/20 text-ember-gold border-b-2 border-ember-gold shadow-ember-gold-sm"
              : "bg-cyber-black/30 text-gray-400 hover:text-gray-300 hover:bg-cyber-black/50 border-b-2 border-transparent",
            "focus:outline-none focus:ring-2 focus:ring-ember-gold focus:ring-inset"
          )}
        >
          <span className="flex items-center justify-center gap-2">
            <span aria-hidden="true">🌌</span>
            <span>The Void</span>
          </span>
          {activeTab === "void" && (
            <div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-ember-gold via-ember-amber to-ember-orange animate-gradient-shift"
              style={{ backgroundSize: "200% 200%" }}
            ></div>
          )}
        </button>
      </div>
    </section>
  );
}
