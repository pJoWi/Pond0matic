import { useState, useCallback } from "react";
import type { ToastType } from "@/components/ui/Toast";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "info", duration?: number) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string, duration?: number) => {
    return showToast(message, "success", duration);
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    return showToast(message, "info", duration);
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    return showToast(message, "warning", duration);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    return showToast(message, "error", duration);
  }, [showToast]);

  return {
    toasts,
    showToast,
    dismissToast,
    success,
    info,
    warning,
    error
  };
}
