"use client";
import React from "react";
import { StatusBadge } from "@/components/StatusBadge";
import { TOKEN_NAMES } from "@/lib/vaults";
import { short, cn } from "@/lib/utils";

const WETWARE_ADDRESS = "9GjEVnpWiLe2uknUmtaH6DSfgcBvL66DtSKGREXDctZU";
const WETWARE_OPERATIONS = {
  condensation: { amount: 0.001, label: "Condensation" },
  lubrication: { amount: 0.01, label: "Lubrication" },
  ionization: { amount: 0.1, label: "Ionization" }
} as const;

type Mode = "normal" | "roundtrip" | "boost" | "loopreturn";
type Affiliate = "pond0x" | "aquavaults";
type AppTab = "autobot" | "void";

interface StatusDashboardProps {
  wallet: string;
  tokenBalance: number;
  solBalance: number;
  fromMint: string;
  mode: Mode;
  running: boolean;
  autoCount: number;
  currentSwapIndex: number;
  platformFeeBps: number;
  slippageBps: number;
  currentVault: string | null;
  affiliate: Affiliate;
  lastWetwareOp: string;
  networkStatus: "online" | "offline";
  rpc: string;
  activeTab: AppTab;
}

export function StatusDashboard({
  wallet,
  tokenBalance,
  solBalance,
  fromMint,
  mode,
  running,
  autoCount,
  currentSwapIndex,
  platformFeeBps,
  slippageBps,
  currentVault,
  affiliate,
  lastWetwareOp,
  networkStatus,
  rpc,
  activeTab,
}: StatusDashboardProps) {
  return (
    <section
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      role="region"
      aria-label="Status indicators"
    >
      {/* Token Balance */}
      <StatusBadge
        label="Token Balance"
        value={wallet ? `${tokenBalance.toFixed(4)} ${TOKEN_NAMES[fromMint]}` : "—"}
        ledStatus={wallet ? (tokenBalance > 0 ? "green" : "yellow") : "gray"}
        flyoutContent={
          wallet ? (
            <div className="space-y-2">
              <div className="text-xs text-gray-400">Selected Token</div>
              <div className="font-mono text-ember-orange-light">{TOKEN_NAMES[fromMint]}</div>
              <div className="text-xs text-gray-400 mt-2">Balance</div>
              <div className="font-mono text-white text-lg">{tokenBalance.toFixed(6)}</div>
            </div>
          ) : (
            <div className="text-gray-400">Connect wallet to view balance</div>
          )
        }
      />

      {/* SOL Balance */}
      <StatusBadge
        label="SOL Balance"
        value={wallet ? `${solBalance.toFixed(4)} SOL` : "—"}
        ledStatus={wallet ? (solBalance > 0.01 ? "green" : "red") : "gray"}
        flyoutContent={
          wallet ? (
            <div className="space-y-2">
              <div className="text-xs text-gray-400">Solana Balance</div>
              <div className="font-mono text-neon-pink-light text-lg">{solBalance.toFixed(6)} SOL</div>
              <div className="text-xs text-gray-400 mt-2">Estimated USD</div>
              <div className="font-mono text-white">${(solBalance * 150).toFixed(2)}</div>
            </div>
          ) : (
            <div className="text-gray-400">Connect wallet to view balance</div>
          )
        }
      />

      {/* Mode */}
      <StatusBadge
        label="Mode"
        value={mode.toUpperCase()}
        ledStatus={mode !== "normal" ? "blue" : "gray"}
        flyoutContent={
          <div className="space-y-2">
            <div className="text-xs text-gray-400">Swap Mode</div>
            <div className="font-semibold text-neon-rose">{mode}</div>
            <div className="text-xs text-gray-400 mt-2">Description</div>
            <div className="text-xs">
              {mode === "normal" && "Standard single swap execution"}
              {mode === "roundtrip" && "Swap both ways (requires >$10)"}
              {mode === "boost" && "Randomized between min/max"}
              {mode === "loopreturn" && "Loop swaps then return"}
            </div>
          </div>
        }
      />

      {/* Status */}
      <StatusBadge
        label="Status"
        value={running && currentSwapIndex > 0 ? `${currentSwapIndex}/${autoCount}` : running ? "RUNNING" : "IDLE"}
        ledStatus={running ? "green" : "gray"}
        flyoutContent={
          <div className="space-y-2">
            <div className="text-xs text-gray-400">Swap Status</div>
            <div className={cn("font-semibold", running ? "text-neon-pink-light" : "text-gray-400")}>
              {running ? "Active" : "Idle"}
            </div>
            {running && (
              <>
                <div className="text-xs text-gray-400 mt-2">Progress</div>
                <div className="font-mono text-white text-lg">
                  {currentSwapIndex > 0 ? `${currentSwapIndex} / ${autoCount}` : `0 / ${autoCount}`}
                </div>
                <div className="text-xs text-gray-400">swaps completed</div>
              </>
            )}
          </div>
        }
      />

      {/* Fee */}
      <StatusBadge
        label="Fee"
        value={`${(platformFeeBps / 100).toFixed(2)}%`}
        ledStatus="blue"
        flyoutContent={
          <div className="space-y-2">
            <div className="text-xs text-gray-400">Platform Fee</div>
            <div className="font-mono text-neon-rose text-lg">{(platformFeeBps / 100).toFixed(2)}%</div>
            <div className="text-xs text-gray-400 mt-2">Basis Points</div>
            <div className="font-mono text-white">{platformFeeBps} bps</div>
          </div>
        }
      />

      {/* Slippage */}
      <StatusBadge
        label="Slippage"
        value={`${(slippageBps / 100).toFixed(2)}%`}
        ledStatus="yellow"
        flyoutContent={
          <div className="space-y-2">
            <div className="text-xs text-gray-400">Slippage Tolerance</div>
            <div className="font-mono text-neon-red-light text-lg">{(slippageBps / 100).toFixed(2)}%</div>
            <div className="text-xs text-gray-400 mt-2">Basis Points</div>
            <div className="font-mono text-white">{slippageBps} bps</div>
          </div>
        }
      />

      {/* Vault (Autobot Tab Only) */}
      {activeTab === "autobot" && (
        <StatusBadge
          label="Vault"
          value={currentVault ? short(currentVault, 4) : "NONE"}
          ledStatus={currentVault ? "green" : "gray"}
          flyoutContent={
            <div className="space-y-2">
              <div className="text-xs text-gray-400">Connected Vault</div>
              {currentVault ? (
                <>
                  <div className="font-mono text-neon-pink-light text-xs break-all">{currentVault}</div>
                  <div className="text-xs text-gray-400 mt-2">Affiliate</div>
                  <div className="font-semibold text-white">{affiliate === "pond0x" ? "Pond0x" : "AquaVaults"}</div>
                </>
              ) : (
                <div className="text-gray-400">No vault for this token</div>
              )}
            </div>
          }
        />
      )}

      {/* Wetware (Void Tab Only) */}
      {activeTab === "void" && (
        <StatusBadge
          label="Wetware"
          value={lastWetwareOp || "READY"}
          ledStatus={lastWetwareOp ? "green" : "gray"}
          flyoutContent={
            <div className="space-y-2">
              <div className="text-xs text-gray-400">Wetware Protocol</div>
              {lastWetwareOp ? (
                <>
                  <div className="font-semibold text-ember-orange-light text-lg">{lastWetwareOp}</div>
                  <div className="text-xs text-gray-400 mt-2">Last Operation</div>
                  <div className="font-mono text-white text-xs">
                    {WETWARE_OPERATIONS[lastWetwareOp.toLowerCase() as keyof typeof WETWARE_OPERATIONS]?.amount} SOL
                  </div>
                  <div className="text-xs text-gray-400 mt-2">Target Address</div>
                  <div className="font-mono text-ember-amber-light text-xs break-all">{short(WETWARE_ADDRESS, 6)}</div>
                </>
              ) : (
                <div className="text-gray-400">Ready for operations</div>
              )}
            </div>
          }
        />
      )}

      {/* Network Status */}
      <StatusBadge
        label="Network"
        value={networkStatus.toUpperCase()}
        ledStatus={networkStatus === "online" ? "green" : "red"}
        flyoutContent={
          <div className="space-y-2">
            <div className="text-xs text-gray-400">Network Status</div>
            <div className={cn("font-semibold", networkStatus === "online" ? "text-neon-pink-light" : "text-neon-red")}>
              {networkStatus === "online" ? "Connected" : "Disconnected"}
            </div>
            <div className="text-xs text-gray-400 mt-2">RPC Endpoint</div>
            <div className="font-mono text-xs text-white break-all">{rpc.slice(0, 40)}...</div>
          </div>
        }
      />
    </section>
  );
}
