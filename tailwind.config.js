/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#9b6012',
        'brand-dark': '#7a4d0e',
      },
    },
  },
  plugins: [],
}
