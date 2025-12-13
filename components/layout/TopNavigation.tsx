"use client";
import React, { type CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface TopNavigationProps {
  theme: "dark" | "light";
  onThemeToggle: () => void;
  waterEffect: boolean;
  onWaterToggle: () => void;
}

export function TopNavigation({
  theme,
  onThemeToggle,
  waterEffect,
  onWaterToggle,
}: TopNavigationProps) {
  const pathname = usePathname();
  const navItems = [
    { href: "/", label: "Dashboard", tone: "lily" as const },
    { href: "/swapper", label: "Swapper", tone: "wave" as const },
    { href: "/activity", label: "Activity", tone: "spark" as const },
  ];

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl"
      style={{
        background:
          "linear-gradient(120deg, rgba(10, 20, 25, 0.92), rgba(13, 31, 45, 0.92))",
        borderBottom: "1px solid var(--theme-border, rgba(107,157,120,0.35))",
        boxShadow:
          "0 8px 32px rgba(0, 0, 0, 0.45), 0 0 24px var(--theme-glow-soft, rgba(107,157,120,0.25))",
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle at 10% 10%, rgba(74, 143, 184, 0.08), transparent 35%), radial-gradient(circle at 80% 0%, rgba(240, 198, 116, 0.08), transparent 30%), radial-gradient(circle at 50% 80%, rgba(139, 196, 159, 0.12), transparent 40%)",
          filter: "blur(32px)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(139, 196, 159, 0.55) 50%, transparent 100%)",
          animation: "shimmer 3s ease-in-out infinite",
        }}
      />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div className="py-3 grid gap-3 md:grid-cols-[minmax(240px,1fr)_minmax(auto,620px)_minmax(260px,1fr)] items-center">
          <Link href="/" className="group flex items-center gap-3 w-fit" aria-label="Pond0x Dashboard">
            <div className="relative">
              <span className="absolute inset-0 rounded-full blur-2xl opacity-60 transition group-hover:opacity-90"
                style={{ background: "radial-gradient(circle, var(--glow-blue, rgba(74,143,184,0.5)) 0%, transparent 60%)" }}
              />
              <img
                className="relative w-14 h-14 rounded-full border border-[color:var(--theme-border,rgba(107,157,120,0.35))] shadow-lg shadow-[rgba(0,0,0,0.35)] transition-transform duration-300 group-hover:scale-105"
                src="/pond0x-logo.png"
                alt="Pond0x Logo"
                style={{
                  background: "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.05), transparent 50%)",
                  filter: "drop-shadow(0 0 10px var(--glow-blue, rgba(74,143,184,0.35)))",
                }}
              />
            </div>
            <div className="flex flex-col">
              <span
                className="text-lg sm:text-xl font-bold tracking-wider bg-clip-text text-transparent transition-all duration-500 group-hover:tracking-[0.22em]"
                style={{
                  backgroundImage: "linear-gradient(120deg, var(--theme-primary), var(--theme-secondary), var(--pink-bright, #ffc0e3))",
                  backgroundSize: "200% auto",
                  animation: "gradient-shift 6s ease infinite",
                }}
              >
                Pond0matic
              </span>
              <span className="text-xs text-[color:var(--theme-text-muted)]">
                Dashboard & Swapper 
              </span>
            </div>
          </Link>

          <nav
            className="relative flex items-center justify-center gap-2 rounded-2xl px-2 py-1.5 shadow-lg overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(26,58,82,0.92), rgba(10,18,26,0.9))",
              border: "1px solid var(--theme-border, rgba(107,157,120,0.25))",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
            }}
            aria-label="Primary navigation"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                background: "linear-gradient(135deg, rgba(74,124,89,0.12), rgba(74,143,184,0.12), rgba(240,198,116,0.12))",
                backgroundSize: "220% 220%",
                animation: "gradient-shift 9s ease infinite",
              }}
            />
            <div className="flex items-center gap-1.5 relative">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  active={pathname === item.href}
                  label={item.label}
                  tone={item.tone}
                />
              ))}
            </div>
          </nav>

          <div className="flex flex-wrap items-end justify-end gap-2">
            <ControlToggle
              active={theme === "dark"}
              activeLabel="Dark"
              inactiveLabel="Light"
              icon={theme === "dark" ? <MoonIcon /> : <SunIcon />}
              onClick={onThemeToggle}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              tone="lily"
            />
            <ControlToggle
              active={waterEffect}
              activeLabel="Water"
              inactiveLabel="Water"
              icon={waterEffect ? <DropletIcon /> : <WaveIcon />}
              onClick={onWaterToggle}
              title={`${waterEffect ? "Disable" : "Enable"} pond water effect`}
              tone="wave"
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </header>
  );
}

type NavTone = "lily" | "wave" | "spark";

interface NavLinkProps {
  href: string;
  active: boolean;
  label: string;
  tone: NavTone;
}

