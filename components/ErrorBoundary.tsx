"use client";
import React, { Component, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-pond-deep via-pond-water to-pond-deep">
          <div className="max-w-md w-full">
            <div className="relative overflow-hidden rounded-2xl border-2 border-red-500/40 backdrop-blur-xl bg-gradient-to-br from-red-500/10 via-pond-deep/90 to-red-500/10 shadow-[0_8px_24px_rgba(239,68,68,0.3)] p-8">
              {/* Error animation background */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-orange-500/10 to-red-500/20 animate-pulse"></div>
              </div>

              <div className="relative z-10 text-center space-y-6">
                {/* Error icon */}
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.3)]">
                    <span className="text-4xl">⚠️</span>
                  </div>
                </div>

                {/* Error message */}
                <div>
                  <h1 className="text-2xl font-bold text-white mb-2">
                    Something went wrong
                  </h1>
                  <p className="text-sm text-text-secondary mb-4">
                    An unexpected error occurred while rendering this component.
                  </p>
                  {this.state.error && (
                    <details className="text-left">
                      <summary className="text-xs text-red-400 cursor-pointer hover:text-red-300 transition-colors mb-2">
                        Show error details
                      </summary>
                      <div className="bg-black/30 border border-red-500/30 rounded-lg p-3 text-xs font-mono text-red-300 overflow-auto max-h-40">
                        <p className="font-bold mb-1">{this.state.error.name}</p>
                        <p className="text-text-secondary">{this.state.error.message}</p>
                      </div>
                    </details>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className={cn(
                      "px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300",
                      "bg-lily-green/20 border-2 border-lily-green text-lily-bright",
                      "hover:bg-lily-green/30 hover:border-lily-bright hover:shadow-[0_0_20px_var(--glow-green)] hover:scale-105",
                      "active:scale-95"
                    )}
                  >
                    Reload Page
                  </button>
                  <button
                    onClick={() => this.setState({ hasError: false, error: null })}
                    className={cn(
                      "px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300",
                      "bg-white/5 border-2 border-white/20 text-white",
                      "hover:bg-white/10 hover:border-white/30 hover:scale-105",
                      "active:scale-95"
                    )}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
