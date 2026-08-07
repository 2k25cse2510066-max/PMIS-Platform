/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F1B2B',        // near-black navy for text/hero bg
        navy: {
          50: '#EEF3FB', 100: '#D7E3F5', 200: '#AFC7EB', 300: '#87ABE1',
          500: '#1E4C8A', 600: '#173C6D', 700: '#122E54', 800: '#0F1B2B',
        },
        saffron: {
          400: '#F5A742', 500: '#E8912A', 600: '#C97418',
        },
        leaf: {
          400: '#3FA66B', 500: '#2C8C56', 600: '#1F6E42',
        },
        paper: '#F7F5EF',
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  plugins: [],
};
