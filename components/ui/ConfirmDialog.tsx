"use client";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "warning" | "danger" | "info";
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = "warning"
}: ConfirmDialogProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const typeConfig = {
    warning: {
      icon: "⚠",
      iconColor: "text-gold",
      confirmBg: "bg-gradient-to-r from-gold to-gold-light hover:scale-105",
      confirmText: "text-black"
    },
    danger: {
      icon: "✕",
      iconColor: "text-red-500",
      confirmBg: "bg-gradient-to-r from-red-600 to-red-500 hover:scale-105",
      confirmText: "text-white"
    },
    info: {
      icon: "ℹ",
      iconColor: "text-pond-bright",
      confirmBg: "bg-gradient-to-r from-pond-light to-pond-bright hover:scale-105",
      confirmText: "text-white"
    }
  };

  const config = typeConfig[type];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="glass-premium border-2 border-gold rounded-2xl p-6 max-w-md mx-4 animate-in zoom-in-95 fade-in duration-300 shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="text-center">
          {/* Icon */}
          <div className={cn("text-5xl mb-4", config.iconColor)}>
            {config.icon}
          </div>

          {/* Title */}
          <h3
            id="dialog-title"
            className="text-xl font-bold text-white mb-3"
          >
            {title}
          </h3>

          {/* Message */}
          <div
            className="text-sm text-gray-300 mb-6 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: message }}
          />

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className={cn(
                "flex-1 px-4 py-3 rounded-lg",
                "bg-gray-700/50 border border-gray-600",
                "text-white font-semibold",
                "hover:bg-gray-700 hover:border-gray-500",
                "transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-space-black"
              )}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={cn(
                "flex-1 px-4 py-3 rounded-lg",
                "font-bold transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-space-black",
                config.confirmBg,
                config.confirmText
              )}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
