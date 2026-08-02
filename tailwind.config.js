/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          main: '#09090b',
          card: '#121215',
          input: '#18181b',
        },
        border: {
          DEFAULT: '#27272a',
          focus: '#7c3aed',
        },
        purple: {
          main: '#7c3aed',
          hover: '#6d28d9',
        },
        text: {
          hi: '#f4f4f5',
          mid: '#a1a1aa',
          low: '#71717a',
        },
        success: '#10b981',
        danger: '#ef4444',
        'danger-bg': 'rgba(239, 68, 68, 0.12)',
      },
      borderRadius: {
        lg: '16px',
        md: '10px',
        sm: '8px',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
}
