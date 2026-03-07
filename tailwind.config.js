/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          navy: {
            50: '#EEF2F8',
            100: '#D4DCE8',
            200: '#A8B9D1',
            300: '#7C96BA',
            400: '#4F73A3',
            500: '#2B5CA8',
            600: '#1B3A6B',
            700: '#142D54',
            800: '#0F2647',
            900: '#0A1A33',
            950: '#060F1F',
          },
          crimson: {
            50: '#FEF2F2',
            100: '#FDE3E3',
            200: '#FBC7C7',
            300: '#F89A9A',
            400: '#F06060',
            500: '#E53535',
            600: '#C92A2A',
            700: '#A12020',
            800: '#861D1D',
            900: '#6F1D1D',
          },
          gold: {
            50: '#FFFBEB',
            100: '#FEF3C7',
            200: '#FDE68A',
            300: '#FCD34D',
            400: '#FBBF24',
            500: '#D4A017',
            600: '#C8962E',
            700: '#A16207',
            800: '#854D0E',
            900: '#713F12',
          },
          cream: '#FFFBF5',
          'cream-dark': '#F5EDE3',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
