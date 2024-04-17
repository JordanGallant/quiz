/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#010f98',
        secondary: '#6efffa',
        primaryDark: '#000062',
        mediumDark: '#565b61',
        primaryMedium: '#3ec8ff'
      },
    },
  },
  plugins: [],
};
