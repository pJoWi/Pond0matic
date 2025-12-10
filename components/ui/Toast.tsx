"use client";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "info" | "warning" | "error";

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  onDismiss: (id: string) => void;
}

export function Toast({ id, message, type, duration = 3000, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const config = {
    success: {
      icon: "✓",
      color: "border-lily-green bg-lily-green/10 text-lily-bright",
      glow: "shadow-[0_0_20px_rgba(107,157,120,0.4)]"
    },
    info: {
      icon: "ℹ",
      color: "border-pond-bright bg-pond-bright/10 text-pond-bright",
      glow: "shadow-[0_0_20px_rgba(74,143,184,0.4)]"
    },
    warning: {
      icon: "⚠",
      color: "border-gold bg-gold/10 text-gold-light",
      glow: "shadow-[0_0_20px_rgba(212,164,68,0.4)]"
    },
    error: {
      icon: "✕",
      color: "border-red-500 bg-red-500/10 text-red-400",
      glow: "shadow-[0_0_20px_rgba(239,68,68,0.4)]"
    }
  };

  const { icon, color, glow } = config[type];

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-xl border-2 backdrop-blur-xl",
        "animate-in slide-in-from-right-5 fade-in duration-300",
        "hover:scale-105 transition-transform cursor-pointer",
        color,
        glow
      )}
      onClick={() => onDismiss(id)}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl flex-shrink-0">{icon}</span>
        <span className="text-sm font-semibold text-white">{message}</span>
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
  }>;
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-20 right-4 z-[100] space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
