/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        accent: 'var(--color-accent)',
        text: 'var(--color-text)',
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        'surface-hover': 'var(--color-surface-hover)',
        border: 'var(--color-border)',
        success: 'var(--color-success)',
        error: 'var(--color-error)',
        warning: 'var(--color-warning)',
        info: 'var(--color-info)',
        pending: 'var(--color-pending)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      transitionTimingFunction: {
        'theme': 'var(--transition-ease)',
      },
      transitionDuration: {
        'theme': 'var(--transition-speed)',
      },
    },
  },
  plugins: [],
};