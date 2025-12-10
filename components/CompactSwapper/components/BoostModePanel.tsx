"use client";

interface BoostModePanelProps {
  minAmount: string;
  maxAmount: string;
  swapsPerRound: number;
  numberOfRounds: number;
  loopReturnAmount: string;
  toTokenBalance: number;
  toTokenName: string;
  swapDelayMs: number;
  onMinAmountChange: (amount: string) => void;
  onMaxAmountChange: (amount: string) => void;
  onSwapsPerRoundChange: (count: number) => void;
  onNumberOfRoundsChange: (rounds: number) => void;
  onLoopReturnAmountChange: (amount: string) => void;
  onSwapDelayMsChange: (ms: number) => void;
  running?: boolean;
}

export function BoostModePanel({
  minAmount,
  maxAmount,
  swapsPerRound,
  numberOfRounds,
  loopReturnAmount,
  toTokenBalance,
  toTokenName,
  swapDelayMs,
  onMinAmountChange,
  onMaxAmountChange,
  onSwapsPerRoundChange,
  onNumberOfRoundsChange,
  onLoopReturnAmountChange,
  onSwapDelayMsChange,
  running,
}: BoostModePanelProps) {
  const isInfinite = numberOfRounds === 0;

  return (
    <div className="rounded-xl theme-border p-4 space-y-4 bg-white/10 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡⛏️⚡</span>
          <h3 className="text-sm font-bold uppercase tracking-wider gradient-text-ember">
            Boost Configuration
          </h3>
        </div>
        {running && (
          <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-led-pulse" />
            <span className="text-[10px] uppercase tracking-widest text-green-400 font-semibold">
              Running
            </span>
          </div>
        )}
      </div>

      {/* Amount Range */}
      <div className="space-y-3">
        <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
          Amount Range (Randomized)
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">
              Min Amount
            </div>
            <input
              type="text"
              className="w-full px-3 py-2.5 glass-premium border border-ember-orange/40 rounded-lg text-sm font-mono font-bold text-center text-white focus:border-ember-orange/60 focus:outline-none focus:ring-2 focus:ring-ember-orange/40 smooth-transition placeholder-gray-600 disabled:opacity-50"
              value={minAmount}
              onChange={(e) => onMinAmountChange(e.target.value)}
              placeholder="0.001"
              disabled={running}
            />
          </div>
          <div className="space-y-2">
            <div className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">
              Max Amount
            </div>
            <input
              type="text"
              className="w-full px-3 py-2.5 glass-premium border border-ember-amber/40 rounded-lg text-sm font-mono font-bold text-center text-white focus:border-ember-amber/60 focus:outline-none focus:ring-2 focus:ring-ember-amber/40 smooth-transition placeholder-gray-600 disabled:opacity-50"
              value={maxAmount}
              onChange={(e) => onMaxAmountChange(e.target.value)}
              placeholder="0.01"
              disabled={running}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-ember-orange/10 border border-ember-orange/30 rounded-lg">
          <svg className="w-4 h-4 text-ember-orange flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] text-gray-300 leading-tight">
            Each swap will use a random amount between min and max
          </span>
        </div>
      </div>

      {/* Swaps Per Round */}
      <div className="space-y-2">
        <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
          Swaps Per Round
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="1"
            max="50"
            className="flex-1 px-4 py-2.5 glass-premium border border-ember-orange/40 rounded-lg text-lg font-mono font-bold text-center text-white focus:border-ember-orange/60 focus:outline-none focus:ring-2 focus:ring-ember-orange/40 smooth-transition disabled:opacity-50"
            value={swapsPerRound}
            onChange={(e) => onSwapsPerRoundChange(Math.max(1, parseInt(e.target.value) || 1))}
            disabled={running}
          />
          <div className="text-sm text-gray-400">
            forward swap{swapsPerRound !== 1 ? 's' : ''} + 1 return
          </div>
        </div>
      </div>

      {/* Swap Delay */}
      <div className="space-y-2">
        <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
          Delay Between Swaps
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            max="60000"
            step="100"
            className="flex-1 px-4 py-2.5 glass-premium border border-cyan-500/40 rounded-lg text-lg font-mono font-bold text-center text-white focus:border-cyan-500/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 smooth-transition disabled:opacity-50"
            value={swapDelayMs}
            onChange={(e) => onSwapDelayMsChange(Math.max(0, parseInt(e.target.value) || 0))}
            disabled={running}
          />
          <div className="text-sm text-gray-400 min-w-[60px]">
            {swapDelayMs >= 1000 ? `${(swapDelayMs / 1000).toFixed(1)}s` : `${swapDelayMs}ms`}
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <svg className="w-4 h-4 text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-[10px] text-gray-300 leading-tight">
            Time to wait between executing 2 consecutive swaps (0-60000ms)
          </span>
        </div>
      </div>

      {/* Number of Rounds */}
      <div className="space-y-2">
        <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
          Number of Rounds
        </label>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min="0"
            max="100"
            className="flex-1 px-4 py-2.5 glass-premium border border-purple-500/40 rounded-lg text-lg font-mono font-bold text-center text-white focus:border-purple-500/60 focus:outline-none focus:ring-2 focus:ring-purple-500/40 smooth-transition disabled:opacity-50"
            value={numberOfRounds}
            onChange={(e) => onNumberOfRoundsChange(Math.max(0, parseInt(e.target.value) || 0))}
            disabled={running}
          />
          <div className="text-sm text-gray-400 min-w-[80px]">
            {isInfinite ? (
              <span className="text-cyan-400 font-semibold">∞ Infinite</span>
            ) : (
              <span>round{numberOfRounds !== 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <span className="text-[10px] text-gray-300 leading-tight">
            {isInfinite ? (
              <><span className="text-cyan-400 font-semibold">∞</span> Infinite mode: Runs until you click STOP</>
            ) : (
              <>Set to 0 for infinite, or 1-100 for fixed rounds</>
            )}
          </span>
        </div>
      </div>

      {/* Return Swap Amount */}
      <div className="space-y-2 pt-3 border-t border-gray-700/50">
        <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
          Return Swap Amount ({toTokenName})
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-2.5 glass-premium border border-ember-amber/40 rounded-lg text-sm font-mono font-bold text-right text-white focus:border-ember-amber/60 focus:outline-none focus:ring-2 focus:ring-ember-amber/40 smooth-transition placeholder-gray-600 disabled:opacity-50"
            value={loopReturnAmount}
            onChange={(e) => onLoopReturnAmountChange(e.target.value)}
            placeholder="Leave empty for ALL"
            disabled={running}
          />
          {toTokenBalance > 0 && !running && (
            <button
              onClick={() => onLoopReturnAmountChange(toTokenBalance.toString())}
              className="px-2 py-2 bg-ember-amber/20 border border-ember-amber/50 rounded-lg text-[10px] font-bold text-ember-amber hover:bg-ember-amber/30 hover:scale-105 active:scale-95 smooth-transition flex-shrink-0"
            >
              MAX
            </button>
          )}
        </div>
        {toTokenBalance > 0 && (
          <div className="text-[11px] text-gray-500">
            Available: {toTokenBalance.toFixed(6)} {toTokenName}
          </div>
        )}
        <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
          <span className="text-green-400 text-xs">💡</span>
          <span className="text-[10px] text-gray-300 leading-tight">
            <span className="text-green-400 font-semibold">Recommended:</span> Leave empty to swap ALL accumulated {toTokenName} tokens
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="neomorph-pressed rounded-xl p-3 space-y-2">
        <div className="text-[9px] uppercase tracking-widest text-gray-500 font-semibold">
          Execution Summary
        </div>
        <div className="space-y-1 text-[11px] text-gray-300">
          <div className="flex justify-between">
            <span className="text-gray-400">Strategy:</span>
            <span className="font-semibold text-ember-orange">Random {minAmount}-{maxAmount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Per Round:</span>
            <span className="font-semibold">{swapsPerRound} swaps + 1 return</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Swap Delay:</span>
            <span className="font-semibold text-cyan-400">
              {swapDelayMs >= 1000 ? `${(swapDelayMs / 1000).toFixed(1)}s` : `${swapDelayMs}ms`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Rounds:</span>
            <span className="font-semibold">
              {isInfinite ? <span className="text-cyan-400">∞ Infinite</span> : `${numberOfRounds} round${numberOfRounds !== 1 ? 's' : ''}`}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Return Amount:</span>
            <span className="font-semibold">
              {loopReturnAmount ? `${loopReturnAmount} ${toTokenName}` : <span className="text-green-400">ALL accumulated</span>}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
