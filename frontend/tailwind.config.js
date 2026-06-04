/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#e9e3da",
        surface:   "#f4efe8",
        card:      "#faf8f4",
        ink:       "#1a1208",
        amber:     "#c4703a",
        forest:    "#2c4a3e",
        muted:     "#7a6a58",
        border:    "rgba(26,18,8,0.09)",
      },
      fontFamily: {
        sans:  ["Outfit", "sans-serif"],
        serif: ["Cormorant Garamond", "serif"],
      },
      boxShadow: {
        card:   "0 2px 16px rgba(26,18,8,0.07), 0 1px 4px rgba(26,18,8,0.04)",
        lift:   "0 8px 40px rgba(26,18,8,0.12), 0 2px 8px rgba(26,18,8,0.06)",
        amber:  "0 4px 24px rgba(196,112,58,0.35)",
        mockup: "0 24px 80px rgba(26,18,8,0.18), 0 8px 24px rgba(26,18,8,0.10)",
      },
    },
  },
  plugins: [],
};