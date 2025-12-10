"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { SwapMode } from "@/types/swapModes";

interface TopNavigationProps {
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  waterEffect: boolean;
  onWaterToggle: () => void;
  swapMode: SwapMode;
  onSwapModeChange: (mode: SwapMode) => void;
}

export function TopNavigation({
  theme,
  onThemeToggle,
  waterEffect,
  onWaterToggle,
  swapMode,
  onSwapModeChange
}: TopNavigationProps) {
  const pathname = usePathname();
  const isSwapperRoute = pathname === '/swapper';

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl"
      style={{
        background: 'linear-gradient(to bottom, rgba(10, 20, 25, 0.95), rgba(10, 20, 25, 0.9))',
        borderBottom: '1px solid rgba(255, 107, 183, 0.15)',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 107, 183, 0.1)'
      }}
    >
      {/* Animated glow line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 107, 183, 0.5) 50%, transparent 100%)',
          animation: 'shimmer 3s ease-in-out infinite'
        }}
      />

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
        <div
          className="grid items-center gap-4 py-3"
          style={{
            gridTemplateColumns: 'minmax(200px, 1fr) minmax(auto, 600px) minmax(200px, 1fr)',
          }}
        >
          {/* Left: Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group w-fit">
            <div className="relative">
              <img
                className="w-10 h-10 rounded-full transition-transform duration-300 group-hover:scale-110"
                src="/pond0x-logo.png"
                alt="PondX Logo"
                style={{
                  filter: 'drop-shadow(0 0 12px rgba(255, 107, 183, 0.8))',
                  animation: 'pulse-glow 2s ease-in-out infinite'
                }}
              />
            </div>
            <h1
              className="text-xl font-bold tracking-wider bg-clip-text text-transparent transition-all duration-300"
              style={{
                backgroundImage: 'linear-gradient(135deg, #ff6bb7 0%, #ff8ba7 50%, #ff6b6b 100%)',
                backgroundSize: '200% auto',
                animation: 'gradient-shift 3s ease infinite'
              }}
            >
              PondX AutoBot
            </h1>
          </Link>

          {/* Center: Navigation */}
          <nav
            className="relative flex items-center justify-center gap-1.5 p-1.5 rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(10, 10, 20, 0.95), rgba(15, 15, 25, 0.95))',
              border: '1px solid rgba(255, 107, 183, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
          >
            {/* Animated background glow */}
            <div
              className="absolute inset-0 rounded-2xl opacity-30 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, rgba(255, 107, 183, 0.05), rgba(255, 139, 167, 0.05), rgba(255, 107, 107, 0.05))',
                backgroundSize: '200% auto',
                animation: 'gradient-shift 6s ease infinite'
              }}
            />

            {/* Dashboard Link */}
            <NavLink
              href="/"
              active={pathname === '/'}
              icon={<DashboardIcon />}
              label="Dashboard"
              color="orange"
            />

            {/* Swapper Link */}
            <NavLink
              href="/swapper"
              active={isSwapperRoute}
              icon={<SwapIcon />}
              label="Swapper"
              color="pink"
            />

            {/* Activity Link */}
            <NavLink
              href="/activity"
              active={pathname === '/activity'}
              icon={<ActivityIcon />}
              label="Activity"
              color="purple"
            />
          </nav>

          {/* Right: Controls */}
          <div className="flex items-center justify-end gap-2">
            {/* Theme Toggle */}
            <button
              onClick={onThemeToggle}
              className="group relative px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-300"
              style={{
                background: 'rgba(15, 15, 25, 0.8)',
                border: '1px solid rgba(255, 107, 183, 0.3)',
                color: '#ff6bb7'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 107, 183, 0.6)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 107, 183, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 107, 183, 0.3)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <span className="flex items-center gap-1.5">
                {theme === 'dark' ? '🌙' : '☀️'}
                <span className="hidden sm:inline">{theme === 'dark' ? 'DARK' : 'LIGHT'}</span>
              </span>
            </button>

            {/* Water Effect Toggle */}
            <button
              onClick={onWaterToggle}
              className="group relative px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-300"
              style={{
                background: waterEffect ? 'rgba(74, 143, 184, 0.15)' : 'rgba(15, 15, 25, 0.8)',
                border: `1px solid ${waterEffect ? 'rgba(74, 143, 184, 0.5)' : 'rgba(100, 100, 120, 0.4)'}`,
                color: waterEffect ? '#4a8fb8' : 'rgba(156, 163, 175, 1)'
              }}
              onMouseEnter={(e) => {
                if (waterEffect) {
                  e.currentTarget.style.borderColor = 'rgba(74, 143, 184, 0.8)';
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(74, 143, 184, 0.3)';
                } else {
                  e.currentTarget.style.borderColor = 'rgba(100, 100, 120, 0.6)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = waterEffect ? 'rgba(74, 143, 184, 0.5)' : 'rgba(100, 100, 120, 0.4)';
                e.currentTarget.style.boxShadow = 'none';
              }}
              title={`${waterEffect ? 'Disable' : 'Enable'} pond water effect`}
            >
              <span className="flex items-center gap-1.5">
                {waterEffect ? '💧' : '🌊'}
                <span className="hidden sm:inline">{waterEffect ? 'WATER' : 'WATER'}</span>
              </span>
            </button>

          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes pulse-glow {
          0%, 100% { filter: drop-shadow(0 0 12px rgba(255, 107, 183, 0.8)); }
          50% { filter: drop-shadow(0 0 20px rgba(255, 107, 183, 1)); }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes slideInFromTop {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </header>
  );
}

// NavLink Component
interface NavLinkProps {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  label: string;
  color: "orange" | "pink" | "purple" | "gray";
  hasDropdown?: boolean;
  dropdownOpen?: boolean;
  onDropdownClick?: (e: React.MouseEvent) => void;
}

function NavLink({ href, active, icon, label, color, hasDropdown, dropdownOpen, onDropdownClick }: NavLinkProps) {
  const colorStyles = {
    orange: {
      active: {
        background: 'linear-gradient(135deg, #ff6b35 0%, #ffaa00 100%)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 16px rgba(255, 107, 53, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        color: '#ffffff'
      },
      inactive: {
        color: 'rgba(156, 163, 175, 1)',
        hoverColor: '#ff6b35'
      }
    },
    pink: {
      active: {
        background: 'linear-gradient(135deg, #ff6bb7 0%, #ff6b6b 100%)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 16px rgba(255, 107, 183, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        color: '#ffffff'
      },
      inactive: {
        color: 'rgba(156, 163, 175, 1)',
        hoverColor: '#ff6bb7'
      }
    },
    purple: {
      active: {
        background: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 16px rgba(168, 85, 247, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        color: '#ffffff'
      },
      inactive: {
        color: 'rgba(156, 163, 175, 1)',
        hoverColor: '#a855f7'
      }
    },
    gray: {
      active: {
        background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 16px rgba(107, 114, 128, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        color: '#ffffff'
      },
      inactive: {
        color: 'rgba(156, 163, 175, 1)',
        hoverColor: '#9ca3af'
      }
    }
  };

  const styles = colorStyles[color];

  const content = (
    <span className="flex items-center gap-2 relative z-10">
      <span className="w-4 h-4 transition-transform duration-300 group-hover:scale-110">
        {icon}
      </span>
      <span>{label}</span>
      {hasDropdown && (
        <svg
          className="w-3 h-3 transition-transform duration-300"
          style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </span>
  );

  const commonProps = {
    className: "group relative px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cyber-black",
    style: active ? styles.active : {
      background: 'transparent',
      border: '1px solid transparent',
      color: styles.inactive.color
    },
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      if (!active) {
        e.currentTarget.style.color = styles.inactive.hoverColor;
        e.currentTarget.style.background = `${styles.inactive.hoverColor}08`;
        e.currentTarget.style.borderColor = `${styles.inactive.hoverColor}30`;
      }
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      if (!active) {
        e.currentTarget.style.color = styles.inactive.color;
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.borderColor = 'transparent';
      }
    }
  };

  if (hasDropdown) {
    return (
      <button {...commonProps} onClick={onDropdownClick}>
        {content}
      </button>
    );
  }

  return (
    <Link {...commonProps} href={href}>
      {content}
    </Link>
  );
}

// Icon Components
function DashboardIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
    </svg>
  );
}

function ActivityIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}
