/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./src/**/*.html"],
  theme: {
    extend: {
      colors: {
        mono: {
          black: "#1a1a1a",
          dark: "#000000",
          gray: {
            light: "#f5f5f5",
            border: "#e8e8e8",
            input: "#d0d0d0",
            text: "#666666",
            muted: "#999999",
          },
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
