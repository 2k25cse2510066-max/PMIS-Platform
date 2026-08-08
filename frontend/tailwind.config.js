/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0F1B2B',        // near-black navy for text/hero bg
        navy: {
          50: '#EEF3FB', 100: '#D7E3F5', 200: '#AFC7EB', 300: '#87ABE1',
          400: '#5F8FD7', 500: '#1E4C8A', 600: '#173C6D', 700: '#122E54', 800: '#0F1B2B',
          900: '#0B1524', 950: '#060C16',
        },
        saffron: {
          50: '#FFF8EE', 100: '#FFEFD5', 200: '#FFDBA8', 300: '#FFC574',
          400: '#F5A742', 500: '#E8912A', 600: '#C97418', 700: '#A35C10', 800: '#7D460B', 950: '#3B1F04',
        },
        leaf: {
          50: '#EEFBF3', 100: '#D4F5E1', 200: '#A8EBC3', 300: '#6FD99A',
          400: '#3FA66B', 500: '#2C8C56', 600: '#1F6E42', 700: '#185733', 800: '#114226',
        },
        paper: '#F7F5EF',
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        card: '10px',
      },
    },
  },
  plugins: [],
};
