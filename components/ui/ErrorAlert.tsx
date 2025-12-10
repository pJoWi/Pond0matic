"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type ErrorSeverity = "error" | "warning" | "info";

interface ErrorAlertProps {
  title: string;
  message: string;
  severity?: ErrorSeverity;
  onRetry?: () => void;
  onDismiss?: () => void;
  autoHideMs?: number;
  technical?: string;
  className?: string;
}

const severityConfig = {
  error: {
    icon: "✕",
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    borderColor: "border-red-500/40",
    glowClass: "glow-ember-intense",
    buttonBg: "bg-red-500/20",
    buttonHover: "hover:bg-red-500/30",
  },
  warning: {
    icon: "⚠",
    color: "text-yellow-400",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/40",
    glowClass: "glow-ember",
    buttonBg: "bg-yellow-500/20",
    buttonHover: "hover:bg-yellow-500/30",
  },
  info: {
    icon: "ⓘ",
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/40",
    glowClass: "",
    buttonBg: "bg-blue-500/20",
    buttonHover: "hover:bg-blue-500/30",
  },
};

export function ErrorAlert({
  title,
  message,
  severity = "error",
  onRetry,
  onDismiss,
  autoHideMs,
  technical,
  className,
}: ErrorAlertProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showTechnical, setShowTechnical] = useState(false);
  const config = severityConfig[severity];

  useEffect(() => {
    if (autoHideMs && autoHideMs > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onDismiss) onDismiss();
      }, autoHideMs);
      return () => clearTimeout(timer);
    }
  }, [autoHideMs, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    if (onDismiss) onDismiss();
  };

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "glass-intense rounded-2xl border p-4 transition-all duration-500 spring-bounce transform-gpu",
        config.borderColor,
        config.glowClass,
        className
      )}
      role="alert"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full border-2 font-bold text-lg flex-shrink-0",
            config.bgColor,
            config.borderColor,
            config.color,
            severity === "error" && "animate-led-pulse"
          )}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className={cn("text-sm font-bold uppercase tracking-wider mb-1", config.color)}>
            {title}
          </div>

          {/* Message */}
          <div className="text-sm text-gray-300 leading-relaxed mb-3">
            {message}
          </div>

          {/* Technical Details (Collapsible) */}
          {technical && (
            <div className="mt-2">
              <button
                onClick={() => setShowTechnical(!showTechnical)}
                className={cn(
                  "text-xs font-semibold uppercase tracking-wide transition-colors flex items-center gap-1",
                  config.color,
                  "hover:opacity-80"
                )}
              >
                <span>{showTechnical ? "▼" : "▶"}</span>
                Technical Details
              </button>
              {showTechnical && (
                <div className={cn("mt-2 p-3 rounded-lg border font-mono text-xs overflow-x-auto", config.bgColor, config.borderColor)}>
                  <pre className="text-gray-400 whitespace-pre-wrap break-words">
                    {technical}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className={cn(
                  "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition-all border flex items-center gap-2",
                  config.buttonBg,
                  config.buttonHover,
                  config.borderColor,
                  config.color,
                  "hover:scale-105 active:scale-95 button-liquid"
                )}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Retry
              </button>
            )}
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="px-4 py-2 bg-cyber-black/60 border border-gray-600/50 rounded-lg text-xs font-bold uppercase tracking-wide text-gray-400 hover:text-gray-300 hover:border-gray-500 transition-all hover:scale-105 active:scale-95"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>

        {/* Close Button */}
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className={cn(
              "flex-shrink-0 w-6 h-6 rounded-full transition-all hover:scale-110 active:scale-95",
              config.color,
              "hover:opacity-70"
            )}
            aria-label="Close alert"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

// Preset error alert variants
export function TransactionErrorAlert({
  error,
  onRetry,
  onDismiss,
}: {
  error: Error;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <ErrorAlert
      title="Transaction Failed"
      message={error.message || "An unexpected error occurred during the transaction."}
      severity="error"
      technical={error.stack}
      onRetry={onRetry}
      onDismiss={onDismiss}
    />
  );
}

export function NetworkErrorAlert({
  onRetry,
  onDismiss,
}: {
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <ErrorAlert
      title="Network Error"
      message="Unable to connect to the Solana network. Please check your connection and try again."
      severity="error"
      onRetry={onRetry}
      onDismiss={onDismiss}
    />
  );
}

export function ValidationWarning({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss?: () => void;
}) {
  return (
    <ErrorAlert
      title="Validation Warning"
      message={message}
      severity="warning"
      onDismiss={onDismiss}
      autoHideMs={5000}
    />
  );
}
