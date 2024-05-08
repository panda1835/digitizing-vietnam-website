/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        garamond: ["Garamond", "serif"],
        halyard: ["Halyard Display", "sans-serif"],
      },
      colors: {
        "primary-blue": "#00196e",
        "primary-yellow": "#ffad1d",
        "primary-gray": "#e1e1de",
        secondary: "#F9A41A",
      },
    },
  },
  plugins: [],
};
