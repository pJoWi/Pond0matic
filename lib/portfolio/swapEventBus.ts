/**
 * Tiny module-level event bus that decouples the swap-execution flow from
 * the recorder. useSwapExecution dispatches lifecycle events here; the
 * useSwapRecorder hook subscribes and writes records to storage.
 *
 * Using a module singleton (rather than React context) avoids forcing
 * useSwapExecution to depend on React state for something that is purely
 * fire-and-forget telemetry.
 */

import type { SwapMode } from "./types";

export interface SwapStartedEvent {
  type: "swap-started";
  internalId: string;          // recorder will use this to track the swap through its lifecycle
  mode: SwapMode;
  fromMint: string;
  fromSymbol: string;
  fromAmount: number;
  toMint: string;
  toSymbol: string;
  toAmount: number;            // estimated; actual filled amount may differ
}

export interface SwapSentEvent {
  type: "swap-sent";
  internalId: string;
  signature: string;
}

export interface SwapConfirmedEvent {
  type: "swap-confirmed";
  internalId: string;
}

export interface SwapFailedEvent {
  type: "swap-failed";
  internalId: string;
  reason?: string;
}

export type SwapBusEvent =
  | SwapStartedEvent
  | SwapSentEvent
  | SwapConfirmedEvent
  | SwapFailedEvent;

type Listener = (event: SwapBusEvent) => void;

const listeners = new Set<Listener>();

export function subscribeSwapEvents(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function dispatchSwapEvent(event: SwapBusEvent): void {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // A misbehaving listener must not break the bus
    }
  }
}

export function makeInternalSwapId(): string {
  return `swap-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
