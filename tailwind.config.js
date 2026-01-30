/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#0285BF',
        'brand-light': '#03A9F4',
        'brand-gray': '#EEF0F1',
        'brand-white': '#FFFFFF',
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'],
        heading: ['Roboto', 'system-ui', 'sans-serif'],
        script: ['Allura', 'cursive'],
        title: ['Playfair Display', 'serif'],
        futura: ['Futura Now Headline', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
