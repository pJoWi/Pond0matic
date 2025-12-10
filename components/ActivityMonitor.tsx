"use client";
import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useSwapperContext } from "@/contexts/SwapperContext";

interface Transaction {
  signature?: string;
  status: "success" | "failed" | "pending" | "info";
  message: string;
  timestamp: number;
}

interface ActivityMonitorProps {
  onOpenSwapper: () => void;
}

export function ActivityMonitor({ onOpenSwapper }: ActivityMonitorProps) {
  const ctx = useSwapperContext();
  const [filter, setFilter] = useState<"all" | "success" | "failed" | "pending">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Parse activities into structured transactions
  const transactions = useMemo(() => {
    return ctx.activities.map((line, idx) => {
      // Extract transaction signature from ORB/Solscan/explorer links
      // Matches: https://orb.helius.dev/tx/{sig} or https://solscan.io/tx/{sig}
      const signatureMatch = line.match(/https:\/\/(?:orb\.helius\.dev|solscan\.io|explorer\.orb\.land)\/tx\/([^\s?]+)/i);
      const signature = signatureMatch ? signatureMatch[1] : undefined;

      // Determine status - only use signature-based transactions for success/failed/pending
      let status: Transaction["status"] = "info";

      if (signature) {
        // This is an actual blockchain transaction
        const isError = /error|failed/i.test(line);
        const isConfirmed = /confirmed/i.test(line);
        const isSent = /sent/i.test(line);

        if (isError) {
          status = "failed";
        } else if (isConfirmed) {
          status = "success";
        } else if (isSent) {
          status = "pending";
        }
      }

      return {
        signature,
        status,
        message: line,
        timestamp: Date.now() - (ctx.activities.length - idx) * 1000 // Approximate timestamp
      };
    }).reverse(); // Most recent first
  }, [ctx.activities]);

  // Filter transactions - Only show transactions with Solscan signatures
  const filteredTransactions = useMemo(() => {
    // First filter: Only show transactions with signatures (actual blockchain transactions)
    let filtered = transactions.filter(tx => tx.signature);

    // Apply status filter
    if (filter !== "all") {
      filtered = filtered.filter(tx => tx.status === filter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.message.toLowerCase().includes(query) ||
        tx.signature?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [transactions, filter, searchQuery]);

  // Stats - Only count transactions with Solscan links (actual blockchain transactions)
  const stats = useMemo(() => {
    const blockchainTransactions = transactions.filter(tx => tx.signature); // Only count txs with signatures
    const total = blockchainTransactions.length;
    const success = blockchainTransactions.filter(tx => tx.status === "success").length;
    const failed = blockchainTransactions.filter(tx => tx.status === "failed").length;
    const pending = blockchainTransactions.filter(tx => tx.status === "pending").length;
    const successRate = total > 0 ? ((success / total) * 100).toFixed(1) : "0.0";

    return { total, success, failed, pending, successRate };
  }, [transactions]);

  return (
    <div className="pt-20 pb-8 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-cyber-darker/80 via-cyber-black/90 to-cyber-darker/80 backdrop-blur-2xl border border-purple-500/30 rounded-2xl p-6 shadow-2xl shadow-purple-500/10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500 bg-clip-text text-transparent mb-2">
                Activity Monitor
              </h1>
              <p className="text-gray-400 text-sm">
                Real-time transaction history for {ctx.wallet ? `${ctx.wallet.slice(0, 8)}...${ctx.wallet.slice(-6)}` : "your wallet"}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenSwapper}
                className="px-4 py-2 bg-gradient-to-br from-neon-pink via-neon-rose to-neon-red text-white rounded-lg font-semibold text-sm shadow-lg shadow-neon-pink/30 hover:shadow-neon-pink/50 hover:scale-105 active:scale-95 transition-all duration-300"
              >
                Open Swapper
              </button>
              <button
                onClick={ctx.clearLog}
                disabled={transactions.length === 0}
                className="px-4 py-2 bg-red-500/20 border border-red-500/40 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/30 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed disabled:scale-100 transition-all focus:outline-none"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
            <StatCard
              label="Total"
              value={stats.total}
              color="gray"
              icon={<TotalIcon />}
            />
            <StatCard
              label="Success"
              value={stats.success}
              color="green"
              icon={<SuccessIcon />}
            />
            <StatCard
              label="Failed"
              value={stats.failed}
              color="red"
              icon={<FailedIcon />}
            />
            <StatCard
              label="Pending"
              value={stats.pending}
              color="blue"
              icon={<PendingIcon />}
            />
            <StatCard
              label="Success Rate"
              value={`${stats.successRate}%`}
              color="purple"
              icon={<RateIcon />}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-cyber-darker/60 backdrop-blur-md border border-purple-500/20 rounded-xl p-4 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search transactions, signatures..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 bg-black/30 border border-purple-500/30 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
                <svg className="absolute left-3 top-3 w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <FilterButton
                active={filter === "all"}
                onClick={() => setFilter("all")}
                label="All"
                count={transactions.length}
              />
              <FilterButton
                active={filter === "success"}
                onClick={() => setFilter("success")}
                label="Success"
                count={stats.success}
                color="green"
              />
              <FilterButton
                active={filter === "failed"}
                onClick={() => setFilter("failed")}
                label="Failed"
                count={stats.failed}
                color="red"
              />
              <FilterButton
                active={filter === "pending"}
                onClick={() => setFilter("pending")}
                label="Pending"
                count={stats.pending}
                color="blue"
              />
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-cyber-darker/60 backdrop-blur-md border border-purple-500/20 rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto">
            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                <svg className="w-20 h-20 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <div className="text-xl font-semibold text-gray-400 mb-2">
                  {searchQuery || filter !== "all" ? "No matching transactions" : "No activity yet"}
                </div>
                <div className="text-sm text-gray-500 mb-6">
                  {searchQuery || filter !== "all"
                    ? "Try adjusting your filters or search query"
                    : "Start swapping to see transaction history here"}
                </div>
                {!ctx.wallet && (
                  <button
                    onClick={ctx.connect}
                    className="px-6 py-3 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-lg font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 active:scale-95 transition-all"
                  >
                    Connect Wallet
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {filteredTransactions.map((tx, idx) => (
                  <TransactionRow key={idx} transaction={tx} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
interface StatCardProps {
  label: string;
  value: string | number;
  color: "gray" | "green" | "red" | "blue" | "purple";
  icon: React.ReactNode;
}

function StatCard({ label, value, color, icon }: StatCardProps) {
  const colorClasses = {
    gray: "border-gray-500/30 text-gray-400",
    green: "border-green-500/30 text-green-400",
    red: "border-red-500/30 text-red-400",
    blue: "border-blue-500/30 text-blue-400",
    purple: "border-purple-500/30 text-purple-400"
  };

  return (
    <div className={cn(
      "bg-black/30 backdrop-blur-sm border rounded-lg p-3 transition-all duration-300 hover:scale-105",
      colorClasses[color]
    )}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
        <span className="w-4 h-4">{icon}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}

// Filter Button Component
interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  color?: "green" | "red" | "blue";
}

function FilterButton({ active, onClick, label, count, color }: FilterButtonProps) {
  const colorClasses = color ? {
    green: active
      ? "bg-green-500/20 border-green-500/50 text-green-400"
      : "border-green-500/20 text-green-400/60 hover:border-green-500/40 hover:text-green-400",
    red: active
      ? "bg-red-500/20 border-red-500/50 text-red-400"
      : "border-red-500/20 text-red-400/60 hover:border-red-500/40 hover:text-red-400",
    blue: active
      ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
      : "border-blue-500/20 text-blue-400/60 hover:border-blue-500/40 hover:text-blue-400"
  } : {};

  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-lg border text-sm font-semibold transition-all duration-300 hover:scale-105 active:scale-95 whitespace-nowrap",
        color ? colorClasses[color] : (
          active
            ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
            : "border-purple-500/20 text-purple-400/60 hover:border-purple-500/40 hover:text-purple-400"
        )
      )}
    >
      {label} <span className="ml-1.5 opacity-70">({count})</span>
    </button>
  );
}

// Transaction Row Component
interface TransactionRowProps {
  transaction: Transaction;
}

function TransactionRow({ transaction }: TransactionRowProps) {
  const statusConfig = {
    success: {
      color: "green",
      icon: <SuccessIcon />,
      dotClass: "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.9)] animate-pulse"
    },
    failed: {
      color: "red",
      icon: <FailedIcon />,
      dotClass: "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]"
    },
    pending: {
      color: "blue",
      icon: <PendingIcon />,
      dotClass: "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.7)] animate-pulse"
    },
    info: {
      color: "gray",
      icon: <TotalIcon />,
      dotClass: "bg-gray-500"
    }
  };

  const config = statusConfig[transaction.status];
  const formattedTime = new Date(transaction.timestamp).toLocaleString();
  const solscanUrl = transaction.signature ? `https://solscan.io/tx/${transaction.signature}` : undefined;

  const handleRowClick = () => {
    if (solscanUrl) {
      window.open(solscanUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      onClick={handleRowClick}
      className={cn(
        "p-4 transition-all duration-300 group",
        solscanUrl && "hover:bg-white/5 cursor-pointer"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Status Indicator */}
        <div className="flex-shrink-0 mt-1">
          <div className={cn("w-3 h-3 rounded-full transition-all duration-300", config.dotClass)} />
        </div>

        {/* Transaction Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <div className="font-mono text-sm text-gray-200 break-all leading-relaxed group-hover:text-purple-300 transition-colors">
                {transaction.message}
              </div>
            </div>
            <div className="flex-shrink-0 text-xs text-gray-500">
              {formattedTime}
            </div>
          </div>

          {/* Explorer Links */}
          {transaction.signature && (
            <div className="flex items-center gap-3 mt-3">
              <a
                href={`https://solscan.io/tx/${transaction.signature}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 rounded-lg text-xs font-semibold text-purple-400 hover:bg-purple-500/20 hover:border-purple-500/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
                Solscan
              </a>
              <a
                href={`https://explorer.orb.land/tx/${transaction.signature}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
                ORB Explorer
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Icon Components
function TotalIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function SuccessIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function FailedIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PendingIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function RateIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
