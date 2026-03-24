/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#1e3a8a',
          light: '#2563eb',
        },
        orange: {
          accent: '#f97316',
        },
      },
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in-up':  'fadeInUp 0.4s ease-out forwards',
        'fade-in':     'fadeIn 0.3s ease-out forwards',
        'scale-in':    'scaleIn 0.3s ease-out forwards',
        'shimmer':     'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}
