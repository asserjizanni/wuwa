/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── New cinematic palette (maps to CSS variables) ──
        bg:         { DEFAULT: 'var(--bg)', 2: 'var(--bg-2)', 3: 'var(--bg-3)' },
        surface:    { DEFAULT: 'var(--surface)', 2: 'var(--surface-2)', 3: 'var(--surface-3)' },
        border:     { DEFAULT: 'var(--border)', accent: 'var(--border-accent)' },
        cyan:       { DEFAULT: 'var(--cyan)',  dim: 'var(--cyan-dim)',  glow: 'var(--cyan-glow)' },
        gold:       { DEFAULT: 'var(--gold)',  dim: 'var(--gold-dim)',  glow: 'var(--gold-glow)' },
        violet:     { DEFAULT: 'var(--violet)', dim: 'var(--violet-dim)' },
        tx:         { 1: 'var(--text-1)', 2: 'var(--text-2)', 3: 'var(--text-3)' },

        // ── Keep old names for backward compat with admin ──
        background:  { DEFAULT: '#030508', secondary: '#080c14', tertiary: '#0c1220', card: '#0f1829' },
        'bg-2':      '#080c14',
        'surface-old': { DEFAULT: '#0f1829', raised: '#152038', overlay: '#1a2847' },
        accent: {
          cyan:   { DEFAULT: '#00c8ff', light: '#7aeeff', dark: '#0099bb', muted: 'rgba(0,200,255,0.12)' },
          blue:   { DEFAULT: '#2563eb', electric: '#3b82f6', deep: '#1d4ed8' },
          violet: { DEFAULT: '#7c3aed', light: '#a78bfa', glow: 'rgba(124,58,237,0.4)' },
        },
        element: {
          aero:    '#38bdf8',
          spectro: '#fbbf24',
          fusion:  '#ef4444',
          electro: '#a855f7',
          glacio:  '#bfdbfe',
          havoc:   '#6b21a8',
        },
        text: {
          primary:   '#eef4ff',
          secondary: '#8fa8c4',
          muted:     '#4d6580',
          accent:    '#00c8ff',
        },
        status: {
          success:    '#10b981',
          warning:    '#f59e0b',
          error:      '#ef4444',
          info:       '#3b82f6',
          processing: '#8b5cf6',
        },
      },
      fontFamily: {
        sans:    ['var(--font-arabic)', 'Noto Sans Arabic', 'Tahoma', 'system-ui', 'sans-serif'],
        latin:   ['var(--font-latin)',  'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-arabic)', 'Noto Sans Arabic', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Courier New', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      boxShadow: {
        'glow-cyan':    '0 0 24px rgba(0,200,255,0.3)',
        'glow-gold':    '0 0 24px rgba(232,163,46,0.3)',
        'glow-cyan-sm': '0 0 12px rgba(0,200,255,0.2)',
        'card':         '0 8px 48px rgba(0,0,0,0.7)',
        'card-hover':   '0 16px 64px rgba(0,0,0,0.8)',
      },
      animation: {
        'shimmer':      'shimmer 1.8s linear infinite',
        'float-up':     'float-up var(--dur,10s) linear infinite',
        'fade-in-up':   'fade-in-up 0.6s ease-out',
        'fade-in':      'fade-in 0.4s ease-out',
        'pulse-slow':   'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      screens: {
        xs:   '480px',
        '3xl': '1920px',
      },
      transitionDuration: {
        350: '350ms',
        400: '400ms',
        600: '600ms',
      },
    },
  },
  plugins: [],
}
