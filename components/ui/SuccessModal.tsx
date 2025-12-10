"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  txSignature?: string;
  amount?: string;
  fromToken?: string;
  toToken?: string;
  autoCloseMs?: number;
  className?: string;
}

export function SuccessModal({
  isOpen,
  onClose,
  title = "Transaction Successful",
  message,
  txSignature,
  amount,
  fromToken,
  toToken,
  autoCloseMs = 8000,
  className,
}: SuccessModalProps) {
  const [mounted, setMounted] = useState(false);
  const [celebrationComplete, setCelebrationComplete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setCelebrationComplete(false);
      const timer = setTimeout(() => {
        setCelebrationComplete(true);
      }, 600);

      if (autoCloseMs > 0) {
        const closeTimer = setTimeout(() => {
          onClose();
        }, autoCloseMs);
        return () => {
          clearTimeout(timer);
          clearTimeout(closeTimer);
        };
      }

      return () => clearTimeout(timer);
    } else {
      setMounted(false);
    }
  }, [isOpen, autoCloseMs, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-cyber-black/80 backdrop-blur-intense z-50 transition-opacity duration-500",
          mounted ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className={cn(
            "glass-intense mesh-gradient-bg particle-bg rounded-3xl border-2 border-green-500/40 shadow-[0_20px_80px_rgba(34,197,94,0.3)] max-w-md w-full p-6 pointer-events-auto transition-all duration-500 transform-gpu",
            mounted ? "scale-100 opacity-100" : "scale-95 opacity-0",
            celebrationComplete ? "" : "spring-bounce",
            className
          )}
        >
          {/* Success Icon with Celebration */}
          <div className="flex justify-center mb-6 relative">
            {/* Celebration Particles */}
            {!celebrationComplete && (
              <>
                <div className="absolute inset-0 flex items-center justify-center animate-ping opacity-75">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 glow-ember-intense" />
                </div>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-green-400 rounded-full animate-ping"
                    style={{
                      top: "50%",
                      left: "50%",
                      transform: `rotate(${i * 45}deg) translateY(-40px)`,
                      animationDelay: `${i * 75}ms`,
                      animationDuration: "1s",
                    }}
                  />
                ))}
              </>
            )}

            {/* Main Success Icon */}
            <div className="relative z-10 w-20 h-20 rounded-full bg-green-500/20 border-4 border-green-500 flex items-center justify-center glow-ember spring-bounce">
              <svg
                className="w-10 h-10 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-4">
            <h3 className="text-2xl font-bold gradient-text-ember mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-300 leading-relaxed">
              {message}
            </p>
          </div>

          {/* Swap Details (if provided) */}
          {amount && fromToken && toToken && (
            <div className="mb-4 p-4 bg-cyber-black/60 rounded-xl border border-green-500/20">
              <div className="flex items-center justify-center gap-3 text-sm">
                <div className="text-center">
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">From</div>
                  <div className="font-bold text-green-400">{amount} {fromToken}</div>
                </div>
                <div className="text-green-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">To</div>
                  <div className="font-bold text-green-400">{toToken}</div>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Link */}
          {txSignature && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl gradient-shimmer">
              <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-2">
                Transaction Signature
              </div>
              <a
                href={`https://solscan.io/tx/${txSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-400 font-mono hover:text-green-300 transition-colors flex items-center gap-2 group break-all"
              >
                <span className="flex-1">{txSignature}</span>
                <svg
                  className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {txSignature && (
              <a
                href={`https://solscan.io/tx/${txSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-3 bg-green-500/20 border-2 border-green-500/50 rounded-xl text-sm font-bold uppercase tracking-wide text-green-400 hover:bg-green-500/30 hover:scale-105 active:scale-95 transition-all button-liquid text-center"
              >
                View on Explorer
              </a>
            )}
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-cyber-black/60 border border-gray-600/50 rounded-xl text-sm font-bold uppercase tracking-wide text-gray-300 hover:text-white hover:border-gray-500 transition-all hover:scale-105 active:scale-95"
            >
              Close
            </button>
          </div>

          {/* Auto-close Timer Indicator */}
          {autoCloseMs > 0 && (
            <div className="mt-4">
              <div className="h-1 bg-cyber-black/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500/50 rounded-full transition-all"
                  style={{
                    animation: `shrink ${autoCloseMs}ms linear forwards`,
                  }}
                />
              </div>
              <div className="text-center text-xs text-gray-500 mt-2">
                Auto-closing in {autoCloseMs / 1000}s
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Keyframe for auto-close timer */}
      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </>
  );
}

// Preset success modal variants
export function SwapSuccessModal({
  isOpen,
  onClose,
  txSignature,
  amount,
  fromToken,
  toToken,
}: {
  isOpen: boolean;
  onClose: () => void;
  txSignature: string;
  amount: string;
  fromToken: string;
  toToken: string;
}) {
  return (
    <SuccessModal
      isOpen={isOpen}
      onClose={onClose}
      title="Swap Successful!"
      message="Your token swap has been confirmed on the Solana blockchain."
      txSignature={txSignature}
      amount={amount}
      fromToken={fromToken}
      toToken={toToken}
    />
  );
}

export function GenericSuccessModal({
  isOpen,
  onClose,
  message,
}: {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}) {
  return (
    <SuccessModal
      isOpen={isOpen}
      onClose={onClose}
      title="Success!"
      message={message}
      autoCloseMs={5000}
    />
  );
}
