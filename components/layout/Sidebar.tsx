"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSettings } from "@/contexts/SettingsContext";
import { ConnectionStatus } from "@/components/layout/ConnectionStatus";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "◧" },
  { href: "/portfolio", label: "Portfolio", icon: "◱" },
  { href: "/settings", label: "Settings", icon: "⚙" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { connected } = useWallet();
  const { settingsReady, setSetupOpen } = useSettings();
  const fullyConnected = connected && settingsReady;

  return (
    <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col border-r border-edge bg-surface p-3 lg:w-56 lg:p-4">
      <div className="mb-6 flex items-center gap-2.5">
        <div className="h-7 w-7 shrink-0 rounded-lg bg-gradient-to-br from-accent to-accent-strong" />
        <span className="hidden text-sm font-bold lg:inline">Pond0matic</span>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-accent/10 font-semibold text-accent"
                  : "text-ink-muted hover:bg-surface-2 hover:text-ink"
              )}
            >
              <span aria-hidden>{item.icon}</span>
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-3 border-t border-edge pt-4">
        {!fullyConnected ? (
          <button
            type="button"
            onClick={() => setSetupOpen(true)}
            className="rounded-lg bg-gradient-to-br from-accent to-accent-strong px-3 py-2 text-xs font-bold text-accent-deep"
          >
            <span className="lg:hidden">⚡</span>
            <span className="hidden lg:inline">Connect</span>
          </button>
        ) : null}
        <div className="hidden lg:block">
          <ConnectionStatus />
        </div>
        <div className="hidden lg:block">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
