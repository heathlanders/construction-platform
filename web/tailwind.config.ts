import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class', // DESIGN.md §2.6 — .dark on <html>, driven by ThemeProvider
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        // Semantic surface tokens — theme-aware via CSS vars in globals.css
        // (light + .dark). Use bg-surface / bg-app / text-ink / text-muted /
        // border-line so pages theme automatically. See DESIGN.md §2.2.
        surface: {
          DEFAULT: 'var(--c-surface)',
          alt: 'var(--c-surface-alt)',
        },
        app: 'var(--c-app-bg)',
        ink: 'var(--c-text)',
        muted: 'var(--c-text-muted)',
        line: 'var(--c-border)',
        overlay: 'var(--c-overlay)',
        rail: {
          DEFAULT: 'var(--c-rail)',
          alt: 'var(--c-rail-2)',
          text: 'var(--c-rail-text)',
        },
        // Canonical status colors — DESIGN.md §2.3. Mirrors STATUS in
        // mobile/src/lib/theme.ts. Values are CSS vars so status themes with
        // the mode (light hexes canonical; dark = brighter fg + tinted bg).
        // Use text-status-*/bg-status-*-bg on badges; never inline a status hex.
        status: {
          success: 'var(--c-status-success)',
          'success-bg': 'var(--c-status-success-bg)',
          danger: 'var(--c-status-danger)',
          'danger-bg': 'var(--c-status-danger-bg)',
          'danger-hover': 'var(--c-status-danger-hover)',
          info: 'var(--c-status-info)',
          'info-bg': 'var(--c-status-info-bg)',
          warning: 'var(--c-status-warning)',
          'warning-bg': 'var(--c-status-warning-bg)',
          action: 'var(--c-status-action)',
          'action-bg': 'var(--c-status-action-bg)',
          neutral: 'var(--c-status-neutral)',
          'neutral-bg': 'var(--c-status-neutral-bg)',
        },
      },
    },
  },
  plugins: [],
};

export default config;
