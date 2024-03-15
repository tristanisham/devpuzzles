/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{handlebars,ts,tsx,jsx}", "./views/**/*.{handlebars,ts,js,tsx,jsx}"],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography'), require("tailwindcss-animate"), require("daisyui")],
  daisyui: {
    themes: [
      "forest",
      "emerald"
    ]
  }
}

