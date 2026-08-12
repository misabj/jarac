/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      'xs': '400px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        background: '#0b1120',
        card: '#111827',
        'card-hover': '#1a2436',
        primary: '#22c55e',
        'primary-dim': '#16a34a',
        secondary: '#38bdf8',
        'secondary-dim': '#0ea5e9',
        danger: '#ef4444',
        warning: '#f59e0b',
        muted: '#94a3b8',
        border: '#1f2937',
        text: '#f8fafc',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-card': 'linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(56,189,248,0.04) 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0b1120 0%, #111827 60%, #0f2738 100%)',
        'gradient-primary': 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%)',
        'gradient-colored': 'linear-gradient(135deg, #ef4444 0%, #f59e0b 35%, #38bdf8 70%, #22c55e 100%)',
        'gradient-mesh':
          'radial-gradient(at 20% 10%, rgba(34,197,94,0.18) 0px, transparent 40%), radial-gradient(at 80% 0%, rgba(56,189,248,0.18) 0px, transparent 45%), radial-gradient(at 50% 100%, rgba(245,158,11,0.10) 0px, transparent 50%)',
        'shimmer':
          'linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.08) 50%, transparent 65%)',
      },
      boxShadow: {
        'glow-primary': '0 0 30px -8px rgba(34,197,94,0.55)',
        'glow-secondary': '0 0 30px -8px rgba(56,189,248,0.55)',
        'glow-warning': '0 0 30px -8px rgba(245,158,11,0.55)',
        'card': '0 4px 24px -8px rgba(0,0,0,0.55)',
        'card-hover': '0 18px 48px -16px rgba(0,0,0,0.7), 0 0 0 1px rgba(34,197,94,0.25)',
      },
      keyframes: {
        'page-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.92)' },
          '70%': { opacity: '1', transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(34,197,94,0.35)' },
          '50%': { boxShadow: '0 0 0 14px rgba(34,197,94,0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'count-up': {
          from: { opacity: '0', transform: 'translateY(6px) scale(0.96)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'page-in': 'page-in 400ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 350ms ease-out both',
        'fade-up': 'fade-up 500ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'pop-in': 'pop-in 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both',
        shimmer: 'shimmer 2.4s linear infinite',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        float: 'float 5s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'count-up': 'count-up 500ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'spin-slow': 'spin-slow 14s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
