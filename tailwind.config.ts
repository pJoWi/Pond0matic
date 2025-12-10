import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./styles/**/*.css"
  ],
  safelist: [
    // Theme system classes
    'dashboard-container',
    'dashboard-container-wide',
    'glass-card',
    'theme-glow',
    'theme-glow-intense',
    'theme-glow-subtle',
    'theme-border',
    'theme-border-hover',
    'theme-border-glow',
    'theme-gradient-bg',
    'theme-gradient-text',
    'theme-button',
    'theme-button-solid',
    'theme-input',
    'theme-text-primary',
    'theme-text-secondary',
    'theme-text-accent',
    'theme-text-muted',
    'theme-text-glow',
    'compact-spacing',
    'compact-spacing-sm',
    'compact-gap',
    'compact-gap-sm',
    'premium-panel',
    'sleek-divider',
    'status-dot',
    'floating-label',
    'bg-theme-surface',
    'bg-theme-primary',
    'transition-theme',

    // Modern UI Effects
    'glass-premium',
    'glass-intense',
    'mesh-gradient-bg',
    'neomorph-soft',
    'neomorph-pressed',
    'magnetic-hover',
    'gradient-flow',
    'gradient-shimmer',
    'particle-bg',
    'bento-grid',
    'bento-card',
    'bento-card-large',
    'card-3d',
    'card-3d-inner',
    'glow-theme',
    'glow-theme-intense',
    'button-liquid',
    'nav-frosted',
    'scroll-reveal',
    'skeleton',
    'ripple-effect',
    'spring-bounce',
    'gradient-text-theme',
    'backdrop-blur-premium',
    'backdrop-blur-intense',
    'transform-gpu',
    'smooth-transition',
    'spring-transition',
    'star-field',
    'floating-orb',
    'border-animate',
    'scan-line',

    // Animations
    'animate-gradient',
    'animate-pulse-slow',
    'animate-bounce-subtle',
    'animate-gradient-x',
    'animate-ice-sparkle',
    'animate-fire-glow',
    'animate-flame-flicker',
    'animate-flame-flicker-delayed',
    'animate-void-pulse',
    'animate-matrix-glow',
    'animate-circuit-pulse',
    'animate-ember-pulse',
    'animate-ember-pulse-delayed',
  ],
  theme: {
    extend: {
      colors: {
        // Space/Background Colors
        'space-black': '#050507',
        'space-deep': '#0a0a0f',

        // Diamond Ice Theme Colors (Rewards)
        'ice-cyan': '#00d4ff',
        'ice-light': '#7dd3fc',
        'ice-pale': '#a5f3fc',
        'ice-white': '#e0f7ff',

        // Fire Theme Colors (Boost)
        'fire-orange': '#ff6b35',
        'fire-amber': '#fbbf24',
        'fire-red': '#ef4444',
        'fire-gold': '#fcd34d',

        // Void Theme Colors (Void)
        'void-purple': '#a855f7',
        'void-light': '#c084fc',
        'void-deep': '#7c3aed',
        'void-pink': '#e879f9',

        // Mining Theme Colors (Mining Rig)
        'mining-green': '#22c55e',
        'mining-blue': '#3b82f6',
        'mining-yellow': '#eab308',
        'mining-lime': '#4ade80',

        // Pond0x Mystical Theme Colors
        'pond-water': '#1a3a52',
        'pond-deep': '#0d1f2d',
        'pond-light': '#2d5f7f',
        'pond-bright': '#4a8fb8',
        'lily-green': '#4a7c59',
        'lily-light': '#6b9d78',
        'lily-bright': '#8bc49f',
        'gold': '#d4a444',
        'gold-light': '#f0c674',
        'pink-soft': '#f8c8dc',
        'pink-bright': '#ffc0e3',
        'text-gold': '#f0c674',
        'text-secondary': '#b8d4e6',
        'text-muted': '#9ca3af',

        // Magic/Fantasy Theme Colors
        'magic-purple': '#8a2be2',
        'magic-pink': '#ff69b4',
        'magic-gold': '#ffd700',
        'magic-lavender': '#7b5ea7',
        'magic-rose': '#f8c8dc',
        'magic-azure': '#a8d8ea',
        'magic-indigo': '#1e1b4b',

        // Legacy ember colors for backwards compatibility
        'ember-orange': '#ff6b35',
        'ember-orange-light': '#ff8c61',
        'ember-orange-dark': '#e85d2d',
        'ember-red': '#ff3c38',
        'ember-red-light': '#ff6961',
        'ember-red-dark': '#d32f2f',
        'ember-crimson': '#dc2626',
        'ember-amber': '#fbbf24',
        'ember-amber-light': '#fcd34d',
        'ember-amber-dark': '#f59e0b',
        'ember-gold': '#f97316',
        'ember-yellow': '#facc15',
        'ember-peach': '#fb923c',
        'ember-coral': '#ff7f50',
        'ember-rose': '#f43f5e',

        // Success & Status Colors
        'neon-green': '#10b981',
        'neon-green-light': '#34d399',

        // Dark Backgrounds
        'cyber-black': '#0a0a0a',
        'cyber-dark': '#0f0f14',
        'cyber-darker': '#1a1a24',
      },
      boxShadow: {
        // Ice/Diamond Glows (Rewards)
        'ice': '0 0 10px rgba(0, 212, 255, 0.5), 0 0 20px rgba(0, 212, 255, 0.3), 0 0 30px rgba(0, 212, 255, 0.1)',
        'ice-sm': '0 0 4px rgba(0, 212, 255, 0.4), 0 0 8px rgba(0, 212, 255, 0.2)',
        'ice-intense': '0 0 15px rgba(0, 212, 255, 0.7), 0 0 30px rgba(0, 212, 255, 0.5), 0 0 45px rgba(0, 212, 255, 0.3)',

        // Fire Glows (Boost)
        'fire': '0 0 10px rgba(255, 107, 53, 0.5), 0 0 20px rgba(255, 107, 53, 0.3), 0 0 30px rgba(255, 107, 53, 0.1)',
        'fire-sm': '0 0 4px rgba(255, 107, 53, 0.4), 0 0 8px rgba(255, 107, 53, 0.2)',
        'fire-intense': '0 0 15px rgba(255, 107, 53, 0.7), 0 0 30px rgba(255, 107, 53, 0.5), 0 0 45px rgba(255, 107, 53, 0.3)',

        // Void Glows (Space)
        'void': '0 0 10px rgba(168, 85, 247, 0.5), 0 0 20px rgba(168, 85, 247, 0.3), 0 0 30px rgba(168, 85, 247, 0.1)',
        'void-sm': '0 0 4px rgba(168, 85, 247, 0.4), 0 0 8px rgba(168, 85, 247, 0.2)',
        'void-intense': '0 0 15px rgba(168, 85, 247, 0.7), 0 0 30px rgba(168, 85, 247, 0.5), 0 0 45px rgba(168, 85, 247, 0.3)',

        // Mining Glows (Tech)
        'mining': '0 0 10px rgba(34, 197, 94, 0.5), 0 0 20px rgba(34, 197, 94, 0.3), 0 0 30px rgba(34, 197, 94, 0.1)',
        'mining-sm': '0 0 4px rgba(34, 197, 94, 0.4), 0 0 8px rgba(34, 197, 94, 0.2)',
        'mining-intense': '0 0 15px rgba(34, 197, 94, 0.7), 0 0 30px rgba(34, 197, 94, 0.5), 0 0 45px rgba(34, 197, 94, 0.3)',

        // Pond0x Glows (Mystical)
        'lily': '0 0 10px rgba(107, 157, 120, 0.5), 0 0 20px rgba(107, 157, 120, 0.3), 0 0 30px rgba(107, 157, 120, 0.1)',
        'lily-sm': '0 0 4px rgba(107, 157, 120, 0.4), 0 0 8px rgba(107, 157, 120, 0.2)',
        'lily-intense': '0 0 15px rgba(107, 157, 120, 0.7), 0 0 30px rgba(107, 157, 120, 0.5), 0 0 45px rgba(107, 157, 120, 0.3)',
        'pond': '0 0 10px rgba(74, 143, 184, 0.5), 0 0 20px rgba(74, 143, 184, 0.3)',
        'gold-glow': '0 0 10px rgba(240, 198, 116, 0.6), 0 0 20px rgba(240, 198, 116, 0.4)',
        'pink-glow': '0 0 10px rgba(255, 192, 227, 0.5), 0 0 20px rgba(255, 192, 227, 0.3)',

        // Magic Glows (Fantasy)
        'magic': '0 0 10px rgba(138, 43, 226, 0.5), 0 0 20px rgba(138, 43, 226, 0.3), 0 0 30px rgba(138, 43, 226, 0.1)',
        'magic-sm': '0 0 4px rgba(138, 43, 226, 0.4), 0 0 8px rgba(138, 43, 226, 0.2)',
        'magic-intense': '0 0 15px rgba(138, 43, 226, 0.7), 0 0 30px rgba(138, 43, 226, 0.5), 0 0 45px rgba(138, 43, 226, 0.3)',

        // Legacy ember shadows for backwards compatibility
        'ember-orange': '0 0 10px rgba(255, 107, 53, 0.5), 0 0 20px rgba(255, 107, 53, 0.3), 0 0 30px rgba(255, 107, 53, 0.1)',
        'ember-orange-sm': '0 0 4px rgba(255, 107, 53, 0.4), 0 0 8px rgba(255, 107, 53, 0.2)',
        'ember-amber': '0 0 10px rgba(251, 191, 36, 0.5), 0 0 20px rgba(251, 191, 36, 0.3)',
        'ember-amber-sm': '0 0 4px rgba(251, 191, 36, 0.4), 0 0 8px rgba(251, 191, 36, 0.2)',

        // Green success glows
        'neon-green': '0 0 10px rgba(16, 185, 129, 0.5), 0 0 20px rgba(16, 185, 129, 0.3)',
        'neon-green-sm': '0 0 4px rgba(16, 185, 129, 0.4), 0 0 8px rgba(16, 185, 129, 0.2)',
      },
      keyframes: {
        'neon-pulse': {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 4px currentColor, 0 0 8px currentColor'
          },
          '50%': {
            opacity: '0.85',
            boxShadow: '0 0 8px currentColor, 0 0 15px currentColor'
          }
        },
        'neon-flicker': {
          '0%, 100%': { opacity: '1' },
          '41.99%': { opacity: '1' },
          '42%': { opacity: '0.8' },
          '43%': { opacity: '1' },
          '45.99%': { opacity: '1' },
          '46%': { opacity: '0.8' },
          '46.5%': { opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        'glow-pulse': {
          '0%, 100%': {
            filter: 'brightness(1)',
            boxShadow: '0 0 4px currentColor'
          },
          '50%': {
            filter: 'brightness(1.15)',
            boxShadow: '0 0 12px currentColor, 0 0 18px currentColor'
          }
        },
        'led-pulse': {
          '0%, 100%': {
            opacity: '1',
            transform: 'scale(1)'
          },
          '50%': {
            opacity: '0.7',
            transform: 'scale(0.95)'
          }
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        }
      },
      animation: {
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
        'neon-flicker': 'neon-flicker 5s linear infinite',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'led-pulse': 'led-pulse 2s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      backdropBlur: {
        'cyber': '20px',
      },
      maxWidth: {
        'dashboard': '480px',
        'dashboard-wide': '640px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    }
  },
  plugins: []
};

export default config;
