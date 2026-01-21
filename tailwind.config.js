/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'blacktape': {
          50: '#f7f7f8',
          100: '#ededf1',
          200: '#d8d9e0',
          300: '#b6b8c4',
          400: '#8e91a3',
          500: '#717488',
          600: '#5b5d70',
          700: '#4a4c5b',
          800: '#40414d',
          900: '#383943',
          950: '#1a1a1f',
        },
      },
    },
  },
  plugins: [],
}
