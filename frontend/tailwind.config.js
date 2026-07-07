/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Binafsha gradient palitra — brend uslubi
        parchment: "#ECEAFB",
        surface: "#F3F1FB",
        card: "#FBFAFF",
        ink: "#17132B",
        amber: "#7C3AED", // brend binafsha (eski nom saqlangan)
        forest: "#4F46E5", // indigo
        muted: "#6F6A8A",
        border: "rgba(23,19,43,0.09)",
      },
      fontFamily: {
        sans: ["Outfit", "sans-serif"],
        serif: ["Cormorant Garamond", "serif"],
      },
      boxShadow: {
        card: "0 2px 16px rgba(79,70,229,0.07), 0 1px 4px rgba(23,19,43,0.04)",
        lift: "0 8px 40px rgba(124,58,237,0.14), 0 2px 8px rgba(23,19,43,0.06)",
        amber: "0 4px 24px rgba(124,58,237,0.35)",
        mockup: "0 24px 80px rgba(79,70,229,0.18), 0 8px 24px rgba(23,19,43,0.10)",
      },
    },
  },
  plugins: [],
};
