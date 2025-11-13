import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./styles/**/*.css"
  ],
  theme: {
    extend: {
      colors: {
        // Ember Fire Colors (Primary Palette)
        'ember-orange': '#ff6b35',       // Vibrant Orange (primary)
        'ember-orange-light': '#ff8c61', // Light Orange (accents)
        'ember-orange-dark': '#e85d2d',  // Deep Orange
        'ember-red': '#ff3c38',          // Fiery Red
        'ember-red-light': '#ff6961',    // Light Red
        'ember-red-dark': '#d32f2f',     // Deep Red
        'ember-crimson': '#dc2626',      // Crimson Fire

        // Amber Gold Colors (Secondary)
        'ember-amber': '#fbbf24',        // Amber 400 (golden glow)
        'ember-amber-light': '#fcd34d',  // Amber 300 (light gold)
        'ember-amber-dark': '#f59e0b',   // Amber 500 (deep gold)
        'ember-gold': '#f97316',         // Orange 500 (rich gold)
        'ember-yellow': '#facc15',       // Yellow 400 (bright)

        // Ember Accent Colors
        'ember-peach': '#fb923c',        // Orange 400 (warm peach)
        'ember-coral': '#ff7f50',        // Coral (orange-red blend)
        'ember-rose': '#f43f5e',         // Rose 500 (pink-red)

        // Success & Status Colors
        'neon-green': '#10b981',         // Emerald 500 (keep for success)
        'neon-green-light': '#34d399',   // Emerald 400

        // Dark Backgrounds (Warmer tones)
        'cyber-black': '#0a0a0a',
        'cyber-dark': '#1a0f0a',         // Slight warm tint
        'cyber-darker': '#2a1810',       // Warmer dark brown-black

        // Grid Lines
        'grid-ember': '#331a00',         // Ember grid
        'grid-fire': '#4d1f00',          // Fire grid
      },
      boxShadow: {
        // Ember Orange Glows (Primary)
        'ember-orange': '0 0 10px theme(colors.ember-orange), 0 0 20px theme(colors.ember-orange), 0 0 30px theme(colors.ember-orange)',
        'ember-orange-md': '0 0 8px theme(colors.ember-orange), 0 0 15px theme(colors.ember-orange)',
        'ember-orange-sm': '0 0 4px theme(colors.ember-orange), 0 0 8px theme(colors.ember-orange)',
        'ember-orange-intense': '0 0 15px theme(colors.ember-orange), 0 0 30px theme(colors.ember-orange), 0 0 45px theme(colors.ember-orange)',

        // Ember Red Glows
        'ember-red': '0 0 10px theme(colors.ember-red), 0 0 20px theme(colors.ember-red), 0 0 30px theme(colors.ember-red)',
        'ember-red-md': '0 0 8px theme(colors.ember-red), 0 0 15px theme(colors.ember-red)',
        'ember-red-sm': '0 0 4px theme(colors.ember-red), 0 0 8px theme(colors.ember-red)',

        // Amber Gold Glows
        'ember-amber': '0 0 10px theme(colors.ember-amber), 0 0 20px theme(colors.ember-amber), 0 0 30px theme(colors.ember-amber)',
        'ember-amber-md': '0 0 8px theme(colors.ember-amber), 0 0 15px theme(colors.ember-amber)',
        'ember-amber-sm': '0 0 4px theme(colors.ember-amber), 0 0 8px theme(colors.ember-amber)',

        // Gold Glows
        'ember-gold': '0 0 10px theme(colors.ember-gold), 0 0 20px theme(colors.ember-gold)',
        'ember-gold-sm': '0 0 4px theme(colors.ember-gold), 0 0 8px theme(colors.ember-gold)',

        // Peach/Coral Glows
        'ember-peach': '0 0 8px theme(colors.ember-peach), 0 0 15px theme(colors.ember-peach)',
        'ember-coral': '0 0 8px theme(colors.ember-coral), 0 0 15px theme(colors.ember-coral)',

        // Green success glows (keep)
        'neon-green': '0 0 10px theme(colors.neon-green), 0 0 20px theme(colors.neon-green)',
        'neon-green-sm': '0 0 4px theme(colors.neon-green), 0 0 8px theme(colors.neon-green)',
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
        'border-flow': {
          '0%': { borderColor: 'theme(colors.neon-pink)' },
          '50%': { borderColor: 'theme(colors.neon-rose)' },
          '100%': { borderColor: 'theme(colors.neon-pink)' }
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' }
        }
      },
      animation: {
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
        'neon-flicker': 'neon-flicker 5s linear infinite',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'led-pulse': 'led-pulse 2s ease-in-out infinite',
        'border-flow': 'border-flow 3s linear infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      backdropBlur: {
        'cyber': '20px',
      }
    }
  },
  plugins: []
};

export default config;