function NavLink({ href, active, label, tone }: NavLinkProps) {
  const tones: Record<
    NavTone,
    { from: string; to: string; border: string; glow: string }
  > = {
    lily: {
      from: "var(--theme-primary)",
      to: "var(--theme-secondary)",
      border: "rgba(139, 196, 159, 0.55)",
      glow: "rgba(139, 196, 159, 0.28)",
    },
    wave: {
      from: "var(--pond-bright, #4a8fb8)",
      to: "var(--pond-light, #2d5f7f)",
      border: "rgba(74, 143, 184, 0.6)",
      glow: "rgba(74, 143, 184, 0.25)",
    },
    spark: {
      from: "var(--gold-light, #f0c674)",
      to: "var(--pink-bright, #ffc0e3)",
      border: "rgba(240, 198, 116, 0.6)",
      glow: "rgba(255, 192, 227, 0.26)",
    },
  };

  const vars = {
    "--tone-from": tones[tone].from,
    "--tone-to": tones[tone].to,
    "--tone-border": tones[tone].border,
    "--tone-glow": tones[tone].glow,
  } as CSSProperties;

  return (
    <Link
      href={href}
      className={cn(
        "group relative px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300",
        "flex items-center gap-2 overflow-hidden",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--tone-border)] focus-visible:ring-offset-[rgba(13,31,45,0.8)]",
        active ? "text-white" : "text-[color:var(--theme-text-muted)] hover:text-white"
      )}
      style={{
        ...vars,
        border: active ? "1px solid var(--tone-border)" : "1px solid transparent",
        background: active
          ? "linear-gradient(135deg, var(--tone-from), var(--tone-to))"
          : "rgba(255,255,255,0.02)",
        boxShadow: active
          ? "0 8px 26px var(--tone-glow), inset 0 1px 0 rgba(255,255,255,0.08)"
          : "0 0 0 1px rgba(255,255,255,0.02)",
      }}
      aria-current={active ? "page" : undefined}
    >
      <span
        className={cn(
          "absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none",
          active ? "opacity-40" : "opacity-0 group-hover:opacity-20"
        )}
        style={{
          background: "linear-gradient(135deg, var(--tone-from), var(--tone-to))",
          filter: "blur(10px)",
        }}
      />
      <span className="relative flex items-center gap-2">
        <span className="relative z-10">{label}</span>
      </span>
      {active && (
        <span
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            boxShadow:
              "0 0 0 1px var(--tone-border), inset 0 0 0 1px rgba(255,255,255,0.08)",
          }}
        />
      )}
    </Link>
  );
}

interface ControlToggleProps {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  tone: NavTone;
}

function ControlToggle({
  active,
  activeLabel,
  inactiveLabel,
  icon,
  onClick,
  title,
  tone,
}: ControlToggleProps) {
  const tones: Record<NavTone, { border: string; glow: string; surface: string }> = {
    lily: {
      border: "rgba(139, 196, 159, 0.6)",
      glow: "rgba(139, 196, 159, 0.35)",
      surface: "rgba(26, 58, 82, 0.75)",
    },
    wave: {
      border: "rgba(74, 143, 184, 0.6)",
      glow: "rgba(74, 143, 184, 0.35)",
      surface: "rgba(20, 38, 52, 0.75)",
    },
    spark: {
      border: "rgba(240, 198, 116, 0.55)",
      glow: "rgba(240, 198, 116, 0.3)",
      surface: "rgba(40, 30, 18, 0.7)",
    },
  };

  const toneValues = tones[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={title}
      className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[rgba(255,255,255,0.4)] focus-visible:ring-offset-[rgba(13,31,45,0.9)]"
      style={{
        background: toneValues.surface,
        border: `1px solid ${active ? toneValues.border : "rgba(255,255,255,0.06)"}`,
        color: active
          ? "var(--theme-text)"
          : "var(--theme-text-muted, rgba(156,163,175,1))",
        boxShadow: active
          ? `0 0 0 1px ${toneValues.border}, 0 10px 28px ${toneValues.glow}`
          : "0 1px 0 rgba(255,255,255,0.08)",
      }}
    >
      <span className="relative flex items-center gap-2">
        <span
          className={cn(
            "flex items-center justify-center w-5 h-5 rounded-full transition-all duration-300",
            active ? "bg-white/15" : "bg-white/5"
          )}
          style={{
            boxShadow: active
              ? `0 0 14px ${toneValues.glow}`
              : "0 0 0 transparent",
          }}
        >
          <span className="text-base leading-none">{icon}</span>
        </span>
        <span className="hidden sm:inline">
          {active ? activeLabel : inactiveLabel}
        </span>
      </span>
    </button>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 18a6 6 0 100-12 6 6 0 000 12z" />
      <path d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.364-7.364L16.95 5.05M7.05 16.95l-1.414 1.414m0-13.657L7.05 5.05m9.9 9.9l1.414 1.414" />
    </svg>
  );
}

function DropletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12.66 2.58a1 1 0 00-1.32 0C9.07 4.5 5 8.73 5 12.5 5 17.19 8.58 20 12 20s7-2.81 7-7.5c0-3.77-4.07-8-6.34-9.92zM12 18c-2.14 0-5-1.2-5-5.5 0-2.41 2.33-5.53 5-8.03 2.67 2.5 5 5.62 5 8.03C17 16.8 14.14 18 12 18z" />
    </svg>
  );
}

function WaveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M4.5 15c1.5 0 2.25-1 3.75-1s2.25 1 3.75 1 2.25-1 3.75-1 2.25 1 3.75 1v2c-1.5 0-2.25-1-3.75-1s-2.25 1-3.75 1-2.25-1-3.75-1-2.25 1-3.75 1V15z" />
      <path d="M4.5 9c1.5 0 2.25-1 3.75-1S10.5 9 12 9s2.25-1 3.75-1S18 9 19.5 9v2c-1.5 0-2.25-1-3.75-1S13.5 11 12 11s-2.25-1-3.75-1S6 11 4.5 11V9z" />
    </svg>
  );
}
