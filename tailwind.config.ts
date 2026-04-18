import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        background: '#070a12',
        foreground: '#e7edf7',
        card: '#0d1323',
        muted: '#9bb0d1',
        accent: '#6ee7ff',
        primary: '#8b8dff',
        success: '#34d399',
        warning: '#fbbf24',
        danger: '#f87171'
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(142, 163, 255, 0.2), 0 20px 40px rgba(7, 10, 18, 0.55)'
      },
      backgroundImage: {
        'signal-grid': 'radial-gradient(circle at 1px 1px, rgba(139, 141, 255, 0.18) 1px, transparent 0)',
        'hero-radial': 'radial-gradient(1200px 500px at 10% -10%, rgba(139,141,255,0.28), transparent 65%), radial-gradient(1000px 400px at 90% 0%, rgba(110,231,255,0.2), transparent 60%)'
      }
    }
  },
  plugins: []
} satisfies Config;
