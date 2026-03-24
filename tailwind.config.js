/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media',
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
    },
  },
  plugins: [],
}
